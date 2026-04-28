ALTER TABLE "messages" ADD COLUMN "status" varchar(20) DEFAULT 'ok' NOT NULL;
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "error_message" text;
