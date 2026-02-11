import { db, rawQuery } from "../../../../db/index.js";
import { cmsTables, cmsColumns } from "../../../../db/schema.js";
import { eq } from "drizzle-orm";
import { toTableName, quoteIdent } from "../../_utils.js";

// GET - Metadata d'une table + ses colonnes
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);

    const [table] = await db.select().from(cmsTables).where(eq(cmsTables.id, id));
    if (!table) {
      return Response.json({ error: "Table non trouvée" }, { status: 404 });
    }

    const columns = await db
      .select()
      .from(cmsColumns)
      .where(eq(cmsColumns.tableId, id))
      .orderBy(cmsColumns.columnOrder);

    return Response.json({ ...table, columns });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Supprime une table CMS
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);

    const [table] = await db.select().from(cmsTables).where(eq(cmsTables.id, id));
    if (!table) {
      return Response.json({ error: "Table non trouvée" }, { status: 404 });
    }

    // Drop la table physique
    const pgTableName = toTableName(table.tableName);
    await rawQuery(`DROP TABLE IF EXISTS ${quoteIdent(pgTableName)}`);

    // Supprimer du registry (cascade supprime les colonnes)
    await db.delete(cmsTables).where(eq(cmsTables.id, id));

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
