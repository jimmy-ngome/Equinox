import { useState } from "react";

const CALI_CATEGORIES = ["Push", "Pull", "Balance", "Abs"];

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

const AddExerciseModal = ({ workoutType, onClose, onCreated, exercise }) => {
  const isEdit = !!exercise;
  const isCali = workoutType === "calisthenics";

  // Common
  const [name, setName] = useState(exercise?.name || "");

  // Musculation
  const [muscuCategory, setMuscuCategory] = useState(exercise?.category || "");
  const [muscuPr, setMuscuPr] = useState(exercise?.pr || "");
  const [muscuLastWeight, setMuscuLastWeight] = useState(exercise?.lastWeight || "");
  const [muscuLastReps, setMuscuLastReps] = useState(exercise?.lastReps || "");

  // Calisthenics
  const [caliCategory, setCaliCategory] = useState(exercise?.category || "");
  const [style, setStyle] = useState(exercise?.progression === "weighted" ? "weighted" : "bodyweight");
  const [method, setMethod] = useState(exercise?.progressionMethod || "");
  const [unit, setUnit] = useState(exercise?.unit || "reps");
  const [baseValue, setBaseValue] = useState(exercise?.baseValue ?? "");
  const [goalValue, setGoalValue] = useState(exercise?.goalValue ?? "");
  const [volumeWeight, setVolumeWeight] = useState(exercise?.volumeWeight || "");

  const handleMethodChange = (m) => {
    setMethod(m);
    if (m === "volume") {
      setUnit("reps");
    }
  };

  const handleSubmit = async () => {
    const category = isCali ? caliCategory : muscuCategory;
    if (!name.trim() || !category.trim()) return;

    let body;

    if (!isCali) {
      body = {
        name: name.trim(),
        category,
        type: "musculation",
        pr: muscuPr || null,
        lastWeight: muscuLastWeight || null,
        lastReps: muscuLastReps || null,
      };
    } else {
      body = {
        name: name.trim(),
        category,
        type: "calisthenics",
        progression: style,
        progressionMethod: method || null,
        unit: method === "pr" ? unit : "reps",
      };

      if (method === "pr") {
        body.baseValue = parseFloat(baseValue) || 0;
        body.goalValue = parseFloat(goalValue) || 0;
        if (!isEdit) body.currentValue = body.baseValue;
      }

      if (method === "volume") {
        if (!isEdit) body.volumeStep = 0;
        if (style === "weighted" && volumeWeight) {
          body.volumeWeight = volumeWeight;
        }
      }
    }

    try {
      const url = isEdit ? `/api/exercises/${exercise.id}` : "/api/exercises";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      onCreated(result);
    } catch (err) {
      console.error("Erreur exercice:", err);
    }
  };

  const canSubmit = name.trim() && (isCali ? caliCategory : muscuCategory.trim());

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{isEdit ? "Modifier exercice" : "Nouvel exercice"}</h2>

        {/* Nom */}
        <div className="form-group">
          <label>Nom</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={isCali ? "Ex: Pull-ups, Front Lever..." : "Ex: Bench Press, Squat..."}
          />
        </div>

        {/* ===== MUSCULATION ===== */}
        {!isCali && (
          <>
            <div className="form-group">
              <label>Catégorie</label>
              <input
                type="text"
                value={muscuCategory}
                onChange={e => setMuscuCategory(e.target.value)}
                placeholder="Ex: Chest, Legs, Back..."
              />
            </div>
            <div className="form-group">
              <label>PR</label>
              <input
                type="text"
                value={muscuPr}
                onChange={e => setMuscuPr(e.target.value)}
                placeholder="Ex: 100kg"
              />
            </div>
            <div className="form-group">
              <label>Dernier poids</label>
              <input
                type="text"
                value={muscuLastWeight}
                onChange={e => setMuscuLastWeight(e.target.value)}
                placeholder="Ex: 95kg"
              />
            </div>
            <div className="form-group">
              <label>Dernières reps</label>
              <input
                type="text"
                value={muscuLastReps}
                onChange={e => setMuscuLastReps(e.target.value)}
                placeholder="Ex: 8"
              />
            </div>
          </>
        )}

        {/* ===== CALISTHENICS ===== */}
        {isCali && (
          <>
            <div className="form-group">
              <label>Catégorie</label>
              <div className="btn-group">
                {CALI_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`btn-option${caliCategory === cat ? " active" : ""}`}
                    onClick={() => setCaliCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Style</label>
              <div className="btn-group">
                <button
                  type="button"
                  className={`btn-option${style === "bodyweight" ? " active" : ""}`}
                  onClick={() => setStyle("bodyweight")}
                >
                  Bodyweight
                </button>
                <button
                  type="button"
                  className={`btn-option${style === "weighted" ? " active" : ""}`}
                  onClick={() => setStyle("weighted")}
                >
                  Weighted
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Progression</label>
              <div className="btn-group">
                <button
                  type="button"
                  className={`btn-option${method === "volume" ? " active" : ""}`}
                  onClick={() => handleMethodChange("volume")}
                >
                  Volume 3-4-5
                </button>
                <button
                  type="button"
                  className={`btn-option${method === "pr" ? " active" : ""}`}
                  onClick={() => handleMethodChange("pr")}
                >
                  PR
                </button>
              </div>
            </div>

            {method === "pr" && (
              <>
                <div className="form-group">
                  <label>Quantificateur</label>
                  <div className="btn-group">
                    <button
                      type="button"
                      className={`btn-option${unit === "reps" ? " active" : ""}`}
                      onClick={() => setUnit("reps")}
                    >
                      Reps max
                    </button>
                    <button
                      type="button"
                      className={`btn-option${unit === "s" ? " active" : ""}`}
                      onClick={() => setUnit("s")}
                    >
                      Temps
                    </button>
                    {style === "weighted" && (
                      <button
                        type="button"
                        className={`btn-option${unit === "kg" ? " active" : ""}`}
                        onClick={() => setUnit("kg")}
                      >
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
                    onChange={e => setBaseValue(e.target.value)}
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
                    onChange={e => setGoalValue(e.target.value)}
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
                  onChange={e => setVolumeWeight(e.target.value)}
                  onWheel={scrollNum(setVolumeWeight)}
                  placeholder="10"
                />
              </div>
            )}
          </>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
            {isEdit ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExerciseModal;
