CREATE TABLE "exercise_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"exercise_id" integer NOT NULL,
	"logged_date" date NOT NULL,
	"value" real,
	"sets" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "progression_method" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "unit" text DEFAULT 'reps';--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "goal_value" real;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "base_value" real;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "current_value" real;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "volume_step" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "volume_weight" text;--> statement-breakpoint
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;