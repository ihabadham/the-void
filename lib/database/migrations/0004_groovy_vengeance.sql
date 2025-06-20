CREATE TYPE "public"."export_format" AS ENUM('json', 'csv');--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "export_format" SET DEFAULT 'json'::"public"."export_format";--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "export_format" SET DATA TYPE "public"."export_format" USING "export_format"::"public"."export_format";