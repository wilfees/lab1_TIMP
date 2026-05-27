import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getObjects, deleteObject } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { filterObjectsByUser, canAccessObject } from "../utils/permissions";

function Home() {
  const { user } = useAuth();
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadObjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getObjects();
      setObjects(response.data);
    } catch (err) {
      setError("Ошибка загрузки данных. Проверьте, запущен ли json-server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObjects();
  }, []);

  const visibleObjects = filterObjectsByUser(objects, user);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Вы действительно хотите удалить этот объект?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const targetObject = objects.find((item) => item.id === id);

      if (!canAccessObject(user, targetObject)) {
        alert("Удалять можно только собственные объекты.");
        return;
      }

      await deleteObject(id);
      setObjects(objects.filter((item) => item.id !== id));
    } catch (err) {
      alert("Ошибка удаления объекта.");
    }
  };

  if (loading) {
    return <p>Загрузка данных...</p>;
  }

  if (error) {
    return <p style={styles.error}>{error}</p>;
  }

  return (
    <div>
      <div style={styles.topBlock}>
        <h2>Реестр проверок безопасности</h2>

        <Link style={styles.addButton} to="/add">
          Добавить объект
        </Link>
      </div>

      {visibleObjects.length === 0 ? (
        <p>Объекты отсутствуют или у вас нет доступа к чужим записям.</p>
      ) : (
        <div style={styles.cards}>
          {visibleObjects.map((item) => (
            <div key={item.id} style={styles.card}>
              <h3>{item.name}</h3>

              <p>
                <strong>Город:</strong> {item.city}
              </p>

              <p>
                <strong>Адрес:</strong> {item.address}
              </p>

              <p>
                <strong>Тип здания:</strong> {item.buildingType}
              </p>

              <p>
                <strong>Уровень риска:</strong>{" "}
                <span style={getRiskStyle(item.riskLevel)}>
                  {item.riskLevel}
                </span>
              </p>

              <p>
                <strong>Статус:</strong> {item.status}
              </p>

              <p>
                <strong>Дата проверки:</strong> {item.lastInspectionDate}
              </p>

              <div style={styles.actions}>
                <Link style={styles.detailButton} to={`/detail/${item.id}`}>
                  Подробнее
                </Link>

                {canAccessObject(user, item) ? (
                  <button
                    style={styles.deleteButton}
                    onClick={() => handleDelete(item.id)}
                  >
                    Удалить
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getRiskStyle(riskLevel) {
  if (riskLevel === "Низкий") {
    return { color: "green", fontWeight: "bold" };
  }

  if (riskLevel === "Средний") {
    return { color: "#ca8a04", fontWeight: "bold" };
  }

  if (riskLevel === "Высокий") {
    return { color: "orange", fontWeight: "bold" };
  }

  if (riskLevel === "Критический") {
    return { color: "red", fontWeight: "bold" };
  }

  return { fontWeight: "bold" };
}

const styles = {
  topBlock: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  },
  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "15px",
  },
  addButton: {
    backgroundColor: "#16a34a",
    color: "white",
    textDecoration: "none",
    padding: "10px 15px",
    borderRadius: "5px",
  },
  detailButton: {
    backgroundColor: "#2563eb",
    color: "white",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: "5px",
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  error: {
    color: "red",
    fontWeight: "bold",
  },
};

export default Home;