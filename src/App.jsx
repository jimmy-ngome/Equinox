import { useState, useEffect, useRef } from "react";
import { LayoutDashboard, CheckSquare, Dumbbell, ChevronDown, LogOut } from "lucide-react";
import "./App.css";
import HabitTracker from "./components/HabitTracker";
import WorkoutTracker from "./components/WorkoutTracker";
import Dashboard from "./components/Dashboard";
import AuthScreen from "./components/AuthScreen";
import { DEMO_HABITS, DEMO_COMPLETIONS, DEMO_EXERCISES, DEMO_EXERCISE_LOGS, DEMO_SESSIONS } from "./demoData";

let demoIdCounter = 10000;

function installDemoFetch() {
  const originalFetch = window._originalFetch || window.fetch;
  window._originalFetch = originalFetch;

  // Mutable demo state
  const state = {
    habits: [...DEMO_HABITS],
    completions: [...DEMO_COMPLETIONS],
    exercises: [...DEMO_EXERCISES],
    exerciseLogs: [...DEMO_EXERCISE_LOGS],
    sessions: [...DEMO_SESSIONS],
  };

  window._demoState = state;

  window.fetch = async (url, options = {}) => {
    const path = typeof url === "string" ? url : url.toString();
    const method = (options.method || "GET").toUpperCase();
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
    const body = options.body ? JSON.parse(options.body) : {};

    // Auth
    if (path.includes("/api/auth/me")) return json({ id: 0, name: "Visiteur Demo", email: "demo@demo.com", role: "admin" });
    if (path.includes("/api/auth/login")) return json({ error: "Mode demo" }, 400);
    if (path.includes("/api/auth/logout")) return json({ ok: true });
    if (path.includes("/api/auth/setup")) return json({ needsSetup: false });

    // Habits
    if (path === "/api/habits" && method === "GET") {
      const todayStr = new Date().toISOString().split("T")[0];
      const todayCompletedIds = new Set(
        state.completions.filter(c => c.completedDate === todayStr).map(c => c.habitId)
      );
      const habitsWithStatus = state.habits.map(h => ({
        ...h,
        completedToday: todayCompletedIds.has(h.id),
        streak: h.streak || 0,
      }));
      return json(habitsWithStatus);
    }
    if (path === "/api/habits" && method === "POST") {
      const id = ++demoIdCounter;
      const habit = { id, ...body, userId: 0 };
      state.habits.push(habit);
      return json(habit);
    }
    if (path.match(/\/api\/habits\/\d+/) && method === "PUT") {
      const id = parseInt(path.split("/").pop());
      state.habits = state.habits.map(h => h.id === id ? { ...h, ...body } : h);
      return json(state.habits.find(h => h.id === id));
    }
    if (path.match(/\/api\/habits\/\d+/) && method === "DELETE") {
      const id = parseInt(path.split("/").pop());
      state.habits = state.habits.filter(h => h.id !== id);
      return json({ ok: true });
    }

    // Completions
    if (path.includes("/api/habits/completions") && method === "GET") {
      return json(state.completions);
    }
    if (path.includes("/api/habits/completions") && method === "POST") {
      const completedDate = body.completedDate || body.date;
      const existing = state.completions.find(c => c.habitId === body.habitId && c.completedDate === completedDate);
      if (existing) {
        state.completions = state.completions.filter(c => c.id !== existing.id);
        return json({ removed: true });
      } else {
        const id = ++demoIdCounter;
        const completion = { id, habitId: body.habitId, completedDate, userId: 0 };
        state.completions.push(completion);
        return json(completion);
      }
    }
    if (path.includes("/api/habits/completions") && method === "DELETE") {
      const completedDate = body.completedDate || body.date;
      state.completions = state.completions.filter(c => !(c.habitId === body.habitId && c.completedDate === completedDate));
      return json({ ok: true });
    }

    // Exercises
    if (path.includes("/api/exercises") && !path.includes("logs") && method === "GET") {
      const typeParam = path.includes("type=") ? new URL(path, "http://x").searchParams.get("type") : null;
      const filtered = typeParam ? state.exercises.filter(e => e.type === typeParam) : state.exercises;
      return json(filtered);
    }
    if (path === "/api/exercises" && method === "POST") {
      const id = ++demoIdCounter;
      const exercise = { id, ...body, userId: 0 };
      state.exercises.push(exercise);
      return json(exercise);
    }
    if (path.match(/\/api\/exercises\/\d+/) && method === "PUT") {
      const id = parseInt(path.split("/").pop());
      state.exercises = state.exercises.map(e => e.id === id ? { ...e, ...body } : e);
      return json(state.exercises.find(e => e.id === id));
    }
    if (path.match(/\/api\/exercises\/\d+/) && method === "DELETE") {
      const id = parseInt(path.split("/").pop());
      state.exercises = state.exercises.filter(e => e.id !== id);
      return json({ ok: true });
    }

    // Exercise logs
    if (path.includes("/api/exercises/logs") && method === "GET") return json(state.exerciseLogs);
    if (path.includes("/api/exercises/logs") && method === "POST") {
      const id = ++demoIdCounter;
      const log = { id, ...body, userId: 0 };
      state.exerciseLogs.push(log);
      return json(log);
    }

    // Sessions
    if (path.includes("/api/sessions") && method === "GET") return json(state.sessions);
    if (path.includes("/api/sessions") && method === "POST") {
      const id = ++demoIdCounter;
      const session = { id, ...body, userId: 0 };
      state.sessions.push(session);
      return json(session);
    }
    if (path.match(/\/api\/sessions\/\d+/) && method === "PUT") {
      const id = parseInt(path.split("/").pop());
      state.sessions = state.sessions.map(s => s.id === id ? { ...s, ...body } : s);
      return json(state.sessions.find(s => s.id === id));
    }
    if (path.match(/\/api\/sessions\/\d+/) && method === "DELETE") {
      const id = parseInt(path.split("/").pop());
      state.sessions = state.sessions.filter(s => s.id !== id);
      return json({ ok: true });
    }

    // Admin
    if (path.includes("/api/admin")) return json([]);

    // Fallback
    return originalFetch(url, options);
  };
}

function uninstallDemoFetch() {
  if (window._originalFetch) {
    window.fetch = window._originalFetch;
    delete window._originalFetch;
    delete window._demoState;
  }
}

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [canScroll, setCanScroll] = useState(false);

  // Check auth on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const user = await res.json();
          setAuthUser(user);
        }
      } catch {}
      setAuthLoading(false);
    })();
  }, []);

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

  const handleAuth = (user) => {
    setAuthUser(user);
  };

  const handleDemo = () => {
    installDemoFetch();
    setDemoMode(true);
    setAuthUser({ id: 0, name: "Visiteur Demo", email: "demo@demo.com", role: "admin" });
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    if (demoMode) {
      uninstallDemoFetch();
      setDemoMode(false);
    } else {
      try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    }
    setAuthUser(null);
  };

  if (authLoading) {
    return (
      <div className="auth-screen">
        <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Chargement...
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <AuthScreen onAuth={handleAuth} onDemo={handleDemo} />;
  }

  return (
    <main className="app">
      <div className="app-container">
        {demoMode && (
          <div className="demo-banner">
            Mode demo — Les donnees ne sont pas sauvegardees
          </div>
        )}

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
            <button className="nav-tab logout-btn" onClick={handleLogout}>
              <LogOut size={14} />
            </button>
          </nav>
        </header>

        <div className="main-content">
          {activeTab === "dashboard" && <Dashboard key={demoMode ? "demo" : "real"} />}
          {activeTab === "habits" && <HabitTracker key={demoMode ? "demo" : "real"} />}
          {activeTab === "workout" && <WorkoutTracker key={demoMode ? "demo" : "real"} />}
        </div>

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
          <button className="mobile-nav-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Sortir</span>
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
