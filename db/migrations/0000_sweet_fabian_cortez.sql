CREATE TABLE "cms_columns" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_id" integer NOT NULL,
	"column_name" varchar(63) NOT NULL,
	"display_name" text NOT NULL,
	"column_type" varchar(20) NOT NULL,
	"is_required" boolean DEFAULT false,
	"default_value" text,
	"column_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cms_tables" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" varchar(63) NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cms_tables_table_name_unique" UNIQUE("table_name")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"size" text,
	"type" text,
	"user_id" serial NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cms_columns" ADD CONSTRAINT "cms_columns_table_id_cms_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."cms_tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;