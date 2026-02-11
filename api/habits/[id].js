import { db } from "../../db/index.js";
import { habits, habitCompletions } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";

function getId(request) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  return parseInt(segments[segments.length - 1]);
}

// PUT - Met à jour une habitude (toggle completed, update streak, etc.)
export async function PUT(request) {
  try {
    const id = getId(request);
    const body = await request.json();

    const [existing] = await db.select().from(habits).where(eq(habits.id, id));
    if (!existing) {
      return Response.json({ error: "Habitude non trouvée" }, { status: 404 });
    }

    // Don't persist the 'date' field to habits table
    const { date, ...habitFields } = body;

    const updated = await db
      .update(habits)
      .set(habitFields)
      .where(eq(habits.id, id))
      .returning();

    // Track completion history
    if ("completedToday" in body) {
      const completedDate = body.date || new Date().toISOString().split("T")[0];

      if (body.completedToday) {
        await db
          .insert(habitCompletions)
          .values({ habitId: id, completedDate })
          .onConflictDoNothing();
      } else {
        await db
          .delete(habitCompletions)
          .where(
            and(
              eq(habitCompletions.habitId, id),
              eq(habitCompletions.completedDate, completedDate)
            )
          );
      }
    }

    return Response.json(updated[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Supprime une habitude
export async function DELETE(request) {
  try {
    const id = getId(request);

    const [existing] = await db.select().from(habits).where(eq(habits.id, id));
    if (!existing) {
      return Response.json({ error: "Habitude non trouvée" }, { status: 404 });
    }

    await db.delete(habits).where(eq(habits.id, id));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
