import { useState, useEffect } from "react";
import CmsTableList from "./CmsTableList";
import CmsTableView from "./CmsTableView";
import CmsCreateTableModal from "./CmsCreateTableModal";
import "./CmsPanel.css";

function CmsPanel() {
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetch("/api/cms/tables")
      .then((r) => r.json())
      .then((data) => {
        setTables(Array.isArray(data) ? data : []);
      })
      .catch(() => setTables([]))
      .finally(() => setLoading(false));
  }, []);

  const handleTableCreated = (newTable) => {
    setTables([...tables, newTable]);
    setSelectedTableId(newTable.id);
  };

  const handleTableDeleted = (deletedId) => {
    setTables(tables.filter((t) => t.id !== deletedId));
    if (selectedTableId === deletedId) {
      setSelectedTableId(null);
    }
  };

  if (loading) {
    return <div className="cms-loading">Chargement CMS...</div>;
  }

  return (
    <div className="cms-panel">
      <div className="cms-panel-header">
        <h1>CMS</h1>
      </div>

      <div className="cms-layout">
        <CmsTableList
          tables={tables}
          selectedId={selectedTableId}
          onSelect={setSelectedTableId}
          onCreate={() => setShowCreateModal(true)}
        />

        {selectedTableId ? (
          <CmsTableView
            key={selectedTableId}
            tableId={selectedTableId}
            onDeleted={handleTableDeleted}
          />
        ) : (
          <div className="cms-no-selection">
            Sélectionner une table
          </div>
        )}
      </div>

      {showCreateModal && (
        <CmsCreateTableModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTableCreated}
        />
      )}
    </div>
  );
}

export default CmsPanel;
