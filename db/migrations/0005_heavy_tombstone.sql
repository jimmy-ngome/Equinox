CREATE TABLE "workout_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"type" text NOT NULL,
	"exercises" text,
	"created_at" timestamp DEFAULT now()
);
