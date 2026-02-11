function CmsTableList({ tables, selectedId, onSelect, onCreate }) {
  return (
    <div className="cms-table-list">
      <div className="cms-table-list-header">
        <h2>Tables</h2>
        <button onClick={onCreate}>+ Nouvelle</button>
      </div>

      {tables.length === 0 ? (
        <div className="cms-empty-list">Aucune table</div>
      ) : (
        tables.map((t) => (
          <button
            key={t.id}
            className={`cms-table-item ${selectedId === t.id ? "active" : ""}`}
            onClick={() => onSelect(t.id)}
          >
            <span className="cms-table-item-name">{t.displayName}</span>
          </button>
        ))
      )}
    </div>
  );
}

export default CmsTableList;
