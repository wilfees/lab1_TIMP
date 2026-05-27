import React, { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const initialRegisterState = {
  fullName: "",
  email: "",
  password: "",
  role: "inspector",
  inspectorName: "",
};

const initialLoginState = {
  email: "",
  password: "",
};

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, register, startLogin, confirmLogin } = useAuth();

  const from = location.state?.from?.pathname || "/";

  const [activeTab, setActiveTab] = useState("login");
  const [registerForm, setRegisterForm] = useState(initialRegisterState);
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [challengeId, setChallengeId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const inspectorLabel = useMemo(() => {
    return registerForm.role === "manager" ? "ФИО для профиля" : "ФИО инспектора";
  }, [registerForm.role]);

  if (user) {
    return <Navigate to={from} replace />;
  }

  const onRegisterChange = (event) => {
    const { name, value } = event.target;

    setRegisterForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const onLoginChange = (event) => {
    const { name, value } = event.target;

    setLoginForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await register(registerForm);
      setMessage("Регистрация завершена. Теперь войдите и подтвердите код из письма.");
      setActiveTab("login");
      setLoginForm({
        email: registerForm.email,
        password: "",
      });
      setRegisterForm(initialRegisterState);
    } catch (err) {
      setError(err.response?.data?.message || "Не удалось зарегистрировать пользователя.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await startLogin(loginForm);
      setChallengeId(response.data.challengeId);
      setDeliveryInfo(response.data);
      setOtpCode("");

      if (response.data.delivery === "demo" && response.data.demoCode) {
        setMessage(`Локальный код подтверждения: ${response.data.demoCode}`);
      } else {
        setMessage(`Код отправлен на ${response.data.maskedEmail}.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Не удалось отправить код подтверждения.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await confirmLogin({ challengeId, code: otpCode });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Не удалось подтвердить код.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.hero}>
        <p style={styles.kicker}>Доступ к реестру объектов</p>
        <h2 style={styles.title}>Регистрация и двухфакторный вход через mail.ru</h2>
        <p style={styles.subtitle}>
          Инспектор видит только объекты, привязанные к его ФИО. Для входа код отправляется на почту.
        </p>
      </div>

      <div style={styles.card}>
        <div style={styles.tabs}>
          <button
            type="button"
            style={activeTab === "login" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("login")}
          >
            Вход
          </button>
          <button
            type="button"
            style={activeTab === "register" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("register")}
          >
            Регистрация
          </button>
        </div>

        {message ? <p style={styles.message}>{message}</p> : null}
        {error ? <p style={styles.error}>{error}</p> : null}

        {activeTab === "register" ? (
          <form style={styles.form} onSubmit={handleRegister}>
            <label style={styles.label}>
              ФИО
              <input
                style={styles.input}
                name="fullName"
                value={registerForm.fullName}
                onChange={onRegisterChange}
                placeholder="Иванов Иван Иванович"
              />
            </label>

            <label style={styles.label}>
              Email
              <input
                style={styles.input}
                name="email"
                type="email"
                value={registerForm.email}
                onChange={onRegisterChange}
                placeholder="name@mail.ru"
              />
            </label>

            <label style={styles.label}>
              Пароль
              <input
                style={styles.input}
                name="password"
                type="password"
                value={registerForm.password}
                onChange={onRegisterChange}
              />
            </label>

            <label style={styles.label}>
              Роль
              <select style={styles.input} name="role" value={registerForm.role} onChange={onRegisterChange}>
                <option value="inspector">Инспектор</option>
                <option value="manager">Руководитель</option>
              </select>
            </label>

            <label style={styles.label}>
              {inspectorLabel}
              <input
                style={styles.input}
                name="inspectorName"
                value={registerForm.inspectorName}
                onChange={onRegisterChange}
                placeholder="Иванов И.И."
              />
            </label>

            <button style={styles.primaryButton} type="submit" disabled={loading}>
              {loading ? "Сохранение..." : "Создать аккаунт"}
            </button>
          </form>
        ) : null}

        {activeTab === "login" && !challengeId ? (
          <form style={styles.form} onSubmit={handleRequestCode}>
            <label style={styles.label}>
              Email
              <input
                style={styles.input}
                name="email"
                type="email"
                value={loginForm.email}
                onChange={onLoginChange}
                placeholder="name@mail.ru"
              />
            </label>

            <label style={styles.label}>
              Пароль
              <input
                style={styles.input}
                name="password"
                type="password"
                value={loginForm.password}
                onChange={onLoginChange}
              />
            </label>

            <button style={styles.primaryButton} type="submit" disabled={loading}>
              {loading ? "Отправка кода..." : "Отправить код"}
            </button>
          </form>
        ) : null}

        {activeTab === "login" && challengeId ? (
          <form style={styles.form} onSubmit={handleVerifyCode}>
            <label style={styles.label}>
              Код из письма
              <input
                style={styles.input}
                name="otpCode"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                placeholder="000000"
              />
            </label>

            {deliveryInfo?.delivery === "demo" ? (
              <p style={styles.helper}>
                Для локальной проверки сервер показал код в интерфейсе. При подключенном mail.ru он придет на почту.
              </p>
            ) : null}

            <button style={styles.primaryButton} type="submit" disabled={loading}>
              {loading ? "Проверка..." : "Подтвердить вход"}
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => {
                setChallengeId("");
                setOtpCode("");
                setDeliveryInfo(null);
                setMessage("");
              }}
            >
              Изменить email или пароль
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 520px)",
    gap: "32px",
    alignItems: "center",
    padding: "48px",
    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 55%, #dbeafe 100%)",
  },
  hero: {
    maxWidth: "620px",
  },
  kicker: {
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: "#475569",
    fontSize: "12px",
    fontWeight: 700,
  },
  title: {
    margin: "12px 0 16px",
    fontSize: "clamp(32px, 4vw, 56px)",
    lineHeight: 1.05,
    color: "#0f172a",
  },
  subtitle: {
    margin: 0,
    maxWidth: "520px",
    color: "#334155",
    fontSize: "18px",
    lineHeight: 1.6,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.12)",
  },
  tabs: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
    marginBottom: "22px",
  },
  tab: {
    border: "none",
    borderRadius: "14px",
    padding: "14px 16px",
    backgroundColor: "#e2e8f0",
    color: "#334155",
    fontWeight: 700,
    cursor: "pointer",
  },
  activeTab: {
    border: "none",
    borderRadius: "14px",
    padding: "14px 16px",
    backgroundColor: "#0f172a",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: "#0f172a",
    fontWeight: 600,
  },
  input: {
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    padding: "13px 14px",
    fontSize: "15px",
    backgroundColor: "white",
  },
  primaryButton: {
    marginTop: "4px",
    border: "none",
    borderRadius: "12px",
    padding: "14px 18px",
    backgroundColor: "#0f172a",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "14px 18px",
    backgroundColor: "white",
    color: "#0f172a",
    fontWeight: 600,
    cursor: "pointer",
  },
  message: {
    margin: "0 0 16px",
    color: "#0f766e",
    backgroundColor: "#ecfeff",
    border: "1px solid #a5f3fc",
    borderRadius: "12px",
    padding: "12px 14px",
  },
  error: {
    margin: "0 0 16px",
    color: "#b91c1c",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "12px 14px",
  },
  helper: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.5,
  },
};

export default AuthPage;
