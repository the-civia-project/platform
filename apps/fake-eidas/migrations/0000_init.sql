CREATE SCHEMA "fake_eidas";
--> statement-breakpoint
CREATE TABLE "fake_eidas"."people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"citizen_of" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
