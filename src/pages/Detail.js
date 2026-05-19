import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getObjectById, updateObject } from "../services/api";

function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [object, setObject] = useState({
    name: "",
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

  const loadObject = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getObjectById(id);
      setObject(response.data);
    } catch (err) {
      setError("Ошибка загрузки объекта. Возможно, объект не найден.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObject();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setObject({
      ...object,
      [name]: value,
    });
  };

  const validateForm = () => {
    if (!object.name.trim()) {
      alert("Введите название объекта.");
      return false;
    }

    if (!object.address.trim()) {
      alert("Введите адрес объекта.");
      return false;
    }

    if (!object.buildingType.trim()) {
      alert("Укажите тип здания.");
      return false;
    }

    if (!object.riskLevel.trim()) {
      alert("Выберите уровень риска.");
      return false;
    }

    if (!object.lastInspectionDate.trim()) {
      alert("Укажите дату последней проверки.");
      return false;
    }

    if (!object.status.trim()) {
      alert("Укажите статус объекта.");
      return false;
    }

    if (!object.inspector.trim()) {
      alert("Введите ФИО инспектора.");
      return false;
    }

    if (object.description.trim().length < 10) {
      alert("Описание должно содержать минимум 10 символов.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await updateObject(id, object);
      alert("Данные объекта успешно обновлены.");
      navigate("/");
    } catch (err) {
      alert("Ошибка обновления данных.");
    }
  };

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

  return (
    <div style={styles.wrapper}>
      <h2>Детальная информация и редактирование объекта</h2>

      <form style={styles.form} onSubmit={handleSubmit}>
        <label style={styles.label}>
          Название объекта:
          <input
            style={styles.input}
            type="text"
            name="name"
            value={object.name}
            onChange={handleChange}
          />
        </label>

        <label style={styles.label}>
          Адрес:
          <input
            style={styles.input}
            type="text"
            name="address"
            value={object.address}
            onChange={handleChange}
          />
        </label>

        <label style={styles.label}>
          Тип здания:
          <input
            style={styles.input}
            type="text"
            name="buildingType"
            value={object.buildingType}
            onChange={handleChange}
          />
        </label>

        <label style={styles.label}>
          Уровень риска:
          <select
            style={styles.input}
            name="riskLevel"
            value={object.riskLevel}
            onChange={handleChange}
          >
            <option value="">Выберите уровень риска</option>
            <option value="Низкий">Низкий</option>
            <option value="Средний">Средний</option>
            <option value="Высокий">Высокий</option>
            <option value="Критический">Критический</option>
          </select>
        </label>

        <label style={styles.label}>
          Дата последней проверки:
          <input
            style={styles.input}
            type="date"
            name="lastInspectionDate"
            value={object.lastInspectionDate}
            onChange={handleChange}
          />
        </label>

        <label style={styles.label}>
          Статус:
          <select
            style={styles.input}
            name="status"
            value={object.status}
            onChange={handleChange}
          >
            <option value="">Выберите статус</option>
            <option value="Безопасно">Безопасно</option>
            <option value="Требуется ремонт">Требуется ремонт</option>
            <option value="Требуется повторная проверка">
              Требуется повторная проверка
            </option>
            <option value="Эксплуатация ограничена">
              Эксплуатация ограничена
            </option>
            <option value="Опасно">Опасно</option>
          </select>
        </label>

        <label style={styles.label}>
          Инспектор:
          <input
            style={styles.input}
            type="text"
            name="inspector"
            value={object.inspector}
            onChange={handleChange}
          />
        </label>

        <label style={styles.label}>
          Описание:
          <textarea
            style={styles.textarea}
            name="description"
            value={object.description}
            onChange={handleChange}
          />
        </label>

        <div style={styles.buttons}>
          <button style={styles.saveButton} type="submit">
            Сохранить изменения
          </button>

          <Link style={styles.backButton} to="/">
            Назад
          </Link>
        </div>
      </form>
    </div>
  );
}

const styles = {
  wrapper: {
    maxWidth: "700px",
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
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
    marginTop: "10px",
  },
  saveButton: {
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  backButton: {
    backgroundColor: "#6b7280",
    color: "white",
    textDecoration: "none",
    padding: "10px 15px",
    borderRadius: "5px",
  },
  error: {
    color: "red",
    fontWeight: "bold",
  },
};

export default Detail;