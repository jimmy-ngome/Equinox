import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema.js";

// Créer le client SQL Neon
const sql = neon(process.env.DATABASE_URL);

// Exporter l'instance Drizzle
export const db = drizzle(sql, { schema });

// Exporter aussi le client SQL brut pour les requêtes simples
export { sql };

// Exécuter une requête SQL brute (pour DDL et requêtes dynamiques)
// Le client neon() retourne une fonction tagged template, mais pour le DDL
// on a besoin d'interpoler des identifiants — on passe donc une string complète.
export async function rawQuery(query, params = []) {
  return sql(query, params);
}
