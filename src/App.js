import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Detail from "./pages/Detail";
import Form from "./pages/Form";

function App() {
  return (
    <BrowserRouter>
      <div style={styles.app}>
        <header style={styles.header}>
          <h1 style={styles.title}>Безопасность зданий и сооружений</h1>

          <nav style={styles.nav}>
            <Link style={styles.link} to="/">
              Главная
            </Link>
            <Link style={styles.link} to="/add">
              Добавить объект
            </Link>
          </nav>
        </header>

        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/detail/:id" element={<Detail />} />
            <Route path="/add" element={<Form />} />
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
    backgroundColor: "#1f2937",
    color: "white",
    padding: "20px 40px",
  },
  title: {
    margin: "0 0 15px 0",
  },
  nav: {
    display: "flex",
    gap: "15px",
  },
  link: {
    color: "white",
    textDecoration: "none",
    backgroundColor: "#2563eb",
    padding: "8px 14px",
    borderRadius: "5px",
  },
  main: {
    padding: "30px 40px",
  },
};

export default App;