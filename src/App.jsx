import { useState, useEffect } from "react";
import { LayoutDashboard, CheckSquare, Dumbbell, ChevronDown } from "lucide-react";
import "./App.css";
import HabitTracker from "./components/HabitTracker";
import WorkoutTracker from "./components/WorkoutTracker";
import Dashboard from "./components/Dashboard";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const check = () => {
      const scrollTop = window.scrollY;
      const windowH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      setCanScroll(docH > windowH + 40 && scrollTop + windowH < docH - 20);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    const obs = new MutationObserver(check);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      obs.disconnect();
    };
  }, [activeTab]);

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
              <LayoutDashboard size={14} /> Dashboard
            </button>
            <button
              className={`nav-tab ${activeTab === "habits" ? "active" : ""}`}
              onClick={() => setActiveTab("habits")}
            >
              <CheckSquare size={14} /> Habitudes
            </button>
            <button
              className={`nav-tab ${activeTab === "workout" ? "active" : ""}`}
              onClick={() => setActiveTab("workout")}
            >
              <Dumbbell size={14} /> Entraînement
            </button>
          </nav>
        </header>

        {/* Main Content */}
        <div className="main-content">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "habits" && <HabitTracker />}
          {activeTab === "workout" && <WorkoutTracker />}
        </div>

        {/* Mobile Navigation */}
        <nav className="mobile-nav">
          <button
            className={`mobile-nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={20} />
            <span>Home</span>
          </button>
          <button
            className={`mobile-nav-btn ${activeTab === "habits" ? "active" : ""}`}
            onClick={() => setActiveTab("habits")}
          >
            <CheckSquare size={20} />
            <span>Habits</span>
          </button>
          <button
            className={`mobile-nav-btn ${activeTab === "workout" ? "active" : ""}`}
            onClick={() => setActiveTab("workout")}
          >
            <Dumbbell size={20} />
            <span>Workout</span>
          </button>
        </nav>
      </div>

      <div className={`scroll-fade${canScroll ? "" : " hidden"}`}>
        <ChevronDown size={18} />
      </div>
    </main>
  );
}

export default App;
