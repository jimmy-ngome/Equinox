import { db } from "../../db/index.js";
import { habits } from "../../db/schema.js";

// GET - Liste toutes les habitudes actives
export async function GET() {
  try {
    const allHabits = await db.select().from(habits);
    return Response.json(allHabits);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST - Crée une nouvelle habitude
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, icon, color, time } = body;

    if (!name) {
      return Response.json({ error: "name est requis" }, { status: 400 });
    }

    const newHabit = await db
      .insert(habits)
      .values({ name, icon: icon || "⭐", color: color || "#22d3ee", time: time || "Matin" })
      .returning();

    return Response.json(newHabit[0], { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
