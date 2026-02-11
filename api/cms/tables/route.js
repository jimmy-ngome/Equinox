import { db, rawQuery } from "../../../db/index.js";
import { cmsTables, cmsColumns } from "../../../db/schema.js";
import { validateIdentifier, toTableName, toPgType, quoteIdent } from "../_utils.js";

// GET - Liste toutes les tables CMS
export async function GET() {
  try {
    const tables = await db.select().from(cmsTables);
    return Response.json(tables);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST - Crée une nouvelle table CMS
export async function POST(request) {
  try {
    const body = await request.json();
    const { tableName, displayName, description, columns } = body;

    if (!tableName || !displayName) {
      return Response.json(
        { error: "tableName et displayName sont requis" },
        { status: 400 }
      );
    }

    // Valider le nom de table
    const tableCheck = validateIdentifier(tableName);
    if (!tableCheck.valid) {
      return Response.json({ error: tableCheck.error }, { status: 400 });
    }

    // Valider les colonnes
    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return Response.json(
        { error: "Au moins une colonne est requise" },
        { status: 400 }
      );
    }

    for (const col of columns) {
      const colCheck = validateIdentifier(col.columnName);
      if (!colCheck.valid) {
        return Response.json(
          { error: `Colonne "${col.columnName}": ${colCheck.error}` },
          { status: 400 }
        );
      }
    }

    // Insérer dans le registry (Drizzle)
    const [newTable] = await db
      .insert(cmsTables)
      .values({ tableName, displayName, description })
      .returning();

    // Insérer les colonnes dans le registry
    const colValues = columns.map((col, i) => ({
      tableId: newTable.id,
      columnName: col.columnName,
      displayName: col.displayName || col.columnName,
      columnType: col.columnType || "text",
      isRequired: col.isRequired || false,
      defaultValue: col.defaultValue || null,
      columnOrder: i,
    }));

    await db.insert(cmsColumns).values(colValues);

    // Créer la table physique (raw SQL)
    const pgTableName = toTableName(tableName);
    const colDefs = columns
      .map((col) => {
        let def = `${quoteIdent(col.columnName)} ${toPgType(col.columnType || "text")}`;
        if (col.isRequired) def += " NOT NULL";
        if (col.defaultValue) def += ` DEFAULT '${col.defaultValue.replace(/'/g, "''")}'`;
        return def;
      })
      .join(", ");

    const createSQL = `CREATE TABLE IF NOT EXISTS ${quoteIdent(pgTableName)} (
      "id" SERIAL PRIMARY KEY,
      ${colDefs},
      "created_at" TIMESTAMP DEFAULT NOW(),
      "updated_at" TIMESTAMP DEFAULT NOW()
    )`;

    await rawQuery(createSQL);

    return Response.json(newTable, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
