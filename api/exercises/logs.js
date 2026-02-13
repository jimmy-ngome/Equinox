import { db } from "../../db/index.js";
import { exerciseLogs } from "../../db/schema.js";
import { eq, and, gte, lte } from "drizzle-orm";

// GET - Logs filtrés par exercice et plage de dates
// ?exerciseId=X&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const exerciseId = url.searchParams.get("exerciseId");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (!exerciseId) {
      return Response.json({ error: "exerciseId requis" }, { status: 400 });
    }

    const conditions = [eq(exerciseLogs.exerciseId, parseInt(exerciseId))];
    if (from) conditions.push(gte(exerciseLogs.loggedDate, from));
    if (to) conditions.push(lte(exerciseLogs.loggedDate, to));

    const logs = await db
      .select()
      .from(exerciseLogs)
      .where(and(...conditions))
      .orderBy(exerciseLogs.loggedDate);

    return Response.json(logs);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Supprime tous les logs d'un exercice
// ?exerciseId=X
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const exerciseId = url.searchParams.get("exerciseId");

    if (!exerciseId) {
      return Response.json({ error: "exerciseId requis" }, { status: 400 });
    }

    await db
      .delete(exerciseLogs)
      .where(eq(exerciseLogs.exerciseId, parseInt(exerciseId)));

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST - Crée un log d'exercice
export async function POST(request) {
  try {
    const body = await request.json();
    const { exerciseId, loggedDate, value, sets, notes } = body;

    if (!exerciseId || !loggedDate) {
      return Response.json(
        { error: "exerciseId et loggedDate requis" },
        { status: 400 }
      );
    }

    const newLog = await db
      .insert(exerciseLogs)
      .values({ exerciseId, loggedDate, value, sets, notes })
      .returning();

    return Response.json(newLog[0], { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
