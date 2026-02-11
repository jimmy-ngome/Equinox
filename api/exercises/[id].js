import { db } from "../../db/index.js";
import { exercises } from "../../db/schema.js";
import { eq } from "drizzle-orm";

function getId(request) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  return parseInt(segments[segments.length - 1]);
}

// PUT - Met à jour un exercice (PR, poids, reps, progression, etc.)
export async function PUT(request) {
  try {
    const id = getId(request);
    const body = await request.json();

    const [existing] = await db.select().from(exercises).where(eq(exercises.id, id));
    if (!existing) {
      return Response.json({ error: "Exercice non trouvé" }, { status: 404 });
    }

    const updated = await db
      .update(exercises)
      .set(body)
      .where(eq(exercises.id, id))
      .returning();

    return Response.json(updated[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Supprime un exercice
export async function DELETE(request) {
  try {
    const id = getId(request);

    const [existing] = await db.select().from(exercises).where(eq(exercises.id, id));
    if (!existing) {
      return Response.json({ error: "Exercice non trouvé" }, { status: 404 });
    }

    await db.delete(exercises).where(eq(exercises.id, id));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
