import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, SlidersHorizontal, Check, Save, Trophy, RotateCcw, Trash2 } from "lucide-react";
import "./CalisthenicsProgress.css";

function scrollNum(setter, step = 1) {
  return (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? step : -step;
    setter((prev) => {
      const next = Math.max(0, Math.round(((parseFloat(prev) || 0) + delta) * 100) / 100);
      return String(next);
    });
  };
}

const VOLUME_STEPS = [
  "3×3", "4×3", "5×3", "6×3",
  "3×4", "4×4", "5×4",
  "3×5", "4×5", "5×5",
];
const TOTAL_STEPS = VOLUME_STEPS.length;

const METHOD_LABELS = {
  volume: "Volume 3-4-5",
  pr: "PR",
};

const UNIT_SUFFIX = { kg: "kg", s: "s", reps: "reps" };

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonthRange(year, month) {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  return { from: formatDate(from), to: formatDate(to) };
}

function getYearRange(year) {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

// SVG mini bar chart
// SVG mini bar chart
function MiniChart({ logs, unit, goalCompletedDate }) {
  if (!logs || logs.length === 0) {
    return <div className="cali-chart-empty">Aucun log sur cette période</div>;
  }

  const MOIS_C = ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"];
  const fmtDate = (d) => { const [,m,day] = d.split("-"); return `${parseInt(day)} ${MOIS_C[parseInt(m)-1]}`; };

  const W = 600;
  const H = 130;
  const PAD = { top: 14, right: 10, bottom: 30, left: 40 };

  const values = logs.map((l) => l.value ?? 0);
  const maxVal = Math.max(...values);
  const chartH = H - PAD.top - PAD.bottom;
  const chartW = W - PAD.left - PAD.right;

  const maxBarW = 40;
  const gap = 6;
  const naturalBarW = (chartW - gap * (logs.length - 1)) / logs.length;
  const barW = Math.min(naturalBarW, maxBarW);
  const totalBarsW = barW * logs.length + gap * (logs.length - 1);
  const offsetX = PAD.left;
  const baseline = H - PAD.bottom;

  // Y-axis labels
  const yTicks = [0, maxVal / 2, maxVal];

  return (
    <div className="cali-chart-container">
      <svg className="cali-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const y = baseline - (maxVal > 0 ? (tick / maxVal) * chartH : 0);
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#333" strokeWidth="0.5" />
              <text x={PAD.left - 4} y={y + 3} fill="#555" fontSize="10" textAnchor="end" fontFamily="inherit">
                {Math.round(tick * 10) / 10}
              </text>
            </g>
          );
        })}
        {/* Bars */}
        {logs.map((l, i) => {
          const val = l.value ?? 0;
          const barH = maxVal > 0 ? (val / maxVal) * chartH : 0;
          const x = offsetX + i * (barW + gap);
          const y = baseline - barH;
          const isGoalCompleted = goalCompletedDate && l.loggedDate === goalCompletedDate;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill="#fff" />
              {/* Value label on top */}
              <text x={x + barW / 2} y={y - 3} fill="#fff" fontSize="9" textAnchor="middle" fontFamily="inherit" fontWeight="600">
                {Math.round(val * 10) / 10}
              </text>
              {/* Date label below */}
              <text x={x + barW / 2} y={baseline + 12} fill="#555" fontSize="8" textAnchor="middle" fontFamily="inherit">
                {fmtDate(l.loggedDate)}
              </text>
              {/* Goal completed marker */}
              {isGoalCompleted && (
                <text x={x + barW / 2} y={PAD.top - 2} fill="#fff" fontSize="8" textAnchor="middle" fontFamily="inherit" fontWeight="700">
                  100%
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ExerciseProgressCard({ exercise, logs, onOpenConfig, onAdjust, onNewGoal, onDeleteProgression }) {
  const [adjusting, setAdjusting] = useState(false);
  const [adjustStep, setAdjustStep] = useState(exercise.volumeStep || 0);
  const [adjustValue, setAdjustValue] = useState(exercise.currentValue ?? 0);
  const [saving, setSaving] = useState(false);

  const method = exercise.progressionMethod;
  const unit = exercise.unit || "reps";

  // Volume progress
  const volumeStep = exercise.volumeStep || 0;
  const volumePct = Math.round((volumeStep / TOTAL_STEPS) * 100);

  // PR progress
  const base = exercise.baseValue ?? 0;
  const goal = exercise.goalValue ?? 0;
  const current = exercise.currentValue ?? 0;
  const prPct = goal !== base ? Math.min(100, Math.max(0, Math.round(((current - base) / (goal - base)) * 100))) : 0;

  const unitSuffix = UNIT_SUFFIX[unit] || unit;

  // 100% detection
  const isComplete = method === "volume"
    ? volumeStep >= TOTAL_STEPS
    : method === "pr"
      ? (goal > base && current >= goal)
      : false;

  const completedDate = exercise.goalCompletedDate;
  const completedDateFr = completedDate
    ? new Date(completedDate + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const openAdjust = () => {
    setAdjustStep(volumeStep);
    setAdjustValue(current);
    setAdjusting(true);
  };

  const handleSaveAdjust = async () => {
    setSaving(true);
    const today = formatDate(new Date());

    if (method === "volume") {
      await onAdjust(exercise.id, { volumeStep: adjustStep }, {
        exerciseId: exercise.id,
        loggedDate: today,
        value: exercise.volumeWeight ? parseFloat(exercise.volumeWeight) : 0,
        sets: VOLUME_STEPS[Math.max(0, adjustStep - 1)] || VOLUME_STEPS[0],
        notes: `Ajustement manuel → étape ${adjustStep}`,
      });
    } else if (method === "pr") {
      const val = parseFloat(adjustValue) || 0;
      const updates = { currentValue: val };
      await onAdjust(exercise.id, updates, {
        exerciseId: exercise.id,
        loggedDate: today,
        value: val,
        notes: `Ajustement manuel → ${val}${unitSuffix}`,
      });
    }

    setSaving(false);
    setAdjusting(false);
  };

  return (
    <div className="cali-exercise-card">
      <div className="cali-exercise-header">
        <span className="cali-exercise-name" onClick={() => onOpenConfig(exercise)}>
          {exercise.name}
        </span>
        {exercise.progression === "weighted" && <span className="cali-badge method">Weighted</span>}
        {method && <span className="cali-badge">{METHOD_LABELS[method]}</span>}
        {method && <span className="cali-badge">{unitSuffix}</span>}
        {method && (
          <>
            <button
              className={`cali-adjust-btn${adjusting ? " active" : ""}`}
              onClick={() => adjusting ? setAdjusting(false) : openAdjust()}
              title="Ajuster la progression"
            >
              <SlidersHorizontal size={14} />
            </button>
            <button
              className="cali-delete-btn"
              onClick={() => onDeleteProgression(exercise)}
              title="Supprimer la progression"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>

      {!method && (
        <p className="cali-no-method">
          Cliquez sur le nom pour configurer le suivi →
        </p>
      )}

      {/* Volume progress */}
      {method === "volume" && (
        <div className="cali-volume-bar">
          <div className="cali-volume-info">
            <span className="cali-volume-step">
              Étape {volumeStep}/{TOTAL_STEPS} — {volumePct}%
            </span>
            <span className="cali-volume-detail">
              {exercise.volumeWeight ? `${exercise.volumeWeight}kg` : ""}
              {volumeStep < TOTAL_STEPS ? ` — ${VOLUME_STEPS[volumeStep]}` : " — Palier validé!"}
            </span>
          </div>
          {adjusting ? (
            <div className="cali-volume-blocks adjust-mode">
              {VOLUME_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`cali-volume-block clickable${i < adjustStep ? " filled" : ""}${i === adjustStep - 1 ? " target" : ""}`}
                  onClick={() => setAdjustStep(i + 1)}
                  title={`Sauter à l'étape ${i + 1} (${VOLUME_STEPS[i]})`}
                >
                  {i < adjustStep && <Check size={8} strokeWidth={3} />}
                </div>
              ))}
            </div>
          ) : (
            <div className="cali-volume-blocks">
              {VOLUME_STEPS.map((_, i) => (
                <div key={i} className={`cali-volume-block${i < volumeStep ? " filled" : ""}`} />
              ))}
            </div>
          )}
          <div className="cali-volume-labels">
            {VOLUME_STEPS.map((s, i) => (
              <span key={i} className={adjusting && i < adjustStep ? "label-filled" : ""}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* PR / Weighted progress — same bar, different labels */}
      {method === "pr" && (
        <div className="cali-pr-bar">
          <div className="cali-pr-info">
            <span className="cali-pr-current">
              {current}{unitSuffix} / {goal}{unitSuffix}
            </span>
            <span className="cali-pr-pct">{prPct}%</span>
          </div>
          <div className="cali-pr-track">
            <div className="cali-pr-fill" style={{ width: `${prPct}%` }} />
          </div>
          {adjusting && (
            <div className="cali-adjust-pr-form">
              <label>Nouvelle valeur</label>
              <div className="cali-adjust-pr-input">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={adjustValue}
                  onChange={(e) => setAdjustValue(e.target.value)}
                  onWheel={scrollNum(setAdjustValue, unit === "kg" ? 0.5 : 1)}
                />
                <span className="cali-adjust-pr-unit">{unitSuffix}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Adjust save bar */}
      {adjusting && (
        <div className="cali-adjust-actions">
          <span className="cali-adjust-hint">
            {method === "volume"
              ? `Étape ${adjustStep}/${TOTAL_STEPS} — ${VOLUME_STEPS[Math.min(adjustStep, TOTAL_STEPS - 1)]}`
              : `${adjustValue}${unitSuffix}`}
          </span>
          <div className="cali-adjust-btns">
            <button className="btn-secondary" onClick={() => setAdjusting(false)}>Annuler</button>
            <button className="btn-primary" onClick={handleSaveAdjust} disabled={saving}>
              <Save size={12} /> {saving ? "Enregistrement..." : "Valider"}
            </button>
          </div>
        </div>
      )}

      {/* 100% completed badge */}
      {completedDate && !isComplete && (
        <div className="cali-completed-badge">
          <Trophy size={12} />
          <span>Dernier objectif atteint le {completedDateFr}</span>
        </div>
      )}

      {/* 100% suggestion banner */}
      {isComplete && !adjusting && (
        <div className="cali-goal-banner">
          <div className="cali-goal-banner-top">
            <Trophy size={16} />
            <span className="cali-goal-banner-title">Objectif atteint !</span>
            {completedDate && <span className="cali-goal-banner-date">{completedDateFr}</span>}
          </div>
          <button className="btn-primary cali-new-goal-btn" onClick={() => onNewGoal(exercise)}>
            <RotateCcw size={12} /> Nouvel objectif
          </button>
        </div>
      )}

      {/* Chart */}
      {method && (
        <>
          <div className="cali-chart-label">
            {exercise.progression === "weighted" || exercise.type === "musculation"
              ? (unit === "s" ? "Temps total (s)" : unit === "kg" ? "Charge totale (kg)" : "Volume total (kg)")
              : unit === "s" ? "Temps total (s)" : "Reps totales"}
          </div>
          <MiniChart logs={logs} unit={unit} goalCompletedDate={completedDate} />
        </>
      )}
    </div>
  );
}

function ConfigModal({ exercise, onClose, onSave }) {
  const isWeighted = exercise.progression === "weighted";
  const [style, setStyle] = useState(isWeighted ? "weighted" : "bodyweight");
  const [method, setMethod] = useState(exercise.progressionMethod || "");
  const [unit, setUnit] = useState(exercise.unit || "reps");
  const [baseValue, setBaseValue] = useState(exercise.baseValue ?? "");
  const [goalValue, setGoalValue] = useState(exercise.goalValue ?? "");
  const [volumeWeight, setVolumeWeight] = useState(exercise.volumeWeight || "");
  const [saving, setSaving] = useState(false);

  const handleMethodChange = (m) => {
    setMethod(m);
    if (m === "volume") setUnit("reps");
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      progressionMethod: method || null,
      unit,
      progression: style,
    };

    if (method === "pr") {
      updates.baseValue = parseFloat(baseValue) || 0;
      updates.goalValue = parseFloat(goalValue) || 0;
      updates.currentValue = exercise.currentValue ?? updates.baseValue;
    } else if (method === "volume") {
      updates.volumeWeight = volumeWeight;
      if (!exercise.volumeStep) updates.volumeStep = 0;
    }

    await onSave(exercise.id, updates);
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal cali-config-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Config — {exercise.name}</h2>

        <div className="form-group">
          <label>Style</label>
          <div className="btn-group">
            <button className={`btn-option${style === "bodyweight" ? " active" : ""}`} onClick={() => setStyle("bodyweight")}>
              Bodyweight
            </button>
            <button className={`btn-option${style === "weighted" ? " active" : ""}`} onClick={() => setStyle("weighted")}>
              Weighted
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Progression</label>
          <div className="btn-group">
            <button className={`btn-option${method === "volume" ? " active" : ""}`} onClick={() => handleMethodChange("volume")}>
              Volume 3-4-5
            </button>
            <button className={`btn-option${method === "pr" ? " active" : ""}`} onClick={() => handleMethodChange("pr")}>
              PR
            </button>
          </div>
        </div>

        {method === "pr" && (
          <>
            <div className="form-group">
              <label>Quantificateur</label>
              <div className="btn-group">
                <button className={`btn-option${unit === "reps" ? " active" : ""}`} onClick={() => setUnit("reps")}>
                  Reps max
                </button>
                <button className={`btn-option${unit === "s" ? " active" : ""}`} onClick={() => setUnit("s")}>
                  Temps
                </button>
                {style === "weighted" && (
                  <button className={`btn-option${unit === "kg" ? " active" : ""}`} onClick={() => setUnit("kg")}>
                    Kg
                  </button>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Départ</label>
              <input
                type="number"
                min="0"
                step="any"
                value={baseValue}
                onChange={(e) => setBaseValue(e.target.value)}
                onWheel={scrollNum(setBaseValue)}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Objectif</label>
              <input
                type="number"
                min="0"
                step="any"
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
                onWheel={scrollNum(setGoalValue)}
                placeholder={unit === "s" ? "Ex: 30" : unit === "kg" ? "Ex: 40" : "Ex: 20"}
              />
            </div>
          </>
        )}

        {method === "volume" && style === "weighted" && (
          <div className="form-group">
            <label>Charge du palier (kg)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={volumeWeight}
              onChange={(e) => setVolumeWeight(e.target.value)}
              onWheel={scrollNum(setVolumeWeight)}
              placeholder="10"
            />
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewGoalModal({ exercise, onClose, onSave }) {
  const method = exercise.progressionMethod;
  const unit = exercise.unit || "reps";
  const unitSuffix = UNIT_SUFFIX[unit] || unit;
  const isWeighted = exercise.progression === "weighted";

  // Volume: new weight
  const [newVolumeWeight, setNewVolumeWeight] = useState(exercise.volumeWeight || "");

  // PR: new goal (base = old goal)
  const [newGoal, setNewGoal] = useState("");

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const today = formatDate(new Date());

    if (method === "volume") {
      await onSave(exercise.id, {
        volumeStep: 0,
        volumeWeight: newVolumeWeight || exercise.volumeWeight,
        goalCompletedDate: exercise.goalCompletedDate || today,
      }, {
        exerciseId: exercise.id,
        loggedDate: today,
        value: newVolumeWeight ? parseFloat(newVolumeWeight) : (exercise.volumeWeight ? parseFloat(exercise.volumeWeight) : 0),
        notes: `Nouvel objectif volume${newVolumeWeight ? ` — ${newVolumeWeight}kg` : ""}`,
      });
    } else if (method === "pr") {
      const newGoalVal = parseFloat(newGoal) || 0;
      await onSave(exercise.id, {
        baseValue: exercise.goalValue,
        goalValue: newGoalVal,
        currentValue: exercise.currentValue,
        goalCompletedDate: exercise.goalCompletedDate || today,
      }, {
        exerciseId: exercise.id,
        loggedDate: today,
        value: exercise.currentValue,
        notes: `Nouvel objectif PR — ${newGoalVal}${unitSuffix}`,
      });
    }

    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Nouvel objectif</h2>
        <p className="cali-new-goal-subtitle">{exercise.name}</p>

        {method === "volume" && (
          <div className="form-group">
            <label>
              Nouvelle charge {isWeighted ? "(kg)" : "(optionnel)"}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={newVolumeWeight}
              onChange={(e) => setNewVolumeWeight(e.target.value)}
              onWheel={scrollNum(setNewVolumeWeight, 0.5)}
              placeholder={exercise.volumeWeight || "10"}
            />
            <p className="cali-new-goal-info">
              La progression reprendra a l'etape 1/10 (3x3)
            </p>
          </div>
        )}

        {method === "pr" && (
          <>
            <div className="form-group">
              <label>Nouveau depart</label>
              <div className="cali-new-goal-readonly">
                {exercise.goalValue}{unitSuffix}
              </div>
            </div>
            <div className="form-group">
              <label>Nouvel objectif ({unitSuffix})</label>
              <input
                type="number"
                min="0"
                step="any"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onWheel={scrollNum(setNewGoal, unit === "kg" ? 0.5 : 1)}
                placeholder={`Ex: ${Math.round((exercise.goalValue || 0) * 1.2)}`}
              />
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || (method === "pr" && !newGoal)}>
            {saving ? "Enregistrement..." : "Valider"}
          </button>
        </div>
      </div>
    </div>
  );
}

const CalisthenicsProgress = ({ exercises, onUpdate }) => {
  const [scale, setScale] = useState("month"); // month, year, custom
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current
  const [yearOffset, setYearOffset] = useState(0);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [logsMap, setLogsMap] = useState({}); // { exerciseId: [...logs] }
  const [configExercise, setConfigExercise] = useState(null);
  const [newGoalExercise, setNewGoalExercise] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Compute date range
  const dateRange = useMemo(() => {
    const now = new Date();
    if (scale === "month") {
      const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      return { ...getMonthRange(d.getFullYear(), d.getMonth()), label: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}` };
    }
    if (scale === "year") {
      const y = now.getFullYear() + yearOffset;
      return { ...getYearRange(y), label: `${y}` };
    }
    // custom
    return { from: customFrom, to: customTo, label: "Personnalisé" };
  }, [scale, monthOffset, yearOffset, customFrom, customTo]);

  // Auto-save goalCompletedDate when exercise hits 100%
  useEffect(() => {
    for (const ex of exercises) {
      if (ex.goalCompletedDate) continue;
      const method = ex.progressionMethod;
      const isComplete = method === "volume"
        ? (ex.volumeStep || 0) >= TOTAL_STEPS
        : method === "pr"
          ? (ex.goalValue > ex.baseValue && (ex.currentValue ?? 0) >= ex.goalValue)
          : false;
      if (isComplete) {
        const today = formatDate(new Date());
        fetch(`/api/exercises/${ex.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goalCompletedDate: today }),
        }).then(() => onUpdate()).catch(() => {});
      }
    }
  }, [exercises]);

  // Fetch logs for all exercises in range
  useEffect(() => {
    if (!dateRange.from || !dateRange.to || !exercises?.length) return;

    const fetchAll = async () => {
      const entries = await Promise.all(
        exercises.map(async (ex) => {
          try {
            const res = await fetch(
              `/api/exercises/logs?exerciseId=${ex.id}&from=${dateRange.from}&to=${dateRange.to}`
            );
            const data = await res.json();
            return [ex.id, data];
          } catch {
            return [ex.id, []];
          }
        })
      );
      setLogsMap(Object.fromEntries(entries));
    };

    fetchAll();
  }, [exercises, dateRange.from, dateRange.to]);

  const handleExerciseUpdate = async (id, updates) => {
    try {
      await fetch(`/api/exercises/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      onUpdate();
    } catch (err) {
      console.error("Erreur update:", err);
    }
  };

  const handleAdjust = async (id, updates, logEntry) => {
    try {
      await Promise.all([
        fetch(`/api/exercises/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }),
        fetch("/api/exercises/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(logEntry),
        }),
      ]);
      onUpdate();
      // Refresh logs
      const from = dateRange.from;
      const to = dateRange.to;
      if (from && to) {
        const res = await fetch(`/api/exercises/logs?exerciseId=${id}&from=${from}&to=${to}`);
        const data = await res.json();
        setLogsMap(prev => ({ ...prev, [id]: data }));
      }
    } catch (err) {
      console.error("Erreur ajustement:", err);
    }
  };

  const handleDeleteProgression = (exercise) => {
    setConfirmAction({
      message: `Supprimer la progression de "${exercise.name}" ? Tous les logs seront effacés et la configuration sera réinitialisée.`,
      onConfirm: async () => {
        try {
          await Promise.all([
            fetch(`/api/exercises/${exercise.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                progressionMethod: null,
                volumeStep: 0,
                currentValue: null,
                baseValue: null,
                goalValue: null,
                goalCompletedDate: null,
                volumeWeight: null,
              }),
            }),
            fetch(`/api/exercises/logs?exerciseId=${exercise.id}`, {
              method: "DELETE",
            }),
          ]);
          setLogsMap((prev) => ({ ...prev, [exercise.id]: [] }));
          onUpdate();
        } catch (err) {
          console.error("Erreur suppression progression:", err);
        }
      },
    });
  };

  return (
    <div className="cali-progress">
      {/* Time scale selector */}
      <div className="cali-time-scale">
        <div className="cali-scale-tabs">
          <button className={scale === "month" ? "active" : ""} onClick={() => setScale("month")}>
            Mois
          </button>
          <button className={scale === "year" ? "active" : ""} onClick={() => setScale("year")}>
            Année
          </button>
          <button className={scale === "custom" ? "active" : ""} onClick={() => setScale("custom")}>
            Custom
          </button>
        </div>

        {scale === "month" && (
          <div className="cali-period-nav">
            <button onClick={() => setMonthOffset((o) => o - 1)}><ChevronLeft size={16} /></button>
            <span className="cali-period-label">{dateRange.label}</span>
            <button onClick={() => setMonthOffset((o) => o + 1)}><ChevronRight size={16} /></button>
          </div>
        )}

        {scale === "year" && (
          <div className="cali-period-nav">
            <button onClick={() => setYearOffset((o) => o - 1)}><ChevronLeft size={16} /></button>
            <span className="cali-period-label">{dateRange.label}</span>
            <button onClick={() => setYearOffset((o) => o + 1)}><ChevronRight size={16} /></button>
          </div>
        )}

        {scale === "custom" && (
          <div className="cali-custom-range">
            <label>Du</label>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <label>Au</label>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </div>
        )}
      </div>

      {/* Per-exercise cards */}
      {exercises.map((ex) => (
        <ExerciseProgressCard
          key={ex.id}
          exercise={ex}
          logs={logsMap[ex.id] || []}
          onOpenConfig={setConfigExercise}
          onAdjust={handleAdjust}
          onNewGoal={setNewGoalExercise}
          onDeleteProgression={handleDeleteProgression}
        />
      ))}

      {exercises.length === 0 && (
        <div className="cali-chart-empty">Aucun exercice calisthenics</div>
      )}

      {/* Config modal */}
      {configExercise && (
        <ConfigModal
          exercise={configExercise}
          onClose={() => setConfigExercise(null)}
          onSave={async (id, updates) => {
            await handleExerciseUpdate(id, updates);
            setConfigExercise(null);
          }}
        />
      )}

      {/* New Goal modal */}
      {newGoalExercise && (
        <NewGoalModal
          exercise={newGoalExercise}
          onClose={() => setNewGoalExercise(null)}
          onSave={async (id, updates, logEntry) => {
            await handleAdjust(id, updates, logEntry);
            setNewGoalExercise(null);
          }}
        />
      )}

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="modal-overlay" onClick={() => !confirmLoading && setConfirmAction(null)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
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

export default CalisthenicsProgress;
