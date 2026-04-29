import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { getAuthUser, unauthorized } from "../_auth.js";

export async function GET(request) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return unauthorized();

    // Check admin
    const [admin] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, userId));
    if (!admin?.isAdmin) {
      return Response.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
    }

    const pending = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.approved, false));

    return Response.json(pending);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
