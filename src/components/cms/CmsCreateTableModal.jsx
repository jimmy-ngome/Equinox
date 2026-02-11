import { useState } from "react";

const COLUMN_TYPES = [
  { value: "text", label: "Texte" },
  { value: "integer", label: "Nombre entier" },
  { value: "decimal", label: "Décimal" },
  { value: "boolean", label: "Booléen" },
  { value: "date", label: "Date" },
  { value: "json", label: "JSON" },
];

const emptyColumn = () => ({
  columnName: "",
  displayName: "",
  columnType: "text",
  isRequired: false,
});

function CmsCreateTableModal({ onClose, onCreated }) {
  const [tableName, setTableName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [columns, setColumns] = useState([emptyColumn()]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addColumn = () => setColumns([...columns, emptyColumn()]);

  const removeColumn = (i) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter((_, idx) => idx !== i));
  };

  const updateColumn = (i, field, value) => {
    const updated = [...columns];
    updated[i] = { ...updated[i], [field]: value };
    setColumns(updated);
  };

  const handleSubmit = async () => {
    setError("");

    if (!tableName || !displayName) {
      setError("Nom technique et nom d'affichage requis");
      return;
    }

    for (const col of columns) {
      if (!col.columnName) {
        setError("Chaque colonne doit avoir un nom technique");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cms/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableName, displayName, description, columns }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la création");
        return;
      }

      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal cms-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Nouvelle Table</h2>

        {error && (
          <div style={{ color: "#ff4444", fontSize: "0.75rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label>Nom technique</label>
          <input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="ex: articles"
          />
        </div>

        <div className="form-group">
          <label>Nom d'affichage</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="ex: Articles du blog"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optionnel"
          />
        </div>

        <div className="cms-column-builder">
          <div className="cms-column-builder-header">
            <label>Colonnes</label>
            <button onClick={addColumn}>+ Colonne</button>
          </div>

          {columns.map((col, i) => (
            <div key={i} className="cms-column-row">
              <input
                type="text"
                value={col.columnName}
                onChange={(e) =>
                  updateColumn(i, "columnName", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                placeholder="nom_technique"
              />
              <input
                type="text"
                value={col.displayName}
                onChange={(e) => updateColumn(i, "displayName", e.target.value)}
                placeholder="Nom affiché"
              />
              <select
                value={col.columnType}
                onChange={(e) => updateColumn(i, "columnType", e.target.value)}
              >
                {COLUMN_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="cms-col-required" title="Requis">
                <input
                  type="checkbox"
                  checked={col.isRequired}
                  onChange={(e) => updateColumn(i, "isRequired", e.target.checked)}
                />
              </div>
              <button className="cms-col-remove" onClick={() => removeColumn(i)}>
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Création..." : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CmsCreateTableModal;
