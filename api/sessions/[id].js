import { db } from "../../db/index.js";
import { workoutSessions, exercises, exerciseLogs } from "../../db/schema.js";
import { eq, and, inArray } from "drizzle-orm";

// PUT - Modifier une séance
export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const id = parseInt(url.pathname.split("/").pop());
    const body = await request.json();

    const updates = {};
    if (body.date) updates.date = body.date;
    if (body.type) updates.type = body.type;
    if (body.exercises !== undefined) {
      updates.exercises = typeof body.exercises === "string"
        ? body.exercises
        : JSON.stringify(body.exercises);
    }

    const result = await db
      .update(workoutSessions)
      .set(updates)
      .where(eq(workoutSessions.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "Séance introuvable" }, { status: 404 });
    }
    return Response.json(result[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Supprimer une séance et les logs associés
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = parseInt(url.pathname.split("/").pop());

    // Fetch session to get date and exercises
    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.id, id));

    if (!session) {
      return Response.json({ error: "Séance introuvable" }, { status: 404 });
    }

    // Parse exercises from session JSON to get names
    let exNames = [];
    try {
      const exList = JSON.parse(session.exercises || "[]");
      exNames = exList.map((e) => e.name).filter(Boolean);
    } catch {}

    // Find matching exercise IDs and delete their logs for this date
    if (exNames.length > 0) {
      const matchedExercises = await db
        .select({ id: exercises.id })
        .from(exercises)
        .where(inArray(exercises.name, exNames));

      const exIds = matchedExercises.map((e) => e.id);

      if (exIds.length > 0) {
        await db
          .delete(exerciseLogs)
          .where(
            and(
              inArray(exerciseLogs.exerciseId, exIds),
              eq(exerciseLogs.loggedDate, session.date)
            )
          );
      }
    }

    // Delete the session itself
    await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
