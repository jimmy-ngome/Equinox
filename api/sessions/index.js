import { db } from "../../db/index.js";
import { workoutSessions } from "../../db/schema.js";
import { eq, and, gte, lte } from "drizzle-orm";

// GET - Sessions par mois ou plage
// ?from=YYYY-MM-DD&to=YYYY-MM-DD  ou  ?month=YYYY-MM
export async function GET(request) {
  try {
    const url = new URL(request.url);
    let from = url.searchParams.get("from");
    let to = url.searchParams.get("to");
    const month = url.searchParams.get("month");

    if (month && !from) {
      const [y, m] = month.split("-").map(Number);
      from = `${y}-${String(m).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      to = `${y}-${String(m).padStart(2, "0")}-${lastDay}`;
    }

    const conditions = [];
    if (from) conditions.push(gte(workoutSessions.date, from));
    if (to) conditions.push(lte(workoutSessions.date, to));

    const sessions = await db
      .select()
      .from(workoutSessions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(workoutSessions.date);

    return Response.json(sessions);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST - Enregistrer une séance
export async function POST(request) {
  try {
    const body = await request.json();
    const { date, type, exercises } = body;

    if (!date || !type) {
      return Response.json({ error: "date et type requis" }, { status: 400 });
    }

    const newSession = await db
      .insert(workoutSessions)
      .values({ date, type, exercises: typeof exercises === "string" ? exercises : JSON.stringify(exercises) })
      .returning();

    return Response.json(newSession[0], { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
