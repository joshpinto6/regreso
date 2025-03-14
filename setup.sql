CREATE TABLE "regreso_destination_feed" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" varchar(256),
	"emoji" varchar(256),
	"user_id" integer NOT NULL,
	"workspace_id" integer,
	"visibility" varchar(256) NOT NULL,
	"json_query" jsonb NOT NULL,
	CONSTRAINT "regreso_destination_feed_workspace_id_name_unique" UNIQUE("workspace_id","name")
);

CREATE TABLE "regreso_destination_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"destination_id" integer,
	"list_id" integer,
	CONSTRAINT "regreso_destination_list_destination_id_list_id_unique" UNIQUE("destination_id","list_id")
);

CREATE TABLE "regreso_destination_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"destination_id" integer,
	"tag_id" integer,
	CONSTRAINT "regreso_destination_tag_destination_id_tag_id_unique" UNIQUE("destination_id","tag_id")
);

CREATE TABLE "regreso_destination" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256),
	"location" varchar(256),
	"type" varchar(256) NOT NULL,
	"body" text,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"workspace_id" integer,
	CONSTRAINT "regreso_destination_location_unique" UNIQUE("location")
);

CREATE TABLE "regreso_email_verification_request" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"code" text NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);

CREATE TABLE "regreso_list_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"list_id" integer,
	"tag_id" integer,
	CONSTRAINT "regreso_list_tag_list_id_tag_id_unique" UNIQUE("list_id","tag_id")
);

CREATE TABLE "regreso_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"emoji" varchar(256),
	"description" varchar(256),
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"workspace_id" integer,
	CONSTRAINT "regreso_list_user_id_name_unique" UNIQUE("user_id","name")
);

CREATE TABLE "regreso_passkey_credential" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"algorithm" integer NOT NULL,
	"public_key" text NOT NULL
);

CREATE TABLE "regreso_password_reset_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"code" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"two_factor_verified" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);

CREATE TABLE "regreso_security_key_credential" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"algorithm" integer NOT NULL,
	"public_key" text NOT NULL
);

CREATE TABLE "regreso_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"two_factor_verified" boolean DEFAULT false NOT NULL
);

CREATE TABLE "regreso_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"shortcut" varchar(256),
	"name" varchar(256) NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "regreso_tag_user_id_name_unique" UNIQUE("user_id","name"),
	CONSTRAINT "regreso_tag_user_id_shortcut_unique" UNIQUE("user_id","shortcut")
);

CREATE TABLE "regreso_totp_credential" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"key" text NOT NULL,
	CONSTRAINT "regreso_totp_credential_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "regreso_user" (
	"id" serial PRIMARY KEY NOT NULL,
	"google_id" text,
	"github_id" integer,
	"email" text NOT NULL,
	"display_name" text DEFAULT 'Anonymous' NOT NULL,
	"name" varchar(32) NOT NULL,
	"password_hash" varchar(256),
	"email_verified" boolean DEFAULT false NOT NULL,
	"recovery_code" varchar NOT NULL,
	"avatar_url" text,
	"bio" text DEFAULT 'Pelicans are epic',
	CONSTRAINT "regreso_user_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "regreso_user_github_id_unique" UNIQUE("github_id"),
	CONSTRAINT "regreso_user_email_unique" UNIQUE("email"),
	CONSTRAINT "regreso_user_name_unique" UNIQUE("name")
);

CREATE TABLE "regreso_workspace" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" varchar(256),
	"emoji" varchar(256),
	"user_id" integer NOT NULL,
	CONSTRAINT "regreso_workspace_user_id_name_unique" UNIQUE("user_id","name")
);

ALTER TABLE "regreso_destination_feed" ADD CONSTRAINT "regreso_destination_feed_user_id_regreso_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."regreso_user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regreso_destination_feed" ADD CONSTRAINT "regreso_destination_feed_workspace_id_regreso_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."regreso_workspace"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regreso_destination_list" ADD CONSTRAINT "regreso_destination_list_destination_id_regreso_destination_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."regreso_destination"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "regreso_destination_list" ADD CONSTRAINT "regreso_destination_list_list_id_regreso_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."regreso_list"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "regreso_destination_tag" ADD CONSTRAINT "regreso_destination_tag_destination_id_regreso_destination_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."regreso_destination"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "regreso_destination_tag" ADD CONSTRAINT "regreso_destination_tag_tag_id_regreso_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."regreso_tag"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "regreso_destination" ADD CONSTRAINT "regreso_destination_user_id_regreso_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."regreso_user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regreso_destination" ADD CONSTRAINT "regreso_destination_workspace_id_regreso_user_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."regreso_user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regreso_email_verification_request" ADD CONSTRAINT "regreso_email_verification_request_user_id_regreso_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."regreso_user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regreso_list_tag" ADD CONSTRAINT "regreso_list_tag_list_id_regreso_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."regreso_list"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "regreso_list_tag" ADD CONSTRAINT "regreso_list_tag_tag_id_regreso_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."regreso_tag"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "regreso_list" ADD CONSTRAINT "regreso_list_user_id_regreso_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."regreso_user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regreso_list" ADD CONSTRAINT "regreso_list_workspace_id_regreso_user_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."regreso_user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regreso_passkey_credential" ADD CONSTRAINT "regreso_passkey_credential_user_id_regreso_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."regreso_user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regreso_password_reset_session" ADD CONSTRAINT "regreso_password_reset_session_user_id_regreso_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."regreso_user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regreso_security_key_credential" ADD CONSTRAINT "regreso_security_key_credential_user_id_regreso_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."regreso_user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regreso_session" ADD CONSTRAINT "regreso_session_user_id_regreso_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."regreso_user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regreso_tag" ADD CONSTRAINT "regreso_tag_user_id_regreso_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."regreso_user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regreso_totp_credential" ADD CONSTRAINT "regreso_totp_credential_user_id_regreso_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."regreso_user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regreso_workspace" ADD CONSTRAINT "regreso_workspace_user_id_regreso_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."regreso_user"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "destination_search_index" ON "regreso_destination" USING gin (setweight(to_tsvector('english', "name"), 'A') ||
          setweight(to_tsvector('english', "body"), 'B'));
CREATE INDEX "list_search_index" ON "regreso_list" USING gin (setweight(to_tsvector('english', "name"), 'A') ||
            setweight(to_tsvector('english', "description"), 'B'));
CREATE INDEX "tag_search_index" ON "regreso_tag" USING gin (setweight(to_tsvector('english', "shortcut"), 'A') ||
          setweight(to_tsvector('english', "name"), 'B'));
CREATE INDEX "email_index" ON "regreso_user" USING btree ("email");
CREATE INDEX "google_id_index" ON "regreso_user" USING btree ("google_id");
CREATE INDEX "github_id_index" ON "regreso_user" USING btree ("github_id");
