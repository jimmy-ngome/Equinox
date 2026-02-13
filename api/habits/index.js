import { db } from "../../db/index.js";
import { habits, habitCompletions } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";

// GET - Liste toutes les habitudes actives
export async function GET() {
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const allHabits = await db.select().from(habits);

    // Get today's completions
    const todayCompletions = await db
      .select()
      .from(habitCompletions)
      .where(eq(habitCompletions.completedDate, today));

    const completedIds = new Set(todayCompletions.map(c => c.habitId));

    // Override completedToday based on actual completions for today
    const habitsWithStatus = allHabits.map(h => ({
      ...h,
      completedToday: completedIds.has(h.id),
    }));

    return Response.json(habitsWithStatus);
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
