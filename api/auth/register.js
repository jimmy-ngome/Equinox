import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword } from "../_auth.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return Response.json({ error: "name, email et password requis" }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: "Le mot de passe doit faire au moins 6 caractères" }, { status: 400 });
    }

    // Check if email already exists
    const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existing) {
      return Response.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }

    const passwordHashValue = await hashPassword(password);

    await db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        passwordHash: passwordHashValue,
      });

    return Response.json(
      { pending: true, message: "Inscription enregistrée. Un administrateur doit approuver votre compte." },
      { status: 201 }
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
