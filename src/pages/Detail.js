import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getObjectById } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { canAccessObject } from "../utils/permissions";

function Detail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [object, setObject] = useState({
    name: "",
    city: "",
    address: "",
    buildingType: "",
    riskLevel: "",
    lastInspectionDate: "",
    status: "",
    inspector: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadObject = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getObjectById(id);

        if (!isMounted) {
          return;
        }

        setObject(response.data);
        setHasAccess(canAccessObject(user, response.data));
      } catch (err) {
        if (isMounted) {
          setError("Ошибка загрузки объекта. Возможно, объект не найден.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadObject();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  if (loading) {
    return <p>Загрузка объекта...</p>;
  }

  if (error) {
    return (
      <div>
        <p style={styles.error}>{error}</p>
        <Link to="/">Вернуться на главную</Link>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div>
        <p style={styles.error}>У вас нет доступа к этому объекту.</p>
        <Link to="/">Вернуться на главную</Link>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <div>
          <p style={styles.kicker}>Карточка объекта</p>
          <h2 style={styles.title}>{object.name}</h2>
        </div>

        <div style={styles.buttons}>
          <Link style={styles.editButton} to={`/edit/${id}`}>
            Редактировать
          </Link>

          <Link style={styles.backButton} to="/">
            Назад
          </Link>
        </div>
      </div>

      <div style={styles.cardGrid}>
        <div style={styles.cardItem}>
          <span style={styles.cardLabel}>Город</span>
          <span style={styles.cardValue}>{object.city}</span>
        </div>

        <div style={styles.cardItem}>
          <span style={styles.cardLabel}>Адрес</span>
          <span style={styles.cardValue}>{getFullAddress(object.city, object.address)}</span>
        </div>

        <div style={styles.cardItem}>
          <span style={styles.cardLabel}>Тип здания</span>
          <span style={styles.cardValue}>{object.buildingType}</span>
        </div>

        <div style={styles.cardItem}>
          <span style={styles.cardLabel}>Уровень риска</span>
          <span style={{ ...styles.cardValue, ...getRiskStyle(object.riskLevel) }}>{object.riskLevel}</span>
        </div>

        <div style={styles.cardItem}>
          <span style={styles.cardLabel}>Статус</span>
          <span style={styles.cardValue}>{object.status}</span>
        </div>

        <div style={styles.cardItem}>
          <span style={styles.cardLabel}>Дата последней проверки</span>
          <span style={styles.cardValue}>{object.lastInspectionDate}</span>
        </div>

        <div style={styles.cardItem}>
          <span style={styles.cardLabel}>Инспектор</span>
          <span style={styles.cardValue}>{object.inspector}</span>
        </div>
      </div>

      <div style={styles.descriptionBlock}>
        <span style={styles.cardLabel}>Описание</span>
        <p style={styles.descriptionText}>{object.description}</p>
      </div>

      <div style={styles.mapBlock}>
        <div style={styles.mapHeader}>
          <div>
            <span style={styles.cardLabel}>Карта</span>
            <h3 style={styles.mapTitle}>Расположение объекта</h3>
          </div>

          <a
            style={styles.mapLink}
            href={getMapLink(object.city, object.address)}
            target="_blank"
            rel="noreferrer"
          >
            Открыть в карте
          </a>
        </div>

        <div style={styles.mapFrameWrap}>
          <iframe
            title={`Карта объекта ${object.name}`}
            src={getMapEmbedUrl(object.city, object.address)}
            style={styles.mapFrame}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <p style={styles.mapNote}>
          {getFullAddress(object.city, object.address)
            ? `Адрес на карте: ${getFullAddress(object.city, object.address)}`
            : "Адрес не указан, карта не может быть построена."}
        </p>
      </div>
    </div>
  );
}

function getFullAddress(city, address) {
  const parts = [city, address].map((part) => String(part || "").trim()).filter(Boolean);

  return parts.join(", ");
}

function getMapEmbedUrl(city, address) {
  const query = encodeURIComponent(getFullAddress(city, address));

  if (!query) {
    return "https://www.google.com/maps?q=&output=embed";
  }

  return `https://www.google.com/maps?q=${query}&output=embed`;
}

function getMapLink(city, address) {
  const query = encodeURIComponent(getFullAddress(city, address));

  if (!query) {
    return "https://www.google.com/maps";
  }

  return `https://www.google.com/maps/search/?api=1&query=${query}`;
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
  wrapper: {
    maxWidth: "960px",
    backgroundColor: "white",
    padding: "28px",
    borderRadius: "16px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  kicker: {
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
  },
  title: {
    margin: "8px 0 0",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "18px",
  },
  cardItem: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    backgroundColor: "#f8fafc",
  },
  cardLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  cardValue: {
    fontSize: "16px",
    color: "#0f172a",
  },
  descriptionBlock: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "18px",
    backgroundColor: "#f8fafc",
  },
  descriptionText: {
    margin: 0,
    color: "#334155",
    lineHeight: 1.7,
  },
  mapBlock: {
    marginTop: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "18px",
    backgroundColor: "#f8fafc",
  },
  mapHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  mapTitle: {
    margin: "6px 0 0",
    color: "#0f172a",
  },
  mapLink: {
    display: "inline-block",
    backgroundColor: "#0f172a",
    color: "white",
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: "999px",
    fontWeight: 700,
  },
  mapFrameWrap: {
    overflow: "hidden",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#e2e8f0",
  },
  mapFrame: {
    width: "100%",
    height: "360px",
    border: 0,
    display: "block",
  },
  mapNote: {
    margin: "12px 0 0",
    color: "#475569",
    fontSize: "14px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontWeight: "bold",
    gap: "5px",
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  textarea: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    minHeight: "100px",
  },
  buttons: {
    display: "flex",
    gap: "10px",
  },
  editButton: {
    backgroundColor: "#16a34a",
    color: "white",
    textDecoration: "none",
    padding: "10px 15px",
    borderRadius: "999px",
    fontWeight: 700,
  },
  backButton: {
    backgroundColor: "#6b7280",
    color: "white",
    textDecoration: "none",
    padding: "10px 15px",
    borderRadius: "999px",
  },
  error: {
    color: "red",
    fontWeight: "bold",
  },
};

export default Detail;