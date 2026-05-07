CREATE TABLE IF NOT EXISTS "cantinas" (
	"id" text PRIMARY KEY NOT NULL,
	"escola_id" text NOT NULL,
	"nome" text NOT NULL,
	"andar" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "escolas" (
	"id" text PRIMARY KEY NOT NULL,
	"unidade_id" text NOT NULL,
	"nome" text NOT NULL,
	"tipo" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unidades" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"endereco" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX IF EXISTS "orders_tenant_day_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "users_tenant_idx";--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN "cantina_id" text;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "cantina_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cantina_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cantina_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cantinas" ADD CONSTRAINT "cantinas_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "escolas" ADD CONSTRAINT "escolas_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "public"."unidades"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cantinas_escola_nome_unique" ON "cantinas" USING btree ("escola_id","nome");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cantinas_escola_idx" ON "cantinas" USING btree ("escola_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "escolas_unidade_nome_unique" ON "escolas" USING btree ("unidade_id","nome");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "escolas_unidade_idx" ON "escolas" USING btree ("unidade_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_cantina_id_cantinas_id_fk" FOREIGN KEY ("cantina_id") REFERENCES "public"."cantinas"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_cantina_id_cantinas_id_fk" FOREIGN KEY ("cantina_id") REFERENCES "public"."cantinas"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_cantina_day_idx" ON "orders" USING btree ("cantina_id","criado_em");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_cantina_idx" ON "users" USING btree ("cantina_id");--> statement-breakpoint
ALTER TABLE "favorites" DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_staff_must_have_cantina" CHECK (role != 'staff' OR cantina_id IS NOT NULL);