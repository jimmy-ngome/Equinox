import { useState, useEffect } from "react";

function CmsRowModal({ tableId, columns, row, onClose, onSaved }) {
  const [values, setValues] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = !!row;

  useEffect(() => {
    if (row) {
      const initial = {};
      columns.forEach((col) => {
        initial[col.columnName] = row[col.columnName] ?? "";
      });
      setValues(initial);
    } else {
      const initial = {};
      columns.forEach((col) => {
        initial[col.columnName] = col.columnType === "boolean" ? false : "";
      });
      setValues(initial);
    }
  }, [row, columns]);

  const setValue = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const url = isEdit
        ? `/api/cms/tables/${tableId}/rows/${row.id}`
        : `/api/cms/tables/${tableId}/rows`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }

      onSaved(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (col) => {
    const val = values[col.columnName];

    switch (col.columnType) {
      case "boolean":
        return (
          <div className="cms-checkbox-field">
            <input
              type="checkbox"
              checked={!!val}
              onChange={(e) => setValue(col.columnName, e.target.checked)}
            />
            <span>{val ? "Oui" : "Non"}</span>
          </div>
        );
      case "integer":
        return (
          <input
            type="number"
            step="1"
            value={val}
            onChange={(e) => setValue(col.columnName, e.target.value)}
            placeholder={col.displayName}
          />
        );
      case "decimal":
        return (
          <input
            type="number"
            step="0.01"
            value={val}
            onChange={(e) => setValue(col.columnName, e.target.value)}
            placeholder={col.displayName}
          />
        );
      case "date":
        return (
          <input
            type="datetime-local"
            value={val ? val.slice(0, 16) : ""}
            onChange={(e) => setValue(col.columnName, e.target.value)}
          />
        );
      case "json":
        return (
          <textarea
            value={typeof val === "string" ? val : JSON.stringify(val, null, 2)}
            onChange={(e) => setValue(col.columnName, e.target.value)}
            placeholder='{"key": "value"}'
          />
        );
      default:
        return (
          <input
            type="text"
            value={val}
            onChange={(e) => setValue(col.columnName, e.target.value)}
            placeholder={col.displayName}
          />
        );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal cms-row-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{isEdit ? "Modifier" : "Ajouter"}</h2>

        {error && (
          <div style={{ color: "#ff4444", fontSize: "0.75rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {columns.map((col) => (
          <div className="form-group" key={col.columnName}>
            <label>
              {col.displayName || col.columnName}
              {col.isRequired && " *"}
            </label>
            {renderField(col)}
          </div>
        ))}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Enregistrement..." : isEdit ? "Modifier" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CmsRowModal;
