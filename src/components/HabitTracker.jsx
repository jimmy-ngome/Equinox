import { useState, useEffect } from "react";
import CalendarOverview from "./CalendarOverview";
import "./HabitTracker.css";

const HABIT_COLORS = [
  "#22d3ee", "#a78bfa", "#f472b6", "#fb923c", "#4ade80",
  "#facc15", "#f87171", "#60a5fa", "#e879f9", "#34d399",
];

const iconOptions = ["⭐", "🧘", "📚", "💪", "💧", "🍬", "✍️", "🏃", "😴", "🥗", "💊", "🎯"];

const HabitTracker = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [newHabit, setNewHabit] = useState({ name: "", icon: "⭐", color: "#22d3ee", time: "Matin" });

  const fetchHabits = async () => {
    try {
      const res = await fetch("/api/habits");
      const data = await res.json();
      setHabits(data);
    } catch (err) {
      console.error("Erreur chargement habitudes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const toggleHabit = async (id) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const newCompleted = !habit.completedToday;
    const newStreak = newCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1);

    setHabits(habits.map(h =>
      h.id === id ? { ...h, completedToday: newCompleted, streak: newStreak } : h
    ));

    try {
      await fetch(`/api/habits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedToday: newCompleted, streak: newStreak, date: new Date().toISOString().split("T")[0] }),
      });
    } catch (err) {
      console.error("Erreur toggle habitude:", err);
      fetchHabits();
    }
  };

  const addHabit = async () => {
    if (!newHabit.name.trim()) return;

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHabit),
      });
      const created = await res.json();
      setHabits([...habits, created]);
      setNewHabit({ name: "", icon: "⭐", color: "#22d3ee", time: "Matin" });
      setShowAddModal(false);
    } catch (err) {
      console.error("Erreur ajout habitude:", err);
    }
  };

  const openEditModal = (habit) => {
    setEditingHabit({
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      color: habit.color || "#22d3ee",
      time: habit.time,
    });
  };

  const saveEdit = async () => {
    if (!editingHabit || !editingHabit.name.trim()) return;

    const { id, name, icon, color, time } = editingHabit;

    setHabits(habits.map(h =>
      h.id === id ? { ...h, name, icon, color, time } : h
    ));
    setEditingHabit(null);

    try {
      await fetch(`/api/habits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, icon, color, time }),
      });
    } catch (err) {
      console.error("Erreur modification habitude:", err);
      fetchHabits();
    }
  };

  const deleteHabit = async (id) => {
    setHabits(habits.filter(h => h.id !== id));

    try {
      await fetch(`/api/habits/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Erreur suppression habitude:", err);
      fetchHabits();
    }
  };

  const completedCount = habits.filter(h => h.completedToday).length;
  const progressPercent = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;

  if (loading) {
    return (
      <div className="habit-tracker">
        <div className="tracker-header">
          <div>
            <h1>Habitudes</h1>
            <p className="subtitle">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="habit-tracker">
      <div className="tracker-header">
        <div>
          <h1>Habitudes</h1>
          <p className="subtitle">Aujourd'hui</p>
        </div>
        <button className="add-btn" onClick={() => setShowAddModal(true)}>
          <span>+</span>
        </button>
      </div>

      {/* Progress Ring */}
      <div className="progress-section">
        <div className="progress-ring-container">
          <svg className="progress-ring" viewBox="0 0 120 120">
            <circle
              className="progress-ring-bg"
              cx="60"
              cy="60"
              r="52"
              fill="none"
              strokeWidth="8"
            />
            <circle
              className="progress-ring-fill"
              cx="60"
              cy="60"
              r="52"
              fill="none"
              strokeWidth="8"
              strokeDasharray={`${progressPercent * 3.27} 327`}
              strokeLinecap="round"
            />
          </svg>
          <div className="progress-text">
            <span className="progress-count">{completedCount}/{habits.length}</span>
            <span className="progress-label">complétées</span>
          </div>
        </div>
      </div>

      {/* Calendar Overview */}
      <CalendarOverview compact={true} habits={habits} key={completedCount} />

      {/* Habits List */}
      <div className="habits-list">
        {habits.length === 0 ? (
          <div className="empty-state" style={{ textAlign: "center", padding: "2rem 0", opacity: 0.6 }}>
            <p>Aucune habitude. Cliquez + pour en ajouter.</p>
          </div>
        ) : (
          habits.map(habit => (
            <div
              key={habit.id}
              className={`habit-card ${habit.completedToday ? "completed" : ""}`}
            >
              <span
                className="habit-color-tag"
                style={{ background: habit.color || "#22d3ee" }}
              />
              <button
                className="habit-check"
                onClick={() => toggleHabit(habit.id)}
              >
                {habit.completedToday ? "✓" : ""}
              </button>
              <div className="habit-icon">{habit.icon}</div>
              <div
                className="habit-info"
                onClick={() => openEditModal(habit)}
                style={{ cursor: "pointer" }}
              >
                <span className="habit-name">{habit.name}</span>
                <span className="habit-time">{habit.time}</span>
              </div>
              <div className="habit-streak">
                <span className="streak-count">{habit.streak}</span>
                <span className="streak-label">jours</span>
              </div>
              <button className="delete-btn" onClick={() => deleteHabit(habit.id)}>
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nouvelle habitude</h2>

            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                value={newHabit.name}
                onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                placeholder="Ex: Méditation"
              />
            </div>

            <div className="form-group">
              <label>Icône</label>
              <div className="icon-grid">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    className={`icon-option ${newHabit.icon === icon ? "selected" : ""}`}
                    onClick={() => setNewHabit({ ...newHabit, icon })}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Couleur</label>
              <div className="color-grid">
                {HABIT_COLORS.map(c => (
                  <button
                    key={c}
                    className={`color-option ${newHabit.color === c ? "selected" : ""}`}
                    style={{ background: c }}
                    onClick={() => setNewHabit({ ...newHabit, color: c })}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Moment</label>
              <select
                value={newHabit.time}
                onChange={e => setNewHabit({ ...newHabit, time: e.target.value })}
              >
                <option value="Matin">Matin</option>
                <option value="Après-midi">Après-midi</option>
                <option value="Soir">Soir</option>
                <option value="Journée">Toute la journée</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={addHabit}>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingHabit && (
        <div className="modal-overlay" onClick={() => setEditingHabit(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Modifier habitude</h2>

            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                value={editingHabit.name}
                onChange={e => setEditingHabit({ ...editingHabit, name: e.target.value })}
                placeholder="Ex: Méditation"
              />
            </div>

            <div className="form-group">
              <label>Icône</label>
              <div className="icon-grid">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    className={`icon-option ${editingHabit.icon === icon ? "selected" : ""}`}
                    onClick={() => setEditingHabit({ ...editingHabit, icon })}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Couleur</label>
              <div className="color-grid">
                {HABIT_COLORS.map(c => (
                  <button
                    key={c}
                    className={`color-option ${editingHabit.color === c ? "selected" : ""}`}
                    style={{ background: c }}
                    onClick={() => setEditingHabit({ ...editingHabit, color: c })}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Moment</label>
              <select
                value={editingHabit.time}
                onChange={e => setEditingHabit({ ...editingHabit, time: e.target.value })}
              >
                <option value="Matin">Matin</option>
                <option value="Après-midi">Après-midi</option>
                <option value="Soir">Soir</option>
                <option value="Journée">Toute la journée</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditingHabit(null)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={saveEdit}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
