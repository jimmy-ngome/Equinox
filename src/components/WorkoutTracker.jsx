import { useState, useEffect, useRef } from "react";
import { Dumbbell, PersonStanding, ClipboardList, ListChecks, TrendingUp, Calendar, Plus, X, Minus, Check, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon, Save } from "lucide-react";
import AddExerciseModal from "./AddExerciseModal";
import CalisthenicsProgress from "./CalisthenicsProgress";
import "./WorkoutTracker.css";

const WorkoutTracker = () => {
  const [activeView, setActiveView] = useState("log"); // log, exercises, progress
  const [workoutType, setWorkoutType] = useState("musculation"); // musculation, calisthenics

  const [exercises, setExercises] = useState({ musculation: [], calisthenics: [] });
  const [loading, setLoading] = useState(true);

  const [currentWorkout, setCurrentWorkout] = useState([]);
  const [workoutDate, setWorkoutDate] = useState(null); // date string when editing a past session
  const [workoutSessionId, setWorkoutSessionId] = useState(null); // session id when editing existing
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [editExercise, setEditExercise] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [newSet, setNewSet] = useState({ weight: "", reps: "", weightL: "", repsL: "", weightR: "", repsR: "" });

  // Calendar state
  const [expandedSession, setExpandedSession] = useState(null);
  const [editingSession, setEditingSession] = useState(null); // { id, date, type, exercises: [...] }
  const [selectedDate, setSelectedDate] = useState(null);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [sessions, setSessions] = useState([]);
  const [chartExercise, setChartExercise] = useState(null); // { name, data: [{date, volume}] }
  const [confirmAction, setConfirmAction] = useState(null); // { message, onConfirm }
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [savedExercises, setSavedExercises] = useState(new Set()); // track which exercises just got saved

  const scrollContainerRef = useRef(null);
  const viewTabsRef = useRef(null);
  const isScrollingRef = useRef(false);
  const [edgeFade, setEdgeFade] = useState({ left: false, right: true });
  const VIEWS = ["log", "exercises", "progress", "calendar"];

  const toggleExerciseChart = async (exerciseName) => {
    if (chartExercise?.name === exerciseName) {
      setChartExercise(null);
      return;
    }
    try {
      const res = await fetch("/api/sessions");
      const allSessions = await res.json();
      const data = [];
      for (const s of allSessions) {
        let exList = [];
        try { exList = JSON.parse(s.exercises || "[]"); } catch {}
        const ex = exList.find(e => e.name === exerciseName);
        if (!ex || !Array.isArray(ex.sets) || ex.sets.length === 0) continue;
        let volume = 0;
        for (const set of ex.sets) {
          if (ex.unilateral) {
            const wL = parseFloat(set.weightL) || 0;
            const rL = parseFloat(set.repsL) || 0;
            const wR = parseFloat(set.weightR) || 0;
            const rR = parseFloat(set.repsR) || 0;
            volume += wL > 0 ? (wL * rL + wR * rR) : (rL + rR);
          } else {
            const w = parseFloat(set.weight) || 0;
            const r = parseFloat(set.reps) || 0;
            volume += w > 0 ? w * r : r;
          }
        }
        data.push({ date: s.date, volume: Math.round(volume) });
      }
      data.sort((a, b) => a.date.localeCompare(b.date));
      setChartExercise({ name: exerciseName, data });
    } catch (err) {
      console.error("Erreur chargement chart:", err);
    }
  };

  const fetchSessions = async (y, m) => {
    const year = y ?? calMonth.year;
    const month = m ?? calMonth.month;
    const mm = String(month + 1).padStart(2, "0");
    try {
      const res = await fetch(`/api/sessions?month=${year}-${mm}`);
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    }
  };

  const updateSession = async (id, exercises) => {
    try {
      await fetch(`/api/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercises }),
      });
      fetchSessions();
    } catch (err) {
      console.error("Erreur update séance:", err);
    }
  };

  const addSessionForDate = async (dateStr) => {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, type: workoutType, exercises: [] }),
      });
      const newSession = await res.json();
      await fetchSessions();
      setEditingSession({ id: newSession.id, date: newSession.date, type: newSession.type, exercises: [] });
    } catch (err) {
      console.error("Erreur création séance:", err);
    }
  };

  const deleteSession = (id) => {
    setConfirmAction({
      message: "Supprimer cette séance et ses logs de progression associés ?",
      onConfirm: async () => {
        try {
          await fetch(`/api/sessions/${id}`, { method: "DELETE" });
          setExpandedSession(null);
          fetchSessions();
        } catch (err) {
          console.error("Erreur suppression séance:", err);
        }
      },
    });
  };

  const fetchExercises = async () => {
    try {
      const [muscu, cali] = await Promise.all([
        fetch("/api/exercises?type=musculation").then(r => r.json()),
        fetch("/api/exercises?type=calisthenics").then(r => r.json()),
      ]);
      setExercises({ musculation: muscu, calisthenics: cali });
    } catch (err) {
      console.error("Erreur chargement exercices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
    fetchSessions();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [calMonth.year, calMonth.month]);

  const scrollTabIntoView = (view) => {
    const tabs = viewTabsRef.current;
    if (!tabs) return;
    const index = VIEWS.indexOf(view);
    const btn = tabs.children[index];
    if (btn) btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    requestAnimationFrame(() => updateTabFades());
  };

  const updateTabFades = () => {
    const tabs = viewTabsRef.current;
    if (!tabs) return;
    const sl = tabs.scrollLeft;
    const sw = tabs.scrollWidth;
    const cw = tabs.clientWidth;
    setEdgeFade({ left: sl > 2, right: sl + cw < sw - 2 });
  };

  const switchView = (view) => {
    setActiveView(view);
    const container = scrollContainerRef.current;
    if (!container) return;
    const index = VIEWS.indexOf(view);
    if (index >= 0) {
      isScrollingRef.current = true;
      container.scrollTo({ left: index * container.offsetWidth, behavior: "smooth" });
      scrollTabIntoView(view);
      setTimeout(() => { isScrollingRef.current = false; }, 400);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    let timeout;
    const handleScroll = () => {
      if (isScrollingRef.current) return;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const w = container.offsetWidth;
        if (w === 0) return;
        const index = Math.round(container.scrollLeft / w);
        if (VIEWS[index] && VIEWS[index] !== activeView) {
          setActiveView(VIEWS[index]);
          scrollTabIntoView(VIEWS[index]);
        }
      }, 50);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => { container.removeEventListener("scroll", handleScroll); clearTimeout(timeout); };
  }, [activeView]);

  useEffect(() => {
    const tabs = viewTabsRef.current;
    if (!tabs) return;
    updateTabFades();
    tabs.addEventListener("scroll", updateTabFades, { passive: true });
    return () => tabs.removeEventListener("scroll", updateTabFades);
  }, []);

  const loadSessionForDate = (dateStr) => {
    const session = sessions.find(s => s.date === dateStr);
    if (session) {
      let exList = [];
      try { exList = JSON.parse(session.exercises || "[]"); } catch {}
      // Map saved exercises back to workout format with IDs
      const loaded = exList.map(ex => {
        const match = [...exercises.musculation, ...exercises.calisthenics].find(e => e.name === ex.name);
        return {
          id: match?.id || Date.now() + Math.random(),
          name: ex.name,
          category: ex.category,
          type: match?.type || workoutType,
          unilateral: ex.unilateral || false,
          sets: Array.isArray(ex.sets) ? ex.sets.map(s => ({ ...s, id: Date.now() + Math.random() })) : [],
        };
      });
      setCurrentWorkout(loaded);
      setWorkoutSessionId(session.id);
      if (session.type) setWorkoutType(session.type);
    } else {
      setCurrentWorkout([]);
      setWorkoutSessionId(null);
    }
    setWorkoutDate(dateStr);
    setSelectedDate(dateStr);
    switchView("log");
  };

  const clearWorkoutDate = () => {
    setWorkoutDate(null);
    setWorkoutSessionId(null);
    setCurrentWorkout([]);
  };

  const addExerciseToWorkout = (exercise) => {
    if (!currentWorkout.find(e => e.id === exercise.id)) {
      setCurrentWorkout([...currentWorkout, { ...exercise, sets: [] }]);
    }
  };

  const getDefaultWeight = (exercise) => {
    let w = "";
    if (exercise?.type === "musculation") w = exercise.lastWeight || "";
    else if (exercise?.progression === "weighted") w = exercise.volumeWeight || "";
    if (!w) return "";
    const num = parseFloat(w);
    return isNaN(num) ? "" : String(num);
  };

  const addSet = (exerciseId) => {
    const fresh = exercises[workoutType]?.find(e => e.id === exerciseId);
    const isUni = fresh?.unilateral;
    const dw = getDefaultWeight(fresh);
    const setData = isUni
      ? { weightL: newSet.weightL || dw, repsL: newSet.repsL, weightR: newSet.weightR || dw, repsR: newSet.repsR, id: Date.now() }
      : { weight: newSet.weight || dw, reps: newSet.reps, id: Date.now() };
    setCurrentWorkout(currentWorkout.map(ex =>
      ex.id === exerciseId
        ? { ...ex, sets: [...ex.sets, setData] }
        : ex
    ));
    setNewSet({ weight: "", reps: "", weightL: "", repsL: "", weightR: "", repsR: "" });
  };

  const removeSet = (exerciseId, setId) => {
    setCurrentWorkout(currentWorkout.map(ex =>
      ex.id === exerciseId
        ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) }
        : ex
    ));
  };

  const removeExerciseFromWorkout = (exerciseId) => {
    setCurrentWorkout(currentWorkout.filter(ex => ex.id !== exerciseId));
  };

  const handleExerciseCreated = (result) => {
    if (editExercise) {
      // Edit mode — replace in list
      setExercises(prev => ({
        ...prev,
        [result.type]: prev[result.type].map(e => e.id === result.id ? result : e),
      }));
      setEditExercise(null);
    } else {
      // Create mode
      setExercises(prev => ({
        ...prev,
        [result.type]: [...prev[result.type], result],
      }));
    }
    setShowAddExerciseModal(false);
  };

  const deleteExercise = (id, type) => {
    setConfirmAction({
      message: "Supprimer cet exercice et tout son historique de progression ?",
      onConfirm: async () => {
        setExercises(prev => ({
          ...prev,
          [type]: prev[type].filter(e => e.id !== id),
        }));
        try {
          await fetch(`/api/exercises/${id}`, { method: "DELETE" });
        } catch (err) {
          console.error("Erreur suppression exercice:", err);
          fetchExercises();
        }
      },
    });
  };

  const VOLUME_STEPS = [
    [3,3], [4,3], [5,3], [6,3],
    [3,4], [4,4], [5,4],
    [3,5], [4,5], [5,5],
  ];
  const VOLUME_LABELS = ["3×3","4×3","5×3","6×3","3×4","4×4","5×4","3×5","4×5","5×5"];

  // Check if session sets match current volume step
  const checkVolumeMatch = (sets, stepIndex, isUnilateral) => {
    if (stepIndex >= VOLUME_STEPS.length) return false;
    const [needSets, needReps] = VOLUME_STEPS[stepIndex];
    const validSets = sets.filter(s => {
      const reps = isUnilateral
        ? Math.round(((parseFloat(s.repsL) || 0) + (parseFloat(s.repsR) || 0)) / 2)
        : parseInt(s.reps);
      return reps >= needReps;
    });
    return validSets.length >= needSets;
  };

  // Compute total session volume for an exercise
  // Weighted/muscu: sum(weight × reps) = total kg moved
  // Time (s): sum of all seconds
  // Reps: sum of all reps
  const computeSessionTotal = (sets, exercise) => {
    const unit = exercise.unit || "reps";
    const isUni = exercise.unilateral;
    const isWeighted = exercise.progression === "weighted" || exercise.type === "musculation";
    let total = 0;

    for (const s of sets) {
      if (isUni) {
        const wL = parseFloat(s.weightL) || 0;
        const rL = parseFloat(s.repsL) || 0;
        const wR = parseFloat(s.weightR) || 0;
        const rR = parseFloat(s.repsR) || 0;

        if (unit === "s") {
          total += rL + rR;
        } else if (unit === "kg") {
          total += wL + wR;
        } else if (isWeighted && wL > 0) {
          total += (wL * rL) + (wR * rR);
        } else {
          total += rL + rR;
        }
      } else {
        const w = parseFloat(s.weight) || 0;
        const r = parseFloat(s.reps) || 0;

        if (unit === "s") {
          total += r;
        } else if (unit === "kg") {
          total += w;
        } else if (isWeighted && w > 0) {
          total += w * r;
        } else {
          total += r;
        }
      }
    }

    return Math.round(total * 100) / 100;
  };

  // Get best PR value from session sets
  const getSessionBest = (sets, exercise) => {
    const unit = exercise.unit || "reps";
    const isUni = exercise.unilateral;
    let best = null;
    for (const s of sets) {
      let val;
      if (isUni) {
        const left = unit === "kg" ? parseFloat(s.weightL) : parseFloat(s.repsL);
        const right = unit === "kg" ? parseFloat(s.weightR) : parseFloat(s.repsR);
        val = ((left || 0) + (right || 0)) / 2;
      } else {
        val = unit === "kg" ? parseFloat(s.weight) : parseFloat(s.reps);
      }
      if (val && (best === null || val > best)) best = val;
    }
    return best;
  };

  const validateProgression = async (exercise, newStep, sessionSets) => {
    const today = new Date().toISOString().split("T")[0];
    const updates = { volumeStep: newStep };
    // Reset if completed all steps
    if (newStep >= VOLUME_STEPS.length) updates.volumeStep = 0;

    const logValue = sessionSets
      ? computeSessionTotal(sessionSets, exercise)
      : (exercise.volumeWeight ? parseFloat(exercise.volumeWeight) : 0);

    try {
      await Promise.all([
        fetch(`/api/exercises/${exercise.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }),
        fetch("/api/exercises/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseId: exercise.id,
            loggedDate: today,
            value: logValue,
            sets: VOLUME_LABELS[exercise.volumeStep || 0],
          }),
        }),
      ]);
      setSavedExercises(prev => new Set(prev).add(exercise.id));
      fetchExercises();
    } catch (err) {
      console.error("Erreur validation progression:", err);
    }
  };

  const validatePr = async (exercise, newValue, sessionSets) => {
    const today = new Date().toISOString().split("T")[0];
    const current = exercise.currentValue ?? 0;

    const logValue = sessionSets
      ? computeSessionTotal(sessionSets, exercise)
      : newValue;

    try {
      const promises = [
        fetch("/api/exercises/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseId: exercise.id,
            loggedDate: today,
            value: logValue,
          }),
        }),
      ];
      // Only update currentValue if it's a new record (percentage never goes backwards)
      if (newValue > current) {
        promises.push(
          fetch(`/api/exercises/${exercise.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentValue: newValue }),
          })
        );
      }
      await Promise.all(promises);
      setSavedExercises(prev => new Set(prev).add(exercise.id));
      fetchExercises();
    } catch (err) {
      console.error("Erreur validation PR:", err);
    }
  };

  const finishWorkout = async () => {
    if (currentWorkout.length === 0 || finishing) return;
    setFinishing(true);

    // Auto-validate any pending progressions
    const promises = [];
    for (const exercise of currentWorkout) {
      if (exercise.sets.length === 0) continue;
      const fresh = exercises[workoutType]?.find(e => e.id === exercise.id) || exercise;
      const method = fresh.progressionMethod;

      if (method === "volume" && checkVolumeMatch(exercise.sets, fresh.volumeStep || 0, fresh.unilateral)) {
        promises.push(validateProgression(fresh, (fresh.volumeStep || 0) + 1, exercise.sets));
      }
      if (method === "pr") {
        const best = getSessionBest(exercise.sets, fresh);
        if (best !== null) promises.push(validatePr(fresh, best, exercise.sets));
      }
    }

    // Save session with full set details
    const summary = currentWorkout.map(ex => {
      const fr = exercises[workoutType]?.find(e => e.id === ex.id) || ex;
      const entry = {
        name: ex.name,
        category: ex.category,
        unit: fr.unit || null,
      };
      if (fr.unilateral) {
        entry.unilateral = true;
        entry.sets = ex.sets.map(s => ({ weightL: s.weightL, repsL: s.repsL, weightR: s.weightR, repsR: s.repsR }));
      } else {
        entry.sets = ex.sets.map(s => ({ weight: s.weight, reps: s.reps }));
      }
      return entry;
    });
    const sessionDate = workoutDate || new Date().toISOString().split("T")[0];

    if (workoutSessionId) {
      // Update existing session
      promises.push(
        fetch(`/api/sessions/${workoutSessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exercises: summary }),
        }).catch(err => console.error("Erreur mise à jour séance:", err))
      );
    } else {
      // Create new session
      promises.push(
        fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: sessionDate,
            type: workoutType,
            exercises: summary,
          }),
        }).catch(err => console.error("Erreur sauvegarde séance:", err))
      );
    }

    await Promise.all(promises);
    setFinishing(false);
    setCurrentWorkout([]);
    setWorkoutDate(null);
    setWorkoutSessionId(null);
    fetchSessions();
  };

  return (
    <div className="workout-tracker">
      <div className="tracker-header">
        <h1>Entraînement</h1>
        <div className="type-toggle">
          <button
            className={workoutType === "musculation" ? "active" : ""}
            onClick={() => setWorkoutType("musculation")}
          >
            <Dumbbell size={14} /> Muscu
          </button>
          <button
            className={workoutType === "calisthenics" ? "active" : ""}
            onClick={() => setWorkoutType("calisthenics")}
          >
            <PersonStanding size={14} /> Calisthenics
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="view-tabs-wrapper">
        <div className={`tab-fade tab-fade-left${edgeFade.left ? " visible" : ""}`} />
        <div className={`tab-fade tab-fade-right${edgeFade.right ? " visible" : ""}`} />
        <div className="view-tabs" ref={viewTabsRef}>
          <button
            className={activeView === "log" ? "active" : ""}
            onClick={() => switchView("log")}
          >
            <ClipboardList size={14} /> Séance
          </button>
          <button
            className={activeView === "exercises" ? "active" : ""}
            onClick={() => switchView("exercises")}
          >
            <ListChecks size={14} /> Exercices
          </button>
          <button
            className={activeView === "progress" ? "active" : ""}
            onClick={() => switchView("progress")}
          >
            <TrendingUp size={14} /> Progression
          </button>
          <button
            className={activeView === "calendar" ? "active" : ""}
            onClick={() => switchView("calendar")}
          >
            <Calendar size={14} /> Calendrier
          </button>
        </div>
      </div>

      {/* Views Container - horizontal scroll snap on mobile */}
      <div className="views-container" ref={scrollContainerRef}>
        <div className={`view-panel${activeView === "log" ? " active" : ""}`}>
          <div className="workout-log">
          {workoutDate && (
            <div className="workout-date-banner">
              <span>Séance du {(() => {
                const MOIS = ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"];
                const [, m, d] = workoutDate.split("-");
                return `${parseInt(d)} ${MOIS[parseInt(m) - 1]}`;
              })()}</span>
              <button className="btn-secondary" onClick={clearWorkoutDate} style={{ padding: "var(--spacing-xs) var(--spacing-md)", fontSize: "0.6875rem" }}>
                <X size={12} /> Fermer
              </button>
            </div>
          )}
          {currentWorkout.length === 0 ? (
            <>
              {/* Today's completed sessions */}
              {!workoutDate && (() => {
                const today = new Date().toISOString().split("T")[0];
                const todaySessions = sessions.filter(s => s.date === today);
                if (todaySessions.length === 0) return null;
                return (
                  <div className="today-sessions">
                    <h3 className="today-sessions-title">Séances d'aujourd'hui</h3>
                    {todaySessions.map(s => {
                      let exList = [];
                      try { exList = JSON.parse(s.exercises || "[]"); } catch {}
                      return (
                        <div key={s.id} className="today-session-card">
                          {exList.map((ex, ei) => {
                            const firstSet = Array.isArray(ex.sets) && ex.sets[0];
                            const exWeight = firstSet ? (ex.unilateral ? (firstSet.weightL || firstSet.weightR) : firstSet.weight) : null;
                            return (
                              <div key={ei} className="today-ex-block">
                                <div className="today-ex-header">
                                  <span className="today-ex-name">{ex.name}</span>
                                  {exWeight && <span className="today-ex-weight">{exWeight}kg</span>}
                                  <span className="category-tag">{ex.category}</span>
                                </div>
                                {Array.isArray(ex.sets) && ex.sets.length > 0 && (
                                  <div className="today-ex-sets">
                                    {ex.sets.map((set, si) => (
                                      <div key={si} className="today-ex-set">
                                        {ex.unilateral ? (
                                          <>
                                            <span>G: {set.weightL ? `${set.weightL}kg x ` : ""}{set.repsL || 0}</span>
                                            <span>D: {set.weightR ? `${set.weightR}kg x ` : ""}{set.repsR || 0}</span>
                                          </>
                                        ) : ex.unit === "s" ? (
                                          <span>{set.reps}s</span>
                                        ) : ex.unit === "kg" ? (
                                          <span>{set.weight}kg</span>
                                        ) : ex.unit === "reps" ? (
                                          <span>{set.reps} reps</span>
                                        ) : (
                                          <>
                                            {set.weight && <span>{set.weight}kg</span>}
                                            <span>{set.reps} reps</span>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <button
                            className="btn-secondary"
                            onClick={() => loadSessionForDate(today)}
                            style={{ width: "100%", justifyContent: "center", marginTop: "var(--spacing-sm)" }}
                          >
                            <Pencil size={12} /> Modifier
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              <div className="empty-state">
                <Dumbbell size={32} style={{ opacity: 0.3 }} />
                <p>{workoutDate ? "Aucune séance ce jour" : "Nouvelle séance"}</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowExerciseModal(true)}
                >
                  <Plus size={14} /> Ajouter un exercice
                </button>
              </div>
            </>
          ) : (
            <>
              {currentWorkout.map(exercise => {
                // Get fresh exercise data (currentWorkout copy may be stale)
                const fresh = exercises[workoutType]?.find(e => e.id === exercise.id) || exercise;
                const method = fresh.progressionMethod;
                const isWeighted = fresh.progression === "weighted";
                const unit = fresh.unit || "reps";
                let progressPct = 0;
                let progressLabel = "";

                if (method === "volume") {
                  const step = fresh.volumeStep || 0;
                  progressPct = Math.round((step / 10) * 100);
                  progressLabel = `Étape ${step}/10 — ${progressPct}%${isWeighted && fresh.volumeWeight ? ` — ${fresh.volumeWeight}kg` : ""}`;
                } else if (method === "pr") {
                  const base = fresh.baseValue ?? 0;
                  const goal = fresh.goalValue ?? 0;
                  const current = fresh.currentValue ?? 0;
                  progressPct = goal !== base ? Math.min(100, Math.max(0, Math.round(((current - base) / (goal - base)) * 100))) : 0;
                  const u = unit === "s" ? "s" : unit === "kg" ? "kg" : "";
                  progressLabel = `${current}${u} / ${goal}${u} — ${progressPct}%`;
                }

                // Auto-detect progression from session sets
                const volumeMatch = method === "volume" && exercise.sets.length > 0 && checkVolumeMatch(exercise.sets, fresh.volumeStep || 0, fresh.unilateral);
                const prBest = method === "pr" && exercise.sets.length > 0 ? getSessionBest(exercise.sets, fresh) : null;
                const isNewRecord = prBest !== null && prBest > (fresh.currentValue ?? 0);

                // Determine input mode based on unit for PR exercises
                const isPrTime = method === "pr" && unit === "s";
                const isPrKg = method === "pr" && unit === "kg";
                const isPrReps = method === "pr" && unit === "reps";
                const singleInput = isPrTime || isPrKg || isPrReps;
                const needsCharge = isWeighted || fresh.type !== "calisthenics";
                const presetWeight = getDefaultWeight(fresh);
                const hasPresetWeight = needsCharge && !!presetWeight;
                const isUnilateral = fresh.unilateral;

                return (
                <div key={exercise.id} className="exercise-log-card">
                  <div className="exercise-log-header">
                    <h3>{exercise.name}{isUnilateral ? <span className="uni-tag">G/D</span> : null}</h3>
                    <span className="category-tag">{exercise.category}</span>
                    <button
                      className="remove-exercise"
                      onClick={() => removeExerciseFromWorkout(exercise.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="sets-list">
                    {exercise.sets.map((set, index) => (
                      <div key={set.id} className="set-row">
                        {isUnilateral ? (
                          <>
                            <span className="set-weight">G: {needsCharge && set.weightL ? `${set.weightL}kg x ` : ""}{set.repsL || 0}</span>
                            <span className="set-reps">D: {needsCharge && set.weightR ? `${set.weightR}kg x ` : ""}{set.repsR || 0}</span>
                            <span className="set-avg">Moy: {Math.round(((parseFloat(set.repsL) || 0) + (parseFloat(set.repsR) || 0)) / 2)}</span>
                          </>
                        ) : isPrTime ? (
                          <span className="set-weight">{set.reps}s</span>
                        ) : isPrKg ? (
                          <span className="set-weight">{set.weight}kg</span>
                        ) : isPrReps ? (
                          <span className="set-weight">{set.reps} reps</span>
                        ) : (
                          <>
                            {needsCharge && set.weight && <span className="set-weight">{set.weight}kg</span>}
                            <span className="set-reps">{set.reps} reps</span>
                          </>
                        )}
                        <button
                          className="remove-set"
                          onClick={() => removeSet(exercise.id, set.id)}
                        >
                          <Minus size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className={`add-set-form${isUnilateral ? " unilateral-form" : ""}`}>
                    {isUnilateral ? (
                      singleInput ? (
                        <>
                          <div className="uni-group">
                            <span className="uni-label">G</span>
                            <input
                              type="text"
                              placeholder={isPrTime ? "s" : isPrKg ? "kg" : "Reps"}
                              value={selectedExercise === exercise.id ? (isPrKg ? newSet.weightL : newSet.repsL) : ""}
                              onFocus={() => setSelectedExercise(exercise.id)}
                              onChange={e => setNewSet({ ...newSet, [isPrKg ? "weightL" : "repsL"]: e.target.value })}
                            />
                          </div>
                          <div className="uni-group">
                            <span className="uni-label">D</span>
                            <input
                              type="text"
                              placeholder={isPrTime ? "s" : isPrKg ? "kg" : "Reps"}
                              value={selectedExercise === exercise.id ? (isPrKg ? newSet.weightR : newSet.repsR) : ""}
                              onFocus={() => setSelectedExercise(exercise.id)}
                              onChange={e => setNewSet({ ...newSet, [isPrKg ? "weightR" : "repsR"]: e.target.value })}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="uni-group">
                            <span className="uni-label">G</span>
                            {needsCharge && !hasPresetWeight && (
                              <input
                                type="text"
                                placeholder="Charge G"
                                value={selectedExercise === exercise.id ? newSet.weightL : ""}
                                onFocus={() => setSelectedExercise(exercise.id)}
                                onChange={e => setNewSet({ ...newSet, weightL: e.target.value })}
                              />
                            )}
                            <input
                              type="text"
                              placeholder="Reps G"
                              value={selectedExercise === exercise.id ? newSet.repsL : ""}
                              onFocus={() => setSelectedExercise(exercise.id)}
                              onChange={e => setNewSet({ ...newSet, repsL: e.target.value })}
                            />
                          </div>
                          <div className="uni-group">
                            <span className="uni-label">D</span>
                            {needsCharge && !hasPresetWeight && (
                              <input
                                type="text"
                                placeholder="Charge D"
                                value={selectedExercise === exercise.id ? newSet.weightR : ""}
                                onFocus={() => setSelectedExercise(exercise.id)}
                                onChange={e => setNewSet({ ...newSet, weightR: e.target.value })}
                              />
                            )}
                            <input
                              type="text"
                              placeholder="Reps D"
                              value={selectedExercise === exercise.id ? newSet.repsR : ""}
                              onFocus={() => setSelectedExercise(exercise.id)}
                              onChange={e => setNewSet({ ...newSet, repsR: e.target.value })}
                            />
                          </div>
                        </>
                      )
                    ) : isPrTime ? (
                      <input
                        type="text"
                        placeholder="Durée (s)"
                        value={selectedExercise === exercise.id ? newSet.reps : ""}
                        onFocus={() => setSelectedExercise(exercise.id)}
                        onChange={e => setNewSet({ ...newSet, reps: e.target.value })}
                      />
                    ) : isPrKg ? (
                      <input
                        type="text"
                        placeholder="Charge (kg)"
                        value={selectedExercise === exercise.id ? newSet.weight : ""}
                        onFocus={() => setSelectedExercise(exercise.id)}
                        onChange={e => setNewSet({ ...newSet, weight: e.target.value })}
                      />
                    ) : isPrReps ? (
                      <input
                        type="text"
                        placeholder="Reps"
                        value={selectedExercise === exercise.id ? newSet.reps : ""}
                        onFocus={() => setSelectedExercise(exercise.id)}
                        onChange={e => setNewSet({ ...newSet, reps: e.target.value })}
                      />
                    ) : (
                      <>
                        {needsCharge && !hasPresetWeight && (
                          <input
                            type="text"
                            placeholder="Charge"
                            value={selectedExercise === exercise.id ? newSet.weight : ""}
                            onFocus={() => setSelectedExercise(exercise.id)}
                            onChange={e => setNewSet({ ...newSet, weight: e.target.value })}
                          />
                        )}
                        <input
                          type="text"
                          placeholder="Reps"
                          value={selectedExercise === exercise.id ? newSet.reps : ""}
                          onFocus={() => setSelectedExercise(exercise.id)}
                          onChange={e => setNewSet({ ...newSet, reps: e.target.value })}
                        />
                      </>
                    )}
                    <button
                      className="add-set-btn"
                      onClick={() => addSet(exercise.id)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Suggestion banner — volume step matched */}
                  {volumeMatch && !savedExercises.has(exercise.id) && (
                    <div className="session-suggest">
                      <span className="suggest-text">
                        <Check size={14} /> {VOLUME_LABELS[fresh.volumeStep || 0]} validé !
                      </span>
                      <button
                        className="btn-suggest"
                        onClick={() => validateProgression(fresh, (fresh.volumeStep || 0) + 1, exercise.sets)}
                      >
                        <Save size={12} /> Enregistrer
                      </button>
                    </div>
                  )}

                  {/* Suggestion banner — PR session best */}
                  {prBest !== null && !savedExercises.has(exercise.id) && (
                    <div className="session-suggest">
                      <span className="suggest-text">
                        <TrendingUp size={14} /> {isNewRecord ? "Nouveau record" : "Séance"} : {prBest}{unit === "s" ? "s" : unit === "kg" ? "kg" : " reps"}
                      </span>
                      <button
                        className="btn-suggest"
                        onClick={() => validatePr(fresh, prBest, exercise.sets)}
                      >
                        <Save size={12} /> Enregistrer
                      </button>
                    </div>
                  )}

                  {/* Mini progress bar for calisthenics */}
                  {workoutType === "calisthenics" && method && (
                    <div className="session-progress">
                      <div className="session-progress-info">
                        <span>{progressLabel}</span>
                      </div>
                      <div className="session-progress-track">
                        <div className="session-progress-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                );
              })}

              <button
                className="btn-secondary add-more"
                onClick={() => setShowExerciseModal(true)}
              >
                <Plus size={14} /> Ajouter un exercice
              </button>

              <button className="btn-primary finish-workout" onClick={finishWorkout} disabled={finishing}>
                <Check size={14} /> {finishing ? "Enregistrement en cours..." : "Terminer l'entraînement"}
              </button>
            </>
          )}
          </div>
        </div>

        {/* Exercises View */}
        <div className={`view-panel${activeView === "exercises" ? " active" : ""}`}>
          <div className="exercises-view">
          <div className="exercises-header">
            <button
              className="add-btn"
              onClick={() => setShowAddExerciseModal(true)}
            >
              <Plus size={18} />
            </button>
          </div>
          {loading ? (
            <p style={{ textAlign: "center", opacity: 0.6 }}>Chargement...</p>
          ) : exercises[workoutType].length === 0 ? (
            <div className="empty-state" style={{ textAlign: "center", padding: "2rem 0", opacity: 0.6 }}>
              <p>Aucun exercice. Cliquez + pour en ajouter.</p>
            </div>
          ) : (
            exercises[workoutType].map(exercise => (
              <div key={exercise.id} className="exercise-card">
                <div className="exercise-main">
                  <h3>{exercise.name}</h3>
                  <span className="category-tag">{exercise.category}</span>
                </div>
                <div className="exercise-stats">
                  <div className="stat">
                    <span className="stat-label">PR</span>
                    <span className="stat-value pr">{exercise.pr || "—"}</span>
                  </div>
                  {workoutType === "musculation" ? (
                    <>
                      <div className="stat">
                        <span className="stat-label">Dernier</span>
                        <span className="stat-value">{exercise.lastWeight || "—"}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Reps</span>
                        <span className="stat-value">{exercise.lastReps || "—"}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="stat">
                        <span className="stat-label">Niveau</span>
                        <span className="stat-value">{exercise.progression || "—"}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Max</span>
                        <span className="stat-value">{exercise.reps || "—"}</span>
                      </div>
                    </>
                  )}
                  <button
                    className="edit-btn"
                    onClick={() => { setEditExercise(exercise); setShowAddExerciseModal(true); }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteExercise(exercise.id, workoutType)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
          </div>
        </div>

        {/* Progress View */}
        <div className={`view-panel${activeView === "progress" ? " active" : ""}`}>
          {workoutType === "calisthenics" && (
            <CalisthenicsProgress
              exercises={exercises.calisthenics}
              onUpdate={fetchExercises}
            />
          )}

          {workoutType === "musculation" && (
            <div className="progress-view">
          <div className="progress-card">
            <h3>Progression Force</h3>
            <div className="progress-chart">
              {exercises.musculation.slice(0, 4).map((exercise, index) => (
                <div key={exercise.id} className="progress-bar-container">
                  <span className="progress-bar-label">{exercise.name}</span>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${60 + index * 10}%` }}
                    ></div>
                  </div>
                  <span className="progress-bar-value">{exercise.pr}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="progress-card">
            <h3>Volume cette semaine</h3>
            <div className="volume-stats">
              <div className="volume-stat">
                <span className="volume-value">4</span>
                <span className="volume-label">Séances</span>
              </div>
              <div className="volume-stat">
                <span className="volume-value">48</span>
                <span className="volume-label">Sets totaux</span>
              </div>
              <div className="volume-stat">
                <span className="volume-value">12,450</span>
                <span className="volume-label">kg soulevés</span>
              </div>
            </div>
          </div>
            </div>
          )}
        </div>

        {/* Calendar View */}
        <div className={`view-panel${activeView === "calendar" ? " active" : ""}`}>
          {(() => {
        const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
        const MOIS_FR = [
          "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
          "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
        ];
        const { year, month } = calMonth;
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        // Monday = 0
        let startDay = firstDay.getDay() - 1;
        if (startDay < 0) startDay = 6;

        const sessionDates = new Set(sessions.map(s => s.date));
        const today = new Date().toISOString().split("T")[0];

        const cells = [];
        for (let i = 0; i < startDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);

        const prevMonth = () => { setSelectedDate(null); setCalMonth(p => {
          const m = p.month - 1;
          return m < 0 ? { year: p.year - 1, month: 11 } : { ...p, month: m };
        }); };
        const nextMonth = () => { setSelectedDate(null); setCalMonth(p => {
          const m = p.month + 1;
          return m > 11 ? { year: p.year + 1, month: 0 } : { ...p, month: m };
        }); };

        return (
          <div className="cal-view">
            <div className="cal-nav">
              <button onClick={prevMonth}><ChevronLeft size={16} /></button>
              <span className="cal-title">{MOIS_FR[month]} {year}</span>
              <button onClick={nextMonth}><ChevronRight size={16} /></button>
            </div>
            <div className="cal-grid">
              {JOURS.map(j => (
                <div key={j} className="cal-header">{j}</div>
              ))}
              {cells.map((day, i) => {
                if (day === null) return <div key={`e${i}`} className="cal-cell empty" />;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const hasSession = sessionDates.has(dateStr);
                const isToday = dateStr === today;
                const isSelected = dateStr === selectedDate;
                return (
                  <div
                    key={day}
                    className={`cal-cell${isToday ? " today" : ""}${isSelected ? " selected" : ""}`}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="cal-day">{day}</span>
                    <span className={`cal-dot${hasSession ? " active" : ""}`} />
                  </div>
                );
              })}
            </div>
            {/* Session list — filtered by selected date or full month */}
            {(() => {
              const displaySessions = selectedDate
                ? sessions.filter(s => s.date === selectedDate)
                : sessions;

              const MOIS_COURT = ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"];
              const formatDate = (d) => {
                const [, m, day] = d.split("-");
                return `${parseInt(day)} ${MOIS_COURT[parseInt(m) - 1]}`;
              };

              return (
                <>
                  {selectedDate && (
                    <div className="cal-date-header">
                      <span>{formatDate(selectedDate)}</span>
                      <button
                        className="btn-primary"
                        onClick={() => addSessionForDate(selectedDate)}
                      >
                        <Plus size={14} /> Nouvelle séance
                      </button>
                    </div>
                  )}

                  {displaySessions.length > 0 ? (
                    <div className="cal-sessions">
                      {displaySessions.map(s => {
                        let exList = [];
                        try { exList = JSON.parse(s.exercises || "[]"); } catch {}
                        const isOpen = expandedSession === s.id;
                        const tags = [...new Set(exList.map(e => e.category).filter(Boolean))];
                        const day = s.date.split("-")[2].replace(/^0/, "");
                        return (
                          <div key={s.id} className={`cal-session-card${isOpen ? " open" : ""}`}>
                            <div
                              className="cal-session-row"
                              onClick={() => setExpandedSession(isOpen ? null : s.id)}
                            >
                              <span className="cal-session-date">{day}</span>
                              <div className="cal-session-tags">
                                {tags.map(t => (
                                  <span key={t} className="cal-tag">{t}</span>
                                ))}
                              </div>
                              <span className="cal-session-arrow">{isOpen ? <ChevronDown size={14} /> : <ChevronRightIcon size={14} />}</span>
                            </div>
                            {isOpen && (
                              <div className="cal-session-body">
                                {exList.map((ex, ei) => {
                                  // Extract weight from first set if available
                                  const firstSet = Array.isArray(ex.sets) && ex.sets[0];
                                  const exWeight = firstSet ? (ex.unilateral ? (firstSet.weightL || firstSet.weightR) : firstSet.weight) : null;
                                  return (
                                  <div key={ei} className="cal-ex-block">
                                    <div className="cal-ex-header">
                                      <span className="cal-ex-name">{ex.name}</span>
                                      {exWeight && <span className="cal-ex-weight">{exWeight}kg</span>}
                                      <span className="cal-ex-cat">{ex.category}</span>
                                      <button
                                        className={`cal-chart-btn${chartExercise?.name === ex.name ? " active" : ""}`}
                                        onClick={(e) => { e.stopPropagation(); toggleExerciseChart(ex.name); }}
                                      >
                                        <TrendingUp size={12} />
                                      </button>
                                    </div>
                                    {chartExercise?.name === ex.name && chartExercise.data.length >= 2 && (() => {
                                      const { data } = chartExercise;
                                      const W = 280, H = 110, PAD = 24, PAD_B = 34;
                                      const maxV = Math.max(...data.map(d => d.volume));
                                      const chartW = W - PAD * 2;
                                      const chartH = H - PAD - PAD_B;
                                      const maxBarW = 24;
                                      const gap = 4;
                                      const naturalBarW = (chartW - gap * (data.length - 1)) / data.length;
                                      const barW = Math.min(naturalBarW, maxBarW);
                                      const totalBarsW = barW * data.length + gap * (data.length - 1);
                                      const offsetX = PAD + (chartW - totalBarsW) / 2;
                                      const baseline = H - PAD_B;
                                      const MOIS_C = ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"];
                                      const fmtD = (d) => { const [,m,day] = d.split("-"); return `${parseInt(day)} ${MOIS_C[parseInt(m)-1]}`; };
                                      return (
                                        <div className="cal-ex-chart">
                                          <svg viewBox={`0 0 ${W} ${H}`}>
                                            {/* Grid lines */}
                                            <line x1={PAD} y1={PAD} x2={W - PAD} y2={PAD} stroke="var(--border-color)" strokeWidth="0.5" />
                                            <line x1={PAD} y1={baseline} x2={W - PAD} y2={baseline} stroke="var(--border-color)" strokeWidth="0.5" />
                                            {/* Bars */}
                                            {data.map((d, i) => {
                                              const barH = maxV > 0 ? (d.volume / maxV) * chartH : 0;
                                              const x = offsetX + i * (barW + gap);
                                              const y = baseline - barH;
                                              return (
                                                <g key={i}>
                                                  <rect x={x} y={y} width={barW} height={barH} fill="#fff" />
                                                  <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="var(--text-primary)" fontSize="9" fontFamily="inherit" fontWeight="600">{d.volume}</text>
                                                  <text x={x + barW / 2} y={baseline + 10} textAnchor="middle" fill="var(--text-muted)" fontSize="7" fontFamily="inherit">{fmtD(d.date)}</text>
                                                </g>
                                              );
                                            })}
                                            {/* Y axis labels */}
                                            <text x={PAD - 4} y={baseline + 3} textAnchor="end" fill="var(--text-muted)" fontSize="7" fontFamily="inherit">0</text>
                                            <text x={PAD - 4} y={PAD + 3} textAnchor="end" fill="var(--text-muted)" fontSize="7" fontFamily="inherit">{maxV}</text>
                                          </svg>
                                          <div className="cal-chart-unit">kg total</div>
                                        </div>
                                      );
                                    })()}
                                    {chartExercise?.name === ex.name && chartExercise.data.length < 2 && (
                                      <div className="cal-chart-empty">Pas assez de données</div>
                                    )}
                                    {Array.isArray(ex.sets) && ex.sets.length > 0 ? (
                                      <div className="cal-ex-sets">
                                        {ex.sets.map((set, si) => (
                                          <div key={si} className="cal-ex-set">
                                            {ex.unilateral ? (
                                              <>
                                                <span className="cal-set-weight">G: {set.weightL ? `${set.weightL}kg x ` : ""}{set.repsL || 0}</span>
                                                <span className="cal-set-reps">D: {set.weightR ? `${set.weightR}kg x ` : ""}{set.repsR || 0}</span>
                                                <span className="cal-set-avg">Moy: {Math.round(((parseFloat(set.repsL) || 0) + (parseFloat(set.repsR) || 0)) / 2)}</span>
                                              </>
                                            ) : ex.unit === "s" ? (
                                              <span className="cal-set-weight">{set.reps}s</span>
                                            ) : ex.unit === "kg" ? (
                                              <span className="cal-set-weight">{set.weight}kg</span>
                                            ) : ex.unit === "reps" ? (
                                              <span className="cal-set-weight">{set.reps} reps</span>
                                            ) : (
                                              <>
                                                <span className="cal-set-weight">{set.weight}{set.weight ? "kg" : "—"}</span>
                                                <span className="cal-set-reps">{set.reps} reps</span>
                                              </>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="cal-ex-count">
                                        {typeof ex.sets === "number" ? `${ex.sets} sets` : "—"}
                                      </span>
                                    )}
                                  </div>
                                  );
                                })}
                                <div className="cal-session-actions">
                                  <button
                                    className="btn-secondary"
                                    onClick={(e) => { e.stopPropagation(); loadSessionForDate(s.date); }}
                                  >
                                    <Pencil size={12} /> Modifier
                                  </button>
                                  <button
                                    className="btn-delete"
                                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                                  >
                                    <Trash2 size={12} /> Supprimer
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : selectedDate ? (
                    <div className="empty-state">
                      <p>Aucune séance ce jour</p>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="empty-state">
                      <p>Aucune séance ce mois</p>
                    </div>
                  ) : null}
                </>
              );
            })()}
          </div>
        );
          })()}
        </div>
      </div>

      {/* Edit Session Modal */}
      {editingSession && (() => {
        const es = editingSession;
        const updateEx = (newExercises) => setEditingSession({ ...es, exercises: newExercises });

        const updateSet = (exIdx, setIdx, field, value) => {
          const newEx = es.exercises.map((ex, i) => {
            if (i !== exIdx) return ex;
            const newSets = ex.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s);
            return { ...ex, sets: newSets };
          });
          updateEx(newEx);
        };

        const addSet = (exIdx) => {
          const newEx = es.exercises.map((ex, i) => {
            if (i !== exIdx) return ex;
            const sets = Array.isArray(ex.sets) ? ex.sets : [];
            const emptySet = ex.unilateral
              ? { weightL: "", repsL: "", weightR: "", repsR: "" }
              : { weight: "", reps: "" };
            return { ...ex, sets: [...sets, emptySet] };
          });
          updateEx(newEx);
        };

        const removeSet = (exIdx, setIdx) => {
          const newEx = es.exercises.map((ex, i) => {
            if (i !== exIdx) return ex;
            return { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) };
          });
          updateEx(newEx);
        };

        const removeExercise = (exIdx) => {
          updateEx(es.exercises.filter((_, i) => i !== exIdx));
        };

        const addExercise = () => {
          updateEx([...es.exercises, { name: "", category: "", sets: [{ weight: "", reps: "" }] }]);
        };

        const updateExField = (exIdx, field, value) => {
          const newEx = es.exercises.map((ex, i) => i === exIdx ? { ...ex, [field]: value } : ex);
          updateEx(newEx);
        };

        const save = async () => {
          await updateSession(es.id, es.exercises);
          setEditingSession(null);
        };

        return (
          <div className="modal-overlay" onClick={() => setEditingSession(null)}>
            <div className="modal edit-session-modal" onClick={e => e.stopPropagation()}>
              <h2>Modifier séance — {es.date}</h2>

              {es.exercises.map((ex, ei) => (
                <div key={ei} className="edit-ex-block">
                  <div className="edit-ex-header">
                    <input
                      type="text"
                      className="edit-ex-name"
                      value={ex.name}
                      onChange={e => updateExField(ei, "name", e.target.value)}
                      placeholder="Nom exercice"
                    />
                    <input
                      type="text"
                      className="edit-ex-cat"
                      value={ex.category || ""}
                      onChange={e => updateExField(ei, "category", e.target.value)}
                      placeholder="Catégorie"
                    />
                    <button className="remove-exercise" onClick={() => removeExercise(ei)}><X size={14} /></button>
                  </div>
                  {Array.isArray(ex.sets) && ex.sets.map((set, si) => (
                    <div key={si} className="edit-set-row">
                      {ex.unilateral ? (
                        <>
                          <input
                            type="text"
                            value={set.weightL || ""}
                            onChange={e => updateSet(ei, si, "weightL", e.target.value)}
                            placeholder="Charge G"
                          />
                          <input
                            type="text"
                            value={set.repsL || ""}
                            onChange={e => updateSet(ei, si, "repsL", e.target.value)}
                            placeholder="Reps G"
                          />
                          <input
                            type="text"
                            value={set.weightR || ""}
                            onChange={e => updateSet(ei, si, "weightR", e.target.value)}
                            placeholder="Charge D"
                          />
                          <input
                            type="text"
                            value={set.repsR || ""}
                            onChange={e => updateSet(ei, si, "repsR", e.target.value)}
                            placeholder="Reps D"
                          />
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={set.weight}
                            onChange={e => updateSet(ei, si, "weight", e.target.value)}
                            placeholder="Charge"
                          />
                          <input
                            type="text"
                            value={set.reps}
                            onChange={e => updateSet(ei, si, "reps", e.target.value)}
                            placeholder="Reps"
                          />
                        </>
                      )}
                      <button className="remove-set" onClick={() => removeSet(ei, si)}><Minus size={12} /></button>
                    </div>
                  ))}
                  <button className="btn-add-set" onClick={() => addSet(ei)}><Plus size={12} /> Set</button>
                </div>
              ))}

              <button className="btn-secondary" onClick={addExercise} style={{ width: "100%", justifyContent: "center", marginBottom: "var(--spacing-md)" }}>
                <Plus size={14} /> Exercice
              </button>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setEditingSession(null)}>Annuler</button>
                <button className="btn-primary" onClick={save}>Enregistrer</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Exercise Selection Modal (for adding to workout session) */}
      {showExerciseModal && (
        <div className="modal-overlay" onClick={() => setShowExerciseModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Ajouter un exercice</h2>
            <div className="exercise-selection">
              {exercises[workoutType].map(exercise => (
                <button
                  key={exercise.id}
                  className="exercise-select-btn"
                  onClick={() => {
                    addExerciseToWorkout(exercise);
                    setShowExerciseModal(false);
                  }}
                >
                  <span className="exercise-name">{exercise.name}</span>
                  <span className="exercise-category">{exercise.category}</span>
                </button>
              ))}
            </div>
            <button
              className="btn-secondary"
              onClick={() => setShowExerciseModal(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Exercise Modal */}
      {showAddExerciseModal && (
        <AddExerciseModal
          workoutType={workoutType}
          exercise={editExercise}
          onClose={() => { setShowAddExerciseModal(false); setEditExercise(null); }}
          onCreated={handleExerciseCreated}
        />
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="modal-overlay" onClick={() => !confirmLoading && setConfirmAction(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <p className="confirm-message">
              {confirmLoading ? "Suppression en cours..." : confirmAction.message}
            </p>
            {!confirmLoading && (
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setConfirmAction(null)}>
                  Annuler
                </button>
                <button
                  className="btn-danger"
                  onClick={async () => {
                    setConfirmLoading(true);
                    await confirmAction.onConfirm();
                    setConfirmLoading(false);
                    setConfirmAction(null);
                  }}
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutTracker;
