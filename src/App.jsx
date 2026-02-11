import { useState } from "react";
import "./App.css";
import HabitTracker from "./components/HabitTracker";
import WorkoutTracker from "./components/WorkoutTracker";
import Dashboard from "./components/Dashboard";
import CmsPanel from "./components/cms/CmsPanel";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <main className="app">
      {/* App Content */}
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="logo">
            <span className="logo-icon">◐</span>
            <span className="logo-text">Equinox</span>
          </div>
          <nav className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`nav-tab ${activeTab === "habits" ? "active" : ""}`}
              onClick={() => setActiveTab("habits")}
            >
              Habitudes
            </button>
            <button
              className={`nav-tab ${activeTab === "workout" ? "active" : ""}`}
              onClick={() => setActiveTab("workout")}
            >
              Entraînement
            </button>
            <button
              className={`nav-tab ${activeTab === "cms" ? "active" : ""}`}
              onClick={() => setActiveTab("cms")}
            >
              CMS
            </button>
          </nav>
        </header>

        {/* Main Content */}
        <div className="main-content">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "habits" && <HabitTracker />}
          {activeTab === "workout" && <WorkoutTracker />}
          {activeTab === "cms" && <CmsPanel />}
        </div>

        {/* Mobile Navigation */}
        <nav className="mobile-nav">
          <button
            className={`mobile-nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="nav-icon">◈</span>
            <span>Home</span>
          </button>
          <button
            className={`mobile-nav-btn ${activeTab === "habits" ? "active" : ""}`}
            onClick={() => setActiveTab("habits")}
          >
            <span className="nav-icon">✓</span>
            <span>Habits</span>
          </button>
          <button
            className={`mobile-nav-btn ${activeTab === "workout" ? "active" : ""}`}
            onClick={() => setActiveTab("workout")}
          >
            <span className="nav-icon">◆</span>
            <span>Workout</span>
          </button>
          <button
            className={`mobile-nav-btn ${activeTab === "cms" ? "active" : ""}`}
            onClick={() => setActiveTab("cms")}
          >
            <span className="nav-icon">⚙</span>
            <span>CMS</span>
          </button>
        </nav>
      </div>
    </main>
  );
}

export default App;
