import { useState, useEffect, useMemo } from "react";
import { Flame, Trophy, Target, TrendingUp, Dumbbell, Filter } from "lucide-react";
import CalendarOverview from "./CalendarOverview";
import "./Dashboard.css";

function localToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateStr(raw) {
  // Handle both "YYYY-MM-DD" and "YYYY-MM-DDT..." formats
  if (!raw) return "";
  return typeof raw === "string" ? raw.slice(0, 10) : "";
}

function relativeDate(d) {
  const today = localToday();
  const ds = dateStr(d);
  if (ds === today) return "Aujourd'hui";

  const t = new Date(today + "T00:00:00");
  const target = new Date(ds + "T00:00:00");
  const diff = Math.round((t - target) / (1000 * 60 * 60 * 24));

  if (diff === 1) return "Hier";
  if (diff > 1 && diff < 7) return `Il y a ${diff}j`;
  return new Date(ds + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

const Dashboard = () => {
  const [habitsList, setHabitsList] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [habitFilter, setHabitFilter] = useState("all"); // "all" | habitId

  useEffect(() => {
    const today = localToday();
    const month = today.slice(0, 7);

    Promise.all([
      fetch("/api/habits").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/sessions").then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/habits/completions?month=${month}`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([habitsData, sessionsData, completionsData]) => {
        setHabitsList(habitsData);
        setSessions(sessionsData);
        setCompletions(completionsData);
      })
      .catch((err) => console.error("Erreur chargement dashboard:", err));
  }, []);

  // --- Filtered habits ---
  const filteredHabits = useMemo(() => {
    if (habitFilter === "all") return habitsList;
    return habitsList.filter((h) => String(h.id) === String(habitFilter));
  }, [habitsList, habitFilter]);

  // --- Computed stats (based on filtered) ---
  const habitsToday = filteredHabits.filter((h) => h.completedToday).length;
  const habitsTotal = filteredHabits.length;

  // Streak
  const currentStreak = filteredHabits.length > 0
    ? Math.max(...filteredHabits.map((h) => h.streak || 0))
    : 0;

  const longestStreak = currentStreak;

  // Workouts this week (Monday-based)
  const workoutsThisWeek = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
    const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
    return sessions.filter((s) => dateStr(s.date) >= mondayStr).length;
  }, [sessions]);

  const totalWorkouts = sessions.length;

  // Recent workouts (last 5)
  const recentWorkouts = useMemo(() => {
    return [...sessions]
      .sort((a, b) => dateStr(b.date).localeCompare(dateStr(a.date)))
      .slice(0, 5)
      .map((s) => {
        let name = s.type === "musculation" ? "Musculation" : "Calisthenics";
        if (s.exercises) {
          try {
            const exList = typeof s.exercises === "string" ? JSON.parse(s.exercises) : s.exercises;
            if (Array.isArray(exList) && exList.length > 0) {
              name = exList.map((e) => e.name || e).filter(Boolean).slice(0, 3).join(", ");
              if (exList.length > 3) name += "...";
            }
          } catch {}
        }
        return {
          name,
          date: relativeDate(s.date),
          type: s.type,
        };
      });
  }, [sessions]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Bonjour, Jimmy</h1>
          <p className="date-display">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        {habitsList.length > 0 && (
          <div className="habit-filter">
            <Filter size={14} />
            <select
              value={habitFilter}
              onChange={(e) => setHabitFilter(e.target.value)}
            >
              <option value="all">Toutes les habitudes</option>
              {habitsList.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.icon} {h.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-icon"><Flame size={20} /></div>
          <div className="stat-content">
            <span className="stat-value">{currentStreak}</span>
            <span className="stat-label">Jours de streak</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Trophy size={20} /></div>
          <div className="stat-content">
            <span className="stat-value">{longestStreak}</span>
            <span className="stat-label">Record streak</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Target size={20} /></div>
          <div className="stat-content">
            <span className="stat-value">{habitsToday}/{habitsTotal}</span>
            <span className="stat-label">Habits aujourd'hui</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div className="stat-content">
            <span className="stat-value">{workoutsThisWeek}</span>
            <span className="stat-label">Workouts cette semaine</span>
          </div>
        </div>
      </div>

      {/* Calendar Overview */}
      <CalendarOverview compact={false} habits={filteredHabits} />

      {/* Recent Activity */}
      <div className="card recent-activity-card">
        <h3>Derniers entraînements</h3>
        <div className="activity-list">
          {recentWorkouts.length === 0 && (
            <div className="activity-item" style={{ justifyContent: "center", color: "var(--text-muted)" }}>
              Aucune séance enregistrée
            </div>
          )}
          {recentWorkouts.map((workout, index) => (
            <div key={index} className="activity-item">
              <div className={`activity-icon ${workout.type}`}>
                <Dumbbell size={16} />
              </div>
              <div className="activity-info">
                <span className="activity-name">{workout.name}</span>
                <span className="activity-date">{workout.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
