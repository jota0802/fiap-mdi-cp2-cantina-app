CREATE TABLE IF NOT EXISTS "favorites" (
	"user_id" text NOT NULL,
	"item_id" text NOT NULL,
	"tenant_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_item_id_pk" PRIMARY KEY("user_id","item_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "items" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_key" text NOT NULL,
	"descricao_key" text NOT NULL,
	"preco" numeric(10, 2) NOT NULL,
	"categoria" text NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"imagem" text,
	"disponivel" boolean DEFAULT true NOT NULL,
	"tenant_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"item_id" text NOT NULL,
	"name_snapshot" text NOT NULL,
	"preco_snapshot" numeric(10, 2) NOT NULL,
	"quantidade" integer NOT NULL,
	"observacoes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"senha" integer NOT NULL,
	"pronto_em_estimado" timestamp with time zone,
	"pronto_em" timestamp with time zone,
	"retirado_em" timestamp with time zone,
	"cancelado_em" timestamp with time zone,
	"tenant_id" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"avatar_url" text,
	"locale" text DEFAULT 'pt' NOT NULL,
	"role" text DEFAULT 'customer' NOT NULL,
	"tenant_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "items_slug_unique" ON "items" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_categoria_idx" ON "items" USING btree ("categoria");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_tenant_day_idx" ON "orders" USING btree ("tenant_id","criado_em");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_tenant_idx" ON "users" USING btree ("tenant_id");