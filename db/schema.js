import { pgTable, serial, text, timestamp, varchar, integer, boolean, real, date, uniqueIndex } from "drizzle-orm/pg-core";

// Table exemple - utilisateurs
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Table exemple - fichiers uploadés
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  size: text("size"),
  type: text("type"),
  userId: serial("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// CMS - Registry des tables dynamiques
export const cmsTables = pgTable("cms_tables", {
  id: serial("id").primaryKey(),
  tableName: varchar("table_name", { length: 63 }).notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CMS - Colonnes des tables dynamiques
export const cmsColumns = pgTable("cms_columns", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").notNull().references(() => cmsTables.id, { onDelete: "cascade" }),
  columnName: varchar("column_name", { length: 63 }).notNull(),
  displayName: text("display_name").notNull(),
  columnType: varchar("column_type", { length: 20 }).notNull(),
  isRequired: boolean("is_required").default(false),
  defaultValue: text("default_value"),
  columnOrder: integer("column_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Habitudes quotidiennes
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").default("*"),
  color: text("color").default("#22d3ee"),
  time: text("time").default("Matin"),
  streak: integer("streak").default(0),
  completedToday: boolean("completed_today").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Completions d'habitudes (historique par jour)
export const habitCompletions = pgTable("habit_completions", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  completedDate: date("completed_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("habit_completions_habit_date_idx").on(table.habitId, table.completedDate),
]);

// Exercices (musculation & calisthenics)
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // "musculation" | "calisthenics"
  pr: text("pr"),
  lastWeight: text("last_weight"),
  lastReps: text("last_reps"),
  progression: text("progression"),
  reps: text("reps"),
  // Progression tracking
  progressionMethod: text("progression_method"), // "volume" | "pr" | null
  unit: text("unit").default("reps"), // "kg" | "s" | "reps"
  goalValue: real("goal_value"),
  baseValue: real("base_value"),
  currentValue: real("current_value"),
  volumeStep: integer("volume_step").default(0),
  volumeWeight: text("volume_weight"),
  unilateral: boolean("unilateral").default(false),
  goalCompletedDate: date("goal_completed_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Séances d'entraînement
export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  type: text("type").notNull(), // "musculation" | "calisthenics"
  exercises: text("exercises"), // JSON summary
  createdAt: timestamp("created_at").defaultNow(),
});

// Logs de performance par exercice
export const exerciseLogs = pgTable("exercise_logs", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  loggedDate: date("logged_date").notNull(),
  value: real("value"),
  sets: text("sets"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
