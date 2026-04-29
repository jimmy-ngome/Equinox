import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { getAuthUser, unauthorized } from "../_auth.js";

export async function POST(request) {
  try {
    const adminId = await getAuthUser(request);
    if (!adminId) return unauthorized();

    // Check admin
    const [admin] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, adminId));
    if (!admin?.isAdmin) {
      return Response.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
    }

    const { userId, action } = await request.json();

    if (!userId || !["approve", "reject"].includes(action)) {
      return Response.json({ error: "userId et action (approve|reject) requis" }, { status: 400 });
    }

    if (action === "approve") {
      await db.update(users).set({ approved: true }).where(eq(users.id, userId));
      return Response.json({ success: true, message: "Utilisateur approuvé" });
    } else {
      await db.delete(users).where(eq(users.id, userId));
      return Response.json({ success: true, message: "Utilisateur refusé et supprimé" });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
