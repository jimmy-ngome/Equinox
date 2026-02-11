import { useState, useEffect } from "react";
import CalendarOverview from "./CalendarOverview";
import "./Dashboard.css";

const Dashboard = () => {
  const [stats, setStats] = useState({
    currentStreak: 12,
    longestStreak: 28,
    habitsToday: 4,
    habitsTotal: 6,
    workoutsThisWeek: 4,
    totalWorkouts: 156,
  });

  const [habitsList, setHabitsList] = useState([]);

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const res = await fetch("/api/habits");
        if (res.ok) {
          const data = await res.json();
          setHabitsList(data);
          setStats(prev => ({
            ...prev,
            habitsTotal: data.length,
            habitsToday: data.filter(h => h.completedToday).length,
          }));
        }
      } catch (err) {
        console.error("Erreur chargement habitudes:", err);
      }
    };
    fetchHabits();
  }, []);

  const [recentWorkouts, setRecentWorkouts] = useState([
    { name: "Push Day", date: "Aujourd'hui", duration: "52 min", type: "musculation" },
    { name: "Calisthenics", date: "Hier", duration: "45 min", type: "calisthenics" },
    { name: "Pull Day", date: "Il y a 2j", duration: "48 min", type: "musculation" },
  ]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Bonjour, Jimmy</h1>
        <p className="date-display">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <span className="stat-value">{stats.currentStreak}</span>
            <span className="stat-label">Jours de streak</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <span className="stat-value">{stats.longestStreak}</span>
            <span className="stat-label">Record streak</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <span className="stat-value">{stats.habitsToday}/{stats.habitsTotal}</span>
            <span className="stat-label">Habits aujourd'hui</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💪</div>
          <div className="stat-content">
            <span className="stat-value">{stats.workoutsThisWeek}</span>
            <span className="stat-label">Workouts cette semaine</span>
          </div>
        </div>
      </div>

      {/* Calendar Overview */}
      <CalendarOverview compact={false} habits={habitsList} />

      {/* Recent Activity */}
      <div className="card recent-activity-card">
        <h3>Derniers entraînements</h3>
        <div className="activity-list">
          {recentWorkouts.map((workout, index) => (
            <div key={index} className="activity-item">
              <div className={`activity-icon ${workout.type}`}>
                {workout.type === "musculation" ? "🏋️" : "🤸"}
              </div>
              <div className="activity-info">
                <span className="activity-name">{workout.name}</span>
                <span className="activity-date">{workout.date}</span>
              </div>
              <span className="activity-duration">{workout.duration}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn primary">
          <span>+</span> Nouveau workout
        </button>
        <button className="action-btn secondary">
          <span>◎</span> Check habits
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
