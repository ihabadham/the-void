CREATE TABLE "gmail_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gmail_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_gmail_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"gmail_account_id" uuid NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text NOT NULL,
	"expires_at" timestamp,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"last_accessed" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_gmail_tokens_user_id_gmail_account_id_unique" UNIQUE("user_id","gmail_account_id")
);
--> statement-breakpoint
DROP TABLE "gmail_tokens" CASCADE;--> statement-breakpoint
ALTER TABLE "user_gmail_tokens" ADD CONSTRAINT "user_gmail_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gmail_tokens" ADD CONSTRAINT "user_gmail_tokens_gmail_account_id_gmail_accounts_id_fk" FOREIGN KEY ("gmail_account_id") REFERENCES "public"."gmail_accounts"("id") ON DELETE cascade ON UPDATE no action;