import { useState, useEffect, useMemo } from "react";
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
  return d.toISOString().split("T")[0];
}

function getMonthRange(year, month) {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  return { from: formatDate(from), to: formatDate(to) };
}

function getYearRange(year) {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

// SVG mini chart
function MiniChart({ logs, unit }) {
  if (!logs || logs.length === 0) {
    return <div className="cali-chart-empty">Aucun log sur cette période</div>;
  }

  const W = 600;
  const H = 120;
  const PAD = { top: 10, right: 10, bottom: 20, left: 40 };

  const values = logs.map((l) => l.value ?? 0);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const xStep = logs.length > 1 ? (W - PAD.left - PAD.right) / (logs.length - 1) : 0;

  const points = logs.map((l, i) => {
    const x = PAD.left + i * xStep;
    const y = PAD.top + (1 - (((l.value ?? 0) - minVal) / range)) * (H - PAD.top - PAD.bottom);
    return { x, y, date: l.loggedDate, value: l.value };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Y-axis labels (3 ticks)
  const yTicks = [minVal, (minVal + maxVal) / 2, maxVal];

  return (
    <div className="cali-chart-container">
      <svg className="cali-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const y = PAD.top + (1 - ((tick - minVal) / range)) * (H - PAD.top - PAD.bottom);
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#333" strokeWidth="0.5" />
              <text x={PAD.left - 4} y={y + 3} fill="#555" fontSize="10" textAnchor="end" fontFamily="inherit">
                {Math.round(tick * 10) / 10}
              </text>
            </g>
          );
        })}
        {/* Line */}
        <polyline fill="none" stroke="#fff" strokeWidth="2" points={polyline} />
        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#000" strokeWidth="1.5" />
        ))}
        {/* X-axis date labels (first and last) */}
        {points.length > 0 && (
          <>
            <text x={points[0].x} y={H - 2} fill="#555" fontSize="9" textAnchor="start" fontFamily="inherit">
              {points[0].date}
            </text>
            {points.length > 1 && (
              <text x={points[points.length - 1].x} y={H - 2} fill="#555" fontSize="9" textAnchor="end" fontFamily="inherit">
                {points[points.length - 1].date}
              </text>
            )}
          </>
        )}
      </svg>
    </div>
  );
}

function ExerciseProgressCard({ exercise, logs, onOpenConfig }) {
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

  return (
    <div className="cali-exercise-card">
      <div className="cali-exercise-header">
        <span className="cali-exercise-name" onClick={() => onOpenConfig(exercise)}>
          {exercise.name}
        </span>
        {exercise.progression === "weighted" && <span className="cali-badge method">Weighted</span>}
        {method && <span className="cali-badge">{METHOD_LABELS[method]}</span>}
        {method && <span className="cali-badge">{unitSuffix}</span>}
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
          <div className="cali-volume-blocks">
            {VOLUME_STEPS.map((_, i) => (
              <div key={i} className={`cali-volume-block${i < volumeStep ? " filled" : ""}`} />
            ))}
          </div>
          <div className="cali-volume-labels">
            {VOLUME_STEPS.map((s, i) => (
              <span key={i}>{s}</span>
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
        </div>
      )}

      {/* Chart */}
      {method && <MiniChart logs={logs} unit={unit} />}
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
            {saving ? "..." : "Enregistrer"}
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
            <button onClick={() => setMonthOffset((o) => o - 1)}>‹</button>
            <span className="cali-period-label">{dateRange.label}</span>
            <button onClick={() => setMonthOffset((o) => o + 1)}>›</button>
          </div>
        )}

        {scale === "year" && (
          <div className="cali-period-nav">
            <button onClick={() => setYearOffset((o) => o - 1)}>‹</button>
            <span className="cali-period-label">{dateRange.label}</span>
            <button onClick={() => setYearOffset((o) => o + 1)}>›</button>
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
    </div>
  );
};

export default CalisthenicsProgress;
