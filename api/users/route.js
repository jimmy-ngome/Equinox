import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";

// GET - Liste tous les utilisateurs
export async function GET() {
  try {
    const allUsers = await db.select().from(users);
    return Response.json(allUsers);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST - Crée un nouvel utilisateur
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, avatarUrl } = body;

    if (!name || !email) {
      return Response.json(
        { error: "name et email sont requis" },
        { status: 400 }
      );
    }

    const newUser = await db
      .insert(users)
      .values({ name, email, avatarUrl })
      .returning();

    return Response.json(newUser[0], { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
