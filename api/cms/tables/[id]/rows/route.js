import { db, rawQuery } from "../../../../../db/index.js";
import { cmsTables, cmsColumns } from "../../../../../db/schema.js";
import { eq } from "drizzle-orm";
import { toTableName, quoteIdent } from "../../../_utils.js";

// GET - Liste toutes les lignes d'une table
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);

    const [table] = await db.select().from(cmsTables).where(eq(cmsTables.id, id));
    if (!table) {
      return Response.json({ error: "Table non trouvée" }, { status: 404 });
    }

    // Nom de table lu depuis la DB, jamais depuis l'input user
    const pgTableName = toTableName(table.tableName);
    const rows = await rawQuery(`SELECT * FROM ${quoteIdent(pgTableName)} ORDER BY "id" DESC`);

    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST - Insère une nouvelle ligne
export async function POST(request, { params }) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    const [table] = await db.select().from(cmsTables).where(eq(cmsTables.id, id));
    if (!table) {
      return Response.json({ error: "Table non trouvée" }, { status: 404 });
    }

    // Récupérer les colonnes autorisées depuis le registry
    const columns = await db
      .select()
      .from(cmsColumns)
      .where(eq(cmsColumns.tableId, id));

    const allowedCols = columns.map((c) => c.columnName);
    const entries = Object.entries(body).filter(([key]) => allowedCols.includes(key));

    if (entries.length === 0) {
      return Response.json({ error: "Aucune colonne valide fournie" }, { status: 400 });
    }

    const pgTableName = toTableName(table.tableName);
    const colNames = entries.map(([key]) => quoteIdent(key)).join(", ");
    const placeholders = entries.map((_, i) => `$${i + 1}`).join(", ");
    const values = entries.map(([, val]) => val);

    const insertSQL = `INSERT INTO ${quoteIdent(pgTableName)} (${colNames}) VALUES (${placeholders}) RETURNING *`;
    const result = await rawQuery(insertSQL, values);

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
