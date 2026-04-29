import { useState } from "react";
import { X, Check } from "lucide-react";

const DayEditModal = ({ date, habits, completedIds, onClose, onSave }) => {
  const [selected, setSelected] = useState(new Set(completedIds));
  const [saving, setSaving] = useState(false);

  const toggle = (habitId) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(habitId)) next.delete(habitId); else next.add(habitId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Determine additions and removals
      const toAdd = [...selected].filter(id => !completedIds.has(id));
      const toRemove = [...completedIds].filter(id => !selected.has(id));

      await Promise.all([
        ...toAdd.map(habitId =>
          fetch("/api/habits/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ habitId, date }),
          })
        ),
        ...toRemove.map(habitId =>
          fetch("/api/habits/completions", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ habitId, date }),
          })
        ),
      ]);
      onSave();
    } catch (err) {
      console.error("Erreur sauvegarde completions:", err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal day-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="day-edit-header">
          <h2>{formatDate(date)}</h2>
          <button className="day-edit-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="day-edit-list">
          {habits.map(h => (
            <button
              key={h.id}
              className={`day-edit-item ${selected.has(h.id) ? "checked" : ""}`}
              onClick={() => toggle(h.id)}
            >
              <span
                className="day-edit-check"
                style={selected.has(h.id) ? { background: h.color || "#22d3ee", borderColor: h.color || "#22d3ee" } : undefined}
              >
                {selected.has(h.id) && <Check size={12} />}
              </span>
              <span className="day-edit-icon">{h.icon}</span>
              <span className="day-edit-name">{h.name}</span>
            </button>
          ))}
        </div>
        <button
          className="btn-primary day-edit-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Sauvegarde..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
};

export default DayEditModal;
