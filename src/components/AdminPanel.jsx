import { useState, useEffect } from "react";
import { UserCheck, UserX, Clock } from "lucide-react";
import "./AdminPanel.css";

const AdminPanel = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await fetch("/api/admin/pending");
      if (res.ok) setPending(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (userId, action) => {
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) {
        setPending((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch {}
  };

  if (loading) return <div className="admin-loading">Chargement...</div>;

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Demandes d'inscription</h2>
        <span className="admin-count">{pending.length}</span>
      </div>

      {pending.length === 0 ? (
        <div className="admin-empty">Aucune demande en attente</div>
      ) : (
        <div className="admin-list">
          {pending.map((user) => (
            <div key={user.id} className="admin-card">
              <div className="admin-card-info">
                <span className="admin-card-name">{user.name}</span>
                <span className="admin-card-email">{user.email}</span>
                <span className="admin-card-date">
                  <Clock size={12} />
                  {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="admin-card-actions">
                <button
                  className="admin-btn approve"
                  onClick={() => handleAction(user.id, "approve")}
                  title="Accepter"
                >
                  <UserCheck size={16} /> Accepter
                </button>
                <button
                  className="admin-btn reject"
                  onClick={() => handleAction(user.id, "reject")}
                  title="Refuser"
                >
                  <UserX size={16} /> Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
