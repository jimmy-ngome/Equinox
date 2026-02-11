import { useState, useEffect } from "react";
import CmsRowModal from "./CmsRowModal";

function CmsTableView({ tableId, onDeleted }) {
  const [tableMeta, setTableMeta] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRowModal, setShowRowModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  useEffect(() => {
    if (!tableId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/cms/tables/${tableId}`).then((r) => r.json()),
      fetch(`/api/cms/tables/${tableId}/rows`).then((r) => r.json()),
    ])
      .then(([meta, rowData]) => {
        setTableMeta(meta);
        setRows(Array.isArray(rowData) ? rowData : []);
      })
      .finally(() => setLoading(false));
  }, [tableId]);

  const handleDeleteTable = async () => {
    if (!confirm("Supprimer cette table et toutes ses données ?")) return;
    await fetch(`/api/cms/tables/${tableId}`, { method: "DELETE" });
    onDeleted(tableId);
  };

  const handleDeleteRow = async (rowId) => {
    if (!confirm("Supprimer cette ligne ?")) return;
    await fetch(`/api/cms/tables/${tableId}/rows/${rowId}`, { method: "DELETE" });
    setRows(rows.filter((r) => r.id !== rowId));
  };

  const handleRowSaved = (savedRow) => {
    if (editingRow) {
      setRows(rows.map((r) => (r.id === savedRow.id ? savedRow : r)));
    } else {
      setRows([savedRow, ...rows]);
    }
  };

  if (loading) {
    return <div className="cms-loading">Chargement...</div>;
  }

  if (!tableMeta) {
    return <div className="cms-loading">Table introuvable</div>;
  }

  const columns = tableMeta.columns || [];

  return (
    <div className="cms-table-view">
      <div className="cms-table-view-header">
        <div>
          <h2>{tableMeta.displayName}</h2>
          {tableMeta.description && <p>{tableMeta.description}</p>}
        </div>
        <div className="cms-table-actions">
          <button
            onClick={() => {
              setEditingRow(null);
              setShowRowModal(true);
            }}
          >
            + Ligne
          </button>
          <button className="danger" onClick={handleDeleteTable}>
            Supprimer
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="cms-empty-rows">Aucune donnée</div>
      ) : (
        <div className="cms-data-wrapper">
          <table className="cms-data-table">
            <thead>
              <tr>
                <th>ID</th>
                {columns.map((col) => (
                  <th key={col.columnName}>{col.displayName || col.columnName}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  {columns.map((col) => (
                    <td key={col.columnName}>
                      {col.columnType === "boolean"
                        ? row[col.columnName]
                          ? "Oui"
                          : "Non"
                        : col.columnType === "json"
                          ? JSON.stringify(row[col.columnName])
                          : String(row[col.columnName] ?? "")}
                    </td>
                  ))}
                  <td>
                    <div className="cms-row-actions">
                      <button
                        onClick={() => {
                          setEditingRow(row);
                          setShowRowModal(true);
                        }}
                      >
                        Éditer
                      </button>
                      <button className="danger" onClick={() => handleDeleteRow(row.id)}>
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showRowModal && (
        <CmsRowModal
          tableId={tableId}
          columns={columns}
          row={editingRow}
          onClose={() => {
            setShowRowModal(false);
            setEditingRow(null);
          }}
          onSaved={handleRowSaved}
        />
      )}
    </div>
  );
}

export default CmsTableView;
