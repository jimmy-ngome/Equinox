import { db } from "../../db/index.js";
import { habits, habitCompletions } from "../../db/schema.js";
import { eq, and, gte, lt } from "drizzle-orm";

// GET /api/habits/completions?month=2026-02
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const month = url.searchParams.get("month");

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return Response.json({ error: "Paramètre month requis (YYYY-MM)" }, { status: 400 });
    }

    const startDate = `${month}-01`;
    const [year, mon] = month.split("-").map(Number);
    const nextMonth = mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, "0")}-01`;

    const results = await db
      .select({
        id: habitCompletions.id,
        habitId: habitCompletions.habitId,
        completedDate: habitCompletions.completedDate,
        habitName: habits.name,
        habitIcon: habits.icon,
      })
      .from(habitCompletions)
      .innerJoin(habits, eq(habitCompletions.habitId, habits.id))
      .where(
        and(
          gte(habitCompletions.completedDate, startDate),
          lt(habitCompletions.completedDate, nextMonth)
        )
      );

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
