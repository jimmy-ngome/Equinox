import { db, rawQuery } from "../../../../../../db/index.js";
import { cmsTables, cmsColumns } from "../../../../../../db/schema.js";
import { eq } from "drizzle-orm";
import { toTableName, quoteIdent } from "../../../../_utils.js";

// PUT - Met à jour une ligne
export async function PUT(request, { params }) {
  try {
    const tableId = parseInt(params.id);
    const rowId = parseInt(params.rowId);
    const body = await request.json();

    const [table] = await db.select().from(cmsTables).where(eq(cmsTables.id, tableId));
    if (!table) {
      return Response.json({ error: "Table non trouvée" }, { status: 404 });
    }

    // Colonnes autorisées depuis le registry
    const columns = await db
      .select()
      .from(cmsColumns)
      .where(eq(cmsColumns.tableId, tableId));

    const allowedCols = columns.map((c) => c.columnName);
    const entries = Object.entries(body).filter(([key]) => allowedCols.includes(key));

    if (entries.length === 0) {
      return Response.json({ error: "Aucune colonne valide fournie" }, { status: 400 });
    }

    const pgTableName = toTableName(table.tableName);
    const setClauses = entries.map(([key], i) => `${quoteIdent(key)} = $${i + 1}`).join(", ");
    const values = entries.map(([, val]) => val);
    values.push(rowId);

    const updateSQL = `UPDATE ${quoteIdent(pgTableName)} SET ${setClauses}, "updated_at" = NOW() WHERE "id" = $${values.length} RETURNING *`;
    const result = await rawQuery(updateSQL, values);

    if (result.length === 0) {
      return Response.json({ error: "Ligne non trouvée" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Supprime une ligne
export async function DELETE(request, { params }) {
  try {
    const tableId = parseInt(params.id);
    const rowId = parseInt(params.rowId);

    const [table] = await db.select().from(cmsTables).where(eq(cmsTables.id, tableId));
    if (!table) {
      return Response.json({ error: "Table non trouvée" }, { status: 404 });
    }

    const pgTableName = toTableName(table.tableName);
    const result = await rawQuery(
      `DELETE FROM ${quoteIdent(pgTableName)} WHERE "id" = $1 RETURNING *`,
      [rowId]
    );

    if (result.length === 0) {
      return Response.json({ error: "Ligne non trouvée" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
