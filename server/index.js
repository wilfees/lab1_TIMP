const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const tls = require("tls");
const { URL } = require("url");

const PORT = Number(process.env.AUTH_PORT || 4000);
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "auth-db.json");
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const OTP_TTL_MS = 1000 * 60 * 10;

function ensureStorageFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ users: [], challenges: [], sessions: [] }, null, 2),
      "utf8"
    );
  }
}

function readDb() {
  ensureStorageFile();

  const raw = fs.readFileSync(DB_FILE, "utf8");
  const db = JSON.parse(raw);

  return {
    users: Array.isArray(db.users) ? db.users : [],
    challenges: Array.isArray(db.challenges) ? db.challenges : [],
    sessions: Array.isArray(db.sessions) ? db.sessions : [],
  };
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

function pruneExpiredEntries(db) {
  const now = Date.now();

  db.challenges = db.challenges.filter((challenge) => challenge.expiresAt > now);
  db.sessions = db.sessions.filter((session) => session.expiresAt > now);

  return db;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function createId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return crypto.randomBytes(16).toString("hex");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");

  if (!salt || !hash) {
    return false;
  }

  const candidate = crypto.scryptSync(String(password), salt, 64).toString("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(candidate, "hex")
    );
  } catch (error) {
    return false;
  }
}

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function requireToken(req) {
  const header = String(req.headers.authorization || "");

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

function resolveSession(db, token) {
  const session = db.sessions.find((item) => item.token === token);

  if (!session || session.expiresAt <= Date.now()) {
    return null;
  }

  const user = db.users.find((item) => item.id === session.userId);
  if (!user) {
    return null;
  }

  return { session, user };
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });

  res.end(body);
}

function sendEmpty(res, statusCode) {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });

  res.end();
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1e6) {
        reject(new Error("Body too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}

function createSmtpResponseReader(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
    };

    const onError = (error) => {
      cleanup();
      reject(error);
    };

    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);

      if (!lines.length) {
        return;
      }

      const lastLine = lines[lines.length - 1];

      if (/^\d{3} /.test(lastLine)) {
        cleanup();
        resolve({ code: Number(lastLine.slice(0, 3)), text: lines.join("\n") });
      }
    };

    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function sendSmtpCommand(socket, command, expectedCodes) {
  socket.write(`${command}\r\n`);
  const response = await createSmtpResponseReader(socket);
  const allowedCodes = Array.isArray(expectedCodes) ? expectedCodes : [expectedCodes];

  if (!allowedCodes.includes(response.code)) {
    throw new Error(`SMTP command failed: ${command} -> ${response.text}`);
  }

  return response;
}

async function sendOtpEmail({ to, code, fullName }) {
  const mailUser = process.env.MAILRU_USER;
  const mailPassword = process.env.MAILRU_PASSWORD;

  if (!mailUser || !mailPassword) {
    console.log(`[auth] Demo OTP for ${to}: ${code}`);
    return { delivery: "demo", demoCode: code };
  }

  const smtpHost = process.env.MAILRU_HOST || "smtp.mail.ru";
  const smtpPort = Number(process.env.MAILRU_PORT || 465);

  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: smtpHost,
        port: smtpPort,
        servername: smtpHost,
      },
      async () => {
        try {
          await createSmtpResponseReader(socket);
          await sendSmtpCommand(socket, "EHLO localhost", 250);
          await sendSmtpCommand(socket, "AUTH LOGIN", 334);
          await sendSmtpCommand(socket, Buffer.from(mailUser, "utf8").toString("base64"), 334);
          await sendSmtpCommand(socket, Buffer.from(mailPassword, "utf8").toString("base64"), 235);
          await sendSmtpCommand(socket, `MAIL FROM:<${process.env.MAILRU_FROM || mailUser}>`, 250);
          await sendSmtpCommand(socket, `RCPT TO:<${to}>`, [250, 251]);
          await sendSmtpCommand(socket, "DATA", 354);

          const encodedSubject = Buffer.from("Security verification code", "utf8").toString("base64");
          const message = [
            `From: ${process.env.MAILRU_FROM || mailUser}`,
            `To: ${to}`,
            "MIME-Version: 1.0",
            "Content-Type: text/plain; charset=utf-8",
            `Subject: =?UTF-8?B?${encodedSubject}?=`,
            "",
            `Здравствуйте, ${fullName || "пользователь"}.`,
            "",
            `Ваш код входа: ${code}`,
            `Он действителен ${Math.round(OTP_TTL_MS / 60000)} минут.`,
            ".",
          ].join("\r\n");

          socket.write(`${message}\r\n`);
          const deliveryResponse = await createSmtpResponseReader(socket);

          if (deliveryResponse.code !== 250) {
            throw new Error(deliveryResponse.text);
          }

          socket.write("QUIT\r\n");
          socket.end();
          resolve({ delivery: "mail" });
        } catch (error) {
          socket.destroy();
          reject(error);
        }
      }
    );

    socket.on("error", reject);
  });
}

async function handleRequest(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const { pathname } = requestUrl;

  if (req.method === "OPTIONS") {
    sendEmpty(res, 204);
    return;
  }

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && pathname === "/api/auth/me") {
    const token = requireToken(req);

    if (!token) {
      sendJson(res, 401, { message: "Нет активной сессии." });
      return;
    }

    const db = pruneExpiredEntries(readDb());
    const activeSession = resolveSession(db, token);

    if (!activeSession) {
      writeDb(db);
      sendJson(res, 401, { message: "Сессия истекла." });
      return;
    }

    writeDb(db);
    sendJson(res, 200, { user: sanitizeUser(activeSession.user), token });
    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/register") {
    const body = await readRequestBody(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();
    const inspectorName = String(body.inspectorName || "").trim();
    const role = body.role === "manager" ? "manager" : "inspector";

    if (!email || !password || !fullName) {
      sendJson(res, 400, { message: "Заполните обязательные поля." });
      return;
    }

    if (role === "inspector" && !inspectorName) {
      sendJson(res, 400, { message: "Укажите ФИО инспектора." });
      return;
    }

    const db = pruneExpiredEntries(readDb());
    const existingUser = db.users.find((user) => user.email === email);

    if (existingUser) {
      sendJson(res, 409, { message: "Пользователь уже зарегистрирован." });
      return;
    }

    const user = {
      id: createId(),
      email,
      passwordHash: hashPassword(password),
      fullName,
      role,
      inspectorName: role === "inspector" ? inspectorName : inspectorName || fullName,
      createdAt: new Date().toISOString(),
    };

    db.users.push(user);
    writeDb(db);
    sendJson(res, 201, { user: sanitizeUser(user) });
    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/login/request-code") {
    const body = await readRequestBody(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    if (!email || !password) {
      sendJson(res, 400, { message: "Укажите email и пароль." });
      return;
    }

    const db = pruneExpiredEntries(readDb());
    const user = db.users.find((item) => item.email === email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      writeDb(db);
      sendJson(res, 401, { message: "Неверный email или пароль." });
      return;
    }

    const challengeId = createId();
    const code = generateOtpCode();

    db.challenges.push({
      id: challengeId,
      userId: user.id,
      code,
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    writeDb(db);

    try {
      const delivery = await sendOtpEmail({
        to: user.email,
        code,
        fullName: user.fullName,
      });

      sendJson(res, 200, {
        challengeId,
        expiresInSeconds: Math.round(OTP_TTL_MS / 1000),
        delivery: delivery.delivery,
        demoCode: delivery.demoCode,
        maskedEmail: `${user.email.slice(0, 2)}***${user.email.slice(user.email.indexOf("@"))}`,
      });
    } catch (error) {
      const currentDb = pruneExpiredEntries(readDb());
      currentDb.challenges = currentDb.challenges.filter((item) => item.id !== challengeId);
      writeDb(currentDb);

      sendJson(res, 502, {
        message: "Не удалось отправить код подтверждения через mail.ru.",
      });
    }

    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/login/verify-code") {
    const body = await readRequestBody(req);
    const challengeId = String(body.challengeId || "").trim();
    const code = String(body.code || "").trim();

    if (!challengeId || !code) {
      sendJson(res, 400, { message: "Укажите код подтверждения." });
      return;
    }

    const db = pruneExpiredEntries(readDb());
    const challengeIndex = db.challenges.findIndex((item) => item.id === challengeId);

    if (challengeIndex < 0) {
      writeDb(db);
      sendJson(res, 400, { message: "Код подтверждения не найден или истек." });
      return;
    }

    const challenge = db.challenges[challengeIndex];

    if (challenge.expiresAt <= Date.now()) {
      db.challenges.splice(challengeIndex, 1);
      writeDb(db);
      sendJson(res, 400, { message: "Код подтверждения истек." });
      return;
    }

    if (challenge.code !== code) {
      writeDb(db);
      sendJson(res, 400, { message: "Неверный код подтверждения." });
      return;
    }

    const user = db.users.find((item) => item.id === challenge.userId);
    if (!user) {
      db.challenges.splice(challengeIndex, 1);
      writeDb(db);
      sendJson(res, 404, { message: "Пользователь не найден." });
      return;
    }

    db.challenges.splice(challengeIndex, 1);

    const token = createId();
    db.sessions.push({
      token,
      userId: user.id,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    writeDb(db);
    sendJson(res, 200, { token, user: sanitizeUser(user) });
    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/logout") {
    const token = requireToken(req);

    if (!token) {
      sendEmpty(res, 204);
      return;
    }

    const db = pruneExpiredEntries(readDb());
    db.sessions = db.sessions.filter((item) => item.token !== token);
    writeDb(db);
    sendEmpty(res, 204);
    return;
  }

  sendJson(res, 404, { message: "Не найдено." });
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  handleRequest(req, res).catch((error) => {
    console.error(error);
    if (!res.headersSent) {
      sendJson(res, 500, { message: "Внутренняя ошибка сервера." });
      return;
    }

    res.end();
  });
});

server.listen(PORT, () => {
  console.log(`Auth server is running on http://localhost:${PORT}`);
});
