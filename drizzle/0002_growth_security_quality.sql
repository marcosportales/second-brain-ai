ALTER TABLE "user" ADD COLUMN "onboarding_completed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "source_type" varchar(30) DEFAULT 'document' NOT NULL;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "tags" text[] DEFAULT '{}'::text[] NOT NULL;
--> statement-breakpoint
CREATE TABLE "user_onboarding" (
  "user_id" text PRIMARY KEY NOT NULL,
  "created_first_document_at" timestamp with time zone,
  "tagged_first_document_at" timestamp with time zone,
  "first_search_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "query" text NOT NULL,
  "tags" text[] DEFAULT '{}'::text[] NOT NULL,
  "source_type" varchar(30),
  "from_date" timestamp with time zone,
  "to_date" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text,
  "event_name" varchar(80) NOT NULL,
  "properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "ip" varchar(128) NOT NULL,
  "succeeded" boolean NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "user_onboarding" ADD CONSTRAINT "user_onboarding_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "user_onboarding_completed_idx" ON "user_onboarding" USING btree ("completed_at");
--> statement-breakpoint
CREATE INDEX "saved_searches_user_idx" ON "saved_searches" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "analytics_events_name_idx" ON "analytics_events" USING btree ("event_name");
--> statement-breakpoint
CREATE INDEX "analytics_events_user_idx" ON "analytics_events" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "auth_attempts_email_idx" ON "auth_attempts" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "auth_attempts_ip_idx" ON "auth_attempts" USING btree ("ip");
--> statement-breakpoint
CREATE INDEX "auth_attempts_created_idx" ON "auth_attempts" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_idx" ON "password_reset_tokens" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "password_reset_tokens_expires_idx" ON "password_reset_tokens" USING btree ("expires_at");
