import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { verifyPassword, createToken, authCookie } from "../_auth.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: "email et password requis" }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (!user || !user.passwordHash) {
      return Response.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return Response.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }

    if (!user.approved) {
      return Response.json({ error: "Votre compte est en attente d'approbation" }, { status: 403 });
    }

    const token = await createToken(user.id);

    return new Response(
      JSON.stringify({ id: user.id, name: user.name, email: user.email }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": authCookie(token),
        },
      }
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
