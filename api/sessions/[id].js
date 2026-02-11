import { db } from "../../db/index.js";
import { workoutSessions } from "../../db/schema.js";
import { eq } from "drizzle-orm";

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

// DELETE - Supprimer une séance
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = parseInt(url.pathname.split("/").pop());

    await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
