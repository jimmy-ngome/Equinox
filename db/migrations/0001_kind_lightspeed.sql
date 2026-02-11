CREATE TABLE "exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"type" varchar(20) NOT NULL,
	"pr" text,
	"last_weight" text,
	"last_reps" text,
	"progression" text,
	"reps" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT '⭐',
	"time" text DEFAULT 'Matin',
	"streak" integer DEFAULT 0,
	"completed_today" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
