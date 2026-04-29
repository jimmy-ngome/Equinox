import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { getAuthUser, unauthorized } from "../_auth.js";

export async function GET(request) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return unauthorized();

    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      isAdmin: users.isAdmin,
    }).from(users).where(eq(users.id, userId));

    if (!user) return unauthorized();

    return Response.json(user);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
