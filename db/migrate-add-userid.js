// Migration: Add userId columns + register Jimmy's account
// Run with: node db/migrate-add-userid.js
import { readFileSync } from "fs";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

// Load .env.local manually (no dotenv dependency)
try {
  const envFile = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const sql = neon(process.env.DATABASE_URL);

const JIMMY = {
  name: "Jimmy",
  email: "jimmyngone@gmail.com",
  password: "Wilson0974@",
};

async function migrate() {
  console.log("Starting userId migration...");

  // 1. Add passwordHash to users
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text`;
  console.log("  Added password_hash to users");

  // 2. Add userId (nullable) to all tables
  const tables = ["habits", "habit_completions", "exercises", "workout_sessions", "exercise_logs"];
  for (const table of tables) {
    try {
      await sql.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS user_id integer REFERENCES users(id) ON DELETE CASCADE`);
      console.log(`  Added user_id to ${table}`);
    } catch (e) {
      if (e.message?.includes("already exists")) {
        console.log(`  user_id already exists on ${table}`);
      } else {
        console.log(`  user_id on ${table}: ${e.message}`);
      }
    }
  }

  // 3. Hash password
  const passwordHash = await bcrypt.hash(JIMMY.password, 10);

  // 4. Find or create Jimmy's user with real credentials
  const existingUsers = await sql`SELECT id, email FROM users LIMIT 1`;
  let userId;

  if (existingUsers.length > 0) {
    userId = existingUsers[0].id;
    await sql`UPDATE users SET name = ${JIMMY.name}, email = ${JIMMY.email}, password_hash = ${passwordHash} WHERE id = ${userId}`;
    console.log(`  Updated existing user id=${userId} → ${JIMMY.email}`);
  } else {
    const result = await sql`INSERT INTO users (name, email, password_hash) VALUES (${JIMMY.name}, ${JIMMY.email}, ${passwordHash}) RETURNING id`;
    userId = result[0].id;
    console.log(`  Created user id=${userId} → ${JIMMY.email}`);
  }

  // 5. Link all existing data to this user
  for (const table of tables) {
    await sql.query(`UPDATE ${table} SET user_id = $1 WHERE user_id IS NULL`, [userId]);
    console.log(`  Linked ${table} rows → user_id=${userId}`);
  }

  // 6. Update unique index on habit_completions
  try {
    await sql`DROP INDEX IF EXISTS habit_completions_habit_date_idx`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS habit_completions_habit_date_user_idx ON habit_completions (habit_id, completed_date, user_id)`;
    console.log("  Updated unique index on habit_completions");
  } catch (e) {
    console.log(`  Index update skipped: ${e.message}`);
  }

  // 7. Add approved + is_admin columns
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false`;
  console.log("  Added approved to users");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false`;
  console.log("  Added is_admin to users");

  // 8. Mark Jimmy as admin + approved
  await sql`UPDATE users SET approved = true, is_admin = true WHERE id = ${userId}`;
  console.log(`  Marked user id=${userId} as admin + approved`);

  console.log("\nMigration complete!");
  console.log(`  → Compte: ${JIMMY.email}`);
  console.log(`  → Toutes les données existantes sont liées à ce compte.`);
}

migrate().catch(console.error);
