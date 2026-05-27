import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createObject, getObjectById, updateObject } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { canAccessObject, getInspectorName, isManager } from "../utils/permissions";

function Form() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEditMode = Boolean(id);

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
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState("");
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadObject = async () => {
      if (!isEditMode) {
        if (user && !isManager(user)) {
          setObject((current) => ({
            ...current,
            inspector: getInspectorName(user),
          }));
        }

        setLoading(false);
        return;
      }

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
  }, [id, isEditMode, user]);

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

    if (!object.city.trim()) {
      alert("Введите город объекта.");
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
      const payload = {
        ...object,
        inspector: isManager(user) ? object.inspector : getInspectorName(user),
      };

      if (isEditMode) {
        await updateObject(id, payload);
        alert("Данные объекта успешно обновлены.");
      } else {
        await createObject(payload);
        alert("Объект успешно добавлен.");
      }

      navigate("/");
    } catch (err) {
      alert(isEditMode ? "Ошибка обновления данных объекта." : "Ошибка добавления объекта. Проверьте работу сервера.");
    }
  };

  if (loading) {
    return <p>Загрузка формы...</p>;
  }

  if (error) {
    return (
      <div>
        <p style={styles.error}>{error}</p>
        <Link style={styles.backButton} to="/">
          Назад
        </Link>
      </div>
    );
  }

  if (isEditMode && !hasAccess) {
    return (
      <div>
        <p style={styles.error}>У вас нет доступа к редактированию этого объекта.</p>
        <Link style={styles.backButton} to="/">
          Назад
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <h2>{isEditMode ? "Редактирование объекта" : "Добавление нового объекта"}</h2>

      <form style={styles.form} onSubmit={handleSubmit}>
        <label style={styles.label}>
          Название объекта:
          <input
            style={styles.input}
            type="text"
            name="name"
            value={object.name}
            onChange={handleChange}
            placeholder="Например: Торговый центр Север"
          />
        </label>

        <label style={styles.label}>
          Город:
          <input
            style={styles.input}
            type="text"
            name="city"
            value={object.city}
            onChange={handleChange}
            placeholder="Например: Казань"
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
            placeholder="Например: ул. Центральная, 15"
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
            placeholder="Жилое, общественное, производственное"
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
            readOnly={!isManager(user)}
            placeholder="Например: Иванов И.И."
          />
        </label>

        <label style={styles.label}>
          Описание:
          <textarea
            style={styles.textarea}
            name="description"
            value={object.description}
            onChange={handleChange}
            placeholder="Опишите результаты проверки или выявленные нарушения"
          />
        </label>

        <div style={styles.buttons}>
          <button style={styles.saveButton} type="submit">
            {isEditMode ? "Сохранить изменения" : "Добавить объект"}
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

export default Form;