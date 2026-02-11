import { useState, useEffect } from "react";
import AddExerciseModal from "./AddExerciseModal";
import CalisthenicsProgress from "./CalisthenicsProgress";
import "./WorkoutTracker.css";

const WorkoutTracker = () => {
  const [activeView, setActiveView] = useState("log"); // log, exercises, progress
  const [workoutType, setWorkoutType] = useState("musculation"); // musculation, calisthenics

  const [exercises, setExercises] = useState({ musculation: [], calisthenics: [] });
  const [loading, setLoading] = useState(true);

  const [currentWorkout, setCurrentWorkout] = useState([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [editExercise, setEditExercise] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [newSet, setNewSet] = useState({ weight: "", reps: "" });

  // Calendar state
  const [expandedSession, setExpandedSession] = useState(null);
  const [editingSession, setEditingSession] = useState(null); // { id, date, type, exercises: [...] }
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [sessions, setSessions] = useState([]);

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

  const deleteSession = async (id) => {
    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      setExpandedSession(null);
      fetchSessions();
    } catch (err) {
      console.error("Erreur suppression séance:", err);
    }
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

  const addExerciseToWorkout = (exercise) => {
    if (!currentWorkout.find(e => e.id === exercise.id)) {
      setCurrentWorkout([...currentWorkout, { ...exercise, sets: [] }]);
    }
  };

  const addSet = (exerciseId) => {
    setCurrentWorkout(currentWorkout.map(ex =>
      ex.id === exerciseId
        ? { ...ex, sets: [...ex.sets, { weight: newSet.weight, reps: newSet.reps, id: Date.now() }] }
        : ex
    ));
    setNewSet({ weight: "", reps: "" });
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

  const deleteExercise = async (id, type) => {
    setExercises(prev => ({
      ...prev,
      [type]: prev[type].filter(e => e.id !== id),
    }));

    try {
      await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Erreur suppression exercice:", err);
      fetchExercises(); // rollback
    }
  };

  const VOLUME_STEPS = [
    [3,3], [4,3], [5,3], [6,3],
    [3,4], [4,4], [5,4],
    [3,5], [4,5], [5,5],
  ];
  const VOLUME_LABELS = ["3×3","4×3","5×3","6×3","3×4","4×4","5×4","3×5","4×5","5×5"];

  // Check if session sets match current volume step
  const checkVolumeMatch = (sets, stepIndex) => {
    if (stepIndex >= VOLUME_STEPS.length) return false;
    const [needSets, needReps] = VOLUME_STEPS[stepIndex];
    const validSets = sets.filter(s => parseInt(s.reps) >= needReps);
    return validSets.length >= needSets;
  };

  // Get best PR value from session sets
  const getSessionBest = (sets, exercise) => {
    const unit = exercise.unit || "reps";
    let best = null;
    for (const s of sets) {
      const val = unit === "kg" ? parseFloat(s.weight) : parseFloat(s.reps);
      if (val && (best === null || val > best)) best = val;
    }
    return best;
  };

  const validateProgression = async (exercise, newStep) => {
    const today = new Date().toISOString().split("T")[0];
    const updates = { volumeStep: newStep };
    // Reset if completed all steps
    if (newStep >= VOLUME_STEPS.length) updates.volumeStep = 0;

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
            value: exercise.volumeWeight ? parseFloat(exercise.volumeWeight) : 0,
            sets: VOLUME_LABELS[exercise.volumeStep || 0],
          }),
        }),
      ]);
      fetchExercises();
    } catch (err) {
      console.error("Erreur validation progression:", err);
    }
  };

  const validatePr = async (exercise, newValue) => {
    const today = new Date().toISOString().split("T")[0];
    const current = exercise.currentValue ?? 0;

    try {
      const promises = [
        fetch("/api/exercises/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseId: exercise.id,
            loggedDate: today,
            value: newValue,
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
      fetchExercises();
    } catch (err) {
      console.error("Erreur validation PR:", err);
    }
  };

  const finishWorkout = async () => {
    if (currentWorkout.length === 0) return;

    // Auto-validate any pending progressions
    const promises = [];
    for (const exercise of currentWorkout) {
      if (exercise.sets.length === 0) continue;
      const fresh = exercises[workoutType]?.find(e => e.id === exercise.id) || exercise;
      const method = fresh.progressionMethod;

      if (method === "volume" && checkVolumeMatch(exercise.sets, fresh.volumeStep || 0)) {
        promises.push(validateProgression(fresh, (fresh.volumeStep || 0) + 1));
      }
      if (method === "pr") {
        const best = getSessionBest(exercise.sets, fresh);
        if (best !== null) promises.push(validatePr(fresh, best));
      }
    }

    // Save session with full set details
    const summary = currentWorkout.map(ex => {
      const fr = exercises[workoutType]?.find(e => e.id === ex.id) || ex;
      return {
        name: ex.name,
        category: ex.category,
        unit: fr.unit || null,
        sets: ex.sets.map(s => ({ weight: s.weight, reps: s.reps })),
      };
    });
    promises.push(
      fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          type: workoutType,
          exercises: summary,
        }),
      }).catch(err => console.error("Erreur sauvegarde séance:", err))
    );

    await Promise.all(promises);
    setCurrentWorkout([]);
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
            🏋️ Muscu
          </button>
          <button
            className={workoutType === "calisthenics" ? "active" : ""}
            onClick={() => setWorkoutType("calisthenics")}
          >
            🤸 Calisthenics
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="view-tabs">
        <button
          className={activeView === "log" ? "active" : ""}
          onClick={() => setActiveView("log")}
        >
          Séance
        </button>
        <button
          className={activeView === "exercises" ? "active" : ""}
          onClick={() => setActiveView("exercises")}
        >
          Exercices
        </button>
        <button
          className={activeView === "progress" ? "active" : ""}
          onClick={() => setActiveView("progress")}
        >
          Progression
        </button>
        <button
          className={activeView === "calendar" ? "active" : ""}
          onClick={() => setActiveView("calendar")}
        >
          Calendrier
        </button>
      </div>

      {/* Log View - Current Workout */}
      {activeView === "log" && (
        <div className="workout-log">
          {currentWorkout.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <p>Aucun exercice ajouté</p>
              <button
                className="btn-primary"
                onClick={() => setShowExerciseModal(true)}
              >
                + Ajouter un exercice
              </button>
            </div>
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
                const volumeMatch = method === "volume" && exercise.sets.length > 0 && checkVolumeMatch(exercise.sets, fresh.volumeStep || 0);
                const prBest = method === "pr" && exercise.sets.length > 0 ? getSessionBest(exercise.sets, fresh) : null;
                const isNewRecord = prBest !== null && prBest > (fresh.currentValue ?? 0);

                // Determine input mode based on unit for PR exercises
                const isPrTime = method === "pr" && unit === "s";
                const isPrKg = method === "pr" && unit === "kg";
                const isPrReps = method === "pr" && unit === "reps";
                const singleInput = isPrTime || isPrKg || isPrReps;

                return (
                <div key={exercise.id} className="exercise-log-card">
                  <div className="exercise-log-header">
                    <h3>{exercise.name}</h3>
                    <span className="category-tag">{exercise.category}</span>
                    <button
                      className="remove-exercise"
                      onClick={() => removeExerciseFromWorkout(exercise.id)}
                    >
                      ×
                    </button>
                  </div>

                  <div className="sets-list">
                    {exercise.sets.map((set, index) => (
                      <div key={set.id} className="set-row">
                        {isPrTime ? (
                          <span className="set-weight">{set.reps}s</span>
                        ) : isPrKg ? (
                          <span className="set-weight">{set.weight}kg</span>
                        ) : isPrReps ? (
                          <span className="set-weight">{set.reps} reps</span>
                        ) : (
                          <>
                            <span className="set-weight">{set.weight}{set.weight ? "kg" : ""}</span>
                            <span className="set-reps">{set.reps} reps</span>
                          </>
                        )}
                        <button
                          className="remove-set"
                          onClick={() => removeSet(exercise.id, set.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="add-set-form">
                    {isPrTime ? (
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
                        <input
                          type="text"
                          placeholder="Charge"
                          value={selectedExercise === exercise.id ? newSet.weight : ""}
                          onFocus={() => setSelectedExercise(exercise.id)}
                          onChange={e => setNewSet({ ...newSet, weight: e.target.value })}
                        />
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
                      +
                    </button>
                  </div>

                  {/* Suggestion banner — volume step matched */}
                  {volumeMatch && (
                    <div className="session-suggest">
                      <span className="suggest-text">
                        {VOLUME_LABELS[fresh.volumeStep || 0]} validé !
                      </span>
                      <button
                        className="btn-suggest"
                        onClick={() => validateProgression(fresh, (fresh.volumeStep || 0) + 1)}
                      >
                        Enregistrer
                      </button>
                    </div>
                  )}

                  {/* Suggestion banner — PR session best */}
                  {prBest !== null && (
                    <div className="session-suggest">
                      <span className="suggest-text">
                        {isNewRecord ? "Nouveau record" : "Séance"} : {prBest}{unit === "s" ? "s" : unit === "kg" ? "kg" : " reps"}
                      </span>
                      <button
                        className="btn-suggest"
                        onClick={() => validatePr(fresh, prBest)}
                      >
                        Enregistrer
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
                + Ajouter un exercice
              </button>

              <button className="btn-primary finish-workout" onClick={finishWorkout}>
                Terminer l'entraînement
              </button>
            </>
          )}
        </div>
      )}

      {/* Exercises View */}
      {activeView === "exercises" && (
        <div className="exercises-view">
          <div className="exercises-header">
            <button
              className="add-btn"
              onClick={() => setShowAddExerciseModal(true)}
            >
              <span>+</span>
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
                    ✎
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteExercise(exercise.id, workoutType)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Progress View */}
      {activeView === "progress" && workoutType === "calisthenics" && (
        <CalisthenicsProgress
          exercises={exercises.calisthenics}
          onUpdate={fetchExercises}
        />
      )}

      {activeView === "progress" && workoutType === "musculation" && (
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

      {/* Calendar View */}
      {activeView === "calendar" && (() => {
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

        const prevMonth = () => setCalMonth(p => {
          const m = p.month - 1;
          return m < 0 ? { year: p.year - 1, month: 11 } : { ...p, month: m };
        });
        const nextMonth = () => setCalMonth(p => {
          const m = p.month + 1;
          return m > 11 ? { year: p.year + 1, month: 0 } : { ...p, month: m };
        });

        return (
          <div className="cal-view">
            <div className="cal-nav">
              <button onClick={prevMonth}>‹</button>
              <span className="cal-title">{MOIS_FR[month]} {year}</span>
              <button onClick={nextMonth}>›</button>
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
                return (
                  <div key={day} className={`cal-cell${isToday ? " today" : ""}`}>
                    <span className="cal-day">{day}</span>
                    <span className={`cal-dot${hasSession ? " active" : ""}`} />
                  </div>
                );
              })}
            </div>
            {/* Session list for this month */}
            {sessions.length > 0 && (
              <div className="cal-sessions">
                {sessions.map(s => {
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
                        <span className="cal-session-arrow">{isOpen ? "▾" : "▸"}</span>
                      </div>
                      {isOpen && (
                        <div className="cal-session-body">
                          {exList.map((ex, ei) => (
                            <div key={ei} className="cal-ex-block">
                              <div className="cal-ex-header">
                                <span className="cal-ex-name">{ex.name}</span>
                                <span className="cal-ex-cat">{ex.category}</span>
                              </div>
                              {Array.isArray(ex.sets) && ex.sets.length > 0 ? (
                                <div className="cal-ex-sets">
                                  {ex.sets.map((set, si) => (
                                    <div key={si} className="cal-ex-set">
                                      {ex.unit === "s" ? (
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
                          ))}
                          <div className="cal-session-actions">
                            <button
                              className="btn-secondary"
                              onClick={(e) => { e.stopPropagation(); setEditingSession({ id: s.id, date: s.date, type: s.type, exercises: exList }); }}
                            >
                              ✎ Modifier
                            </button>
                            <button
                              className="btn-delete"
                              onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {sessions.length === 0 && (
              <div className="empty-state">
                <p>Aucune séance ce mois</p>
              </div>
            )}
          </div>
        );
      })()}

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
            return { ...ex, sets: [...sets, { weight: "", reps: "" }] };
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
                    <button className="remove-exercise" onClick={() => removeExercise(ei)}>×</button>
                  </div>
                  {Array.isArray(ex.sets) && ex.sets.map((set, si) => (
                    <div key={si} className="edit-set-row">
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
                      <button className="remove-set" onClick={() => removeSet(ei, si)}>×</button>
                    </div>
                  ))}
                  <button className="btn-add-set" onClick={() => addSet(ei)}>+ Set</button>
                </div>
              ))}

              <button className="btn-secondary" onClick={addExercise} style={{ width: "100%", justifyContent: "center", marginBottom: "var(--spacing-md)" }}>
                + Exercice
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
    </div>
  );
};

export default WorkoutTracker;
