import React from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom";
import AuthPage from "./pages/Auth";
import Home from "./pages/Home";
import Detail from "./pages/Detail";
import Form from "./pages/Form";
import { useAuth } from "./context/AuthContext";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={styles.loading}>Проверка сессии...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}

function App() {
  const { user, loading, logout } = useAuth();

  return (
    <BrowserRouter>
      <div style={styles.app}>
        <header style={styles.header}>
          <div style={styles.headerTop}>
            <div>
              <h1 style={styles.title}>Безопасность зданий и сооружений</h1>
              <p style={styles.subtitle}>
                Реестр объектов с доступом только для авторизованных инспекторов.
              </p>
            </div>

            <div style={styles.sessionBox}>
              {loading ? (
                <span style={styles.sessionText}>Проверка профиля...</span>
              ) : user ? (
                <>
                  <span style={styles.sessionText}>
                    {user.fullName} · {user.role === "manager" ? "руководитель" : "инспектор"}
                  </span>
                  <button style={styles.logoutButton} onClick={logout} type="button">
                    Выйти
                  </button>
                </>
              ) : (
                <Link style={styles.link} to="/auth">
                  Вход / регистрация
                </Link>
              )}
            </div>
          </div>

          {user ? (
            <nav style={styles.nav}>
              <Link style={styles.link} to="/">
                Главная
              </Link>
              <Link style={styles.link} to="/add">
                Добавить объект
              </Link>
            </nav>
          ) : null}
        </header>

        <main style={styles.main}>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Home />
                </RequireAuth>
              }
            />
            <Route
              path="/detail/:id"
              element={
                <RequireAuth>
                  <Detail />
                </RequireAuth>
              }
            />
            <Route
              path="/add"
              element={
                <RequireAuth>
                  <Form />
                </RequireAuth>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <RequireAuth>
                  <Form />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

const styles = {
  app: {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f4f6f8",
    minHeight: "100vh",
  },
  header: {
    background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
    color: "white",
    padding: "24px 40px",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
  },
  subtitle: {
    margin: "10px 0 0",
    color: "rgba(255, 255, 255, 0.8)",
  },
  sessionBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  sessionText: {
    color: "rgba(255, 255, 255, 0.92)",
    fontWeight: 600,
  },
  logoutButton: {
    border: "1px solid rgba(255, 255, 255, 0.35)",
    backgroundColor: "transparent",
    color: "white",
    padding: "8px 14px",
    borderRadius: "999px",
    cursor: "pointer",
  },
  nav: {
    display: "flex",
    gap: "15px",
    marginTop: "18px",
  },
  link: {
    color: "white",
    textDecoration: "none",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    padding: "8px 14px",
    borderRadius: "999px",
    border: "1px solid rgba(255, 255, 255, 0.18)",
  },
  main: {
    padding: "30px 40px",
  },
  loading: {
    minHeight: "200px",
    display: "grid",
    placeItems: "center",
    color: "#334155",
    fontSize: "18px",
  },
};

export default App;