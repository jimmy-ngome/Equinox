import { db } from "../../db/index.js";
import { exercises } from "../../db/schema.js";
import { eq } from "drizzle-orm";

// GET - Liste les exercices, filtre optionnel ?type=musculation|calisthenics
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    let query = db.select().from(exercises);
    if (type) {
      query = query.where(eq(exercises.type, type));
    }

    const allExercises = await query;
    return Response.json(allExercises);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST - Crée un nouvel exercice
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name, category, type,
      pr, lastWeight, lastReps, progression, reps,
      progressionMethod, unit, baseValue, goalValue, currentValue,
      volumeStep, volumeWeight,
    } = body;

    if (!name || !category || !type) {
      return Response.json(
        { error: "name, category et type sont requis" },
        { status: 400 }
      );
    }

    const values = { name, category, type };
    // Musculation fields
    if (pr !== undefined) values.pr = pr;
    if (lastWeight !== undefined) values.lastWeight = lastWeight;
    if (lastReps !== undefined) values.lastReps = lastReps;
    // Calisthenics fields
    if (progression !== undefined) values.progression = progression;
    if (reps !== undefined) values.reps = reps;
    // Progression tracking fields
    if (progressionMethod !== undefined) values.progressionMethod = progressionMethod;
    if (unit !== undefined) values.unit = unit;
    if (baseValue !== undefined) values.baseValue = baseValue;
    if (goalValue !== undefined) values.goalValue = goalValue;
    if (currentValue !== undefined) values.currentValue = currentValue;
    if (volumeStep !== undefined) values.volumeStep = volumeStep;
    if (volumeWeight !== undefined) values.volumeWeight = volumeWeight;

    const newExercise = await db
      .insert(exercises)
      .values(values)
      .returning();

    return Response.json(newExercise[0], { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
