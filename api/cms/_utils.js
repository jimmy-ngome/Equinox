// Mots réservés PostgreSQL qu'on ne peut pas utiliser comme identifiants
const RESERVED_WORDS = new Set([
  "select", "insert", "update", "delete", "drop", "create", "alter", "table",
  "index", "from", "where", "and", "or", "not", "null", "true", "false",
  "primary", "key", "foreign", "references", "constraint", "default", "check",
  "unique", "in", "exists", "between", "like", "is", "as", "on", "join",
  "left", "right", "inner", "outer", "cross", "natural", "using", "order",
  "by", "group", "having", "limit", "offset", "union", "intersect", "except",
  "all", "any", "some", "case", "when", "then", "else", "end", "cast",
  "user", "role", "grant", "revoke", "schema", "database", "trigger",
  "function", "procedure", "view", "sequence", "type", "domain",
]);

// Valide un identifiant SQL (nom de table ou colonne)
export function validateIdentifier(name) {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Le nom est requis" };
  }
  if (!/^[a-z][a-z0-9_]{0,58}$/.test(name)) {
    return {
      valid: false,
      error: "Le nom doit commencer par une lettre minuscule, contenir uniquement a-z, 0-9, _ (max 59 caractères)",
    };
  }
  if (RESERVED_WORDS.has(name)) {
    return { valid: false, error: `"${name}" est un mot réservé PostgreSQL` };
  }
  return { valid: true };
}

// Préfixe pour les tables dynamiques CMS (évite collisions avec tables système)
export function toTableName(input) {
  return `cms_data_${input}`;
}

// Mapping type CMS → type PostgreSQL
export function toPgType(cmsType) {
  const map = {
    text: "TEXT",
    integer: "INTEGER",
    boolean: "BOOLEAN",
    date: "TIMESTAMP",
    json: "JSONB",
    decimal: "NUMERIC",
  };
  return map[cmsType] || "TEXT";
}

// Échappe un identifiant PostgreSQL (double-quote)
export function quoteIdent(name) {
  return `"${name.replace(/"/g, '""')}"`;
}
