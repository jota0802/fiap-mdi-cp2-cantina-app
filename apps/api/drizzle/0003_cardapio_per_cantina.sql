CREATE TABLE IF NOT EXISTS "cantina_items" (
	"cantina_id" text NOT NULL,
	"item_id" text NOT NULL,
	"preco" numeric(10, 2) NOT NULL,
	"estoque" integer DEFAULT 0 NOT NULL,
	"disponivel" boolean DEFAULT true NOT NULL,
	"visivel" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cantina_items_cantina_id_item_id_pk" PRIMARY KEY("cantina_id","item_id"),
	CONSTRAINT "cantina_items_estoque_positivo" CHECK (estoque >= 0)
);
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "cantina_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "rm" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cantina_items" ADD CONSTRAINT "cantina_items_cantina_id_cantinas_id_fk" FOREIGN KEY ("cantina_id") REFERENCES "public"."cantinas"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cantina_items" ADD CONSTRAINT "cantina_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cantina_items_cantina_idx" ON "cantina_items" USING btree ("cantina_id");--> statement-breakpoint
ALTER TABLE "favorites" DROP COLUMN IF EXISTS "cantina_id";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN IF EXISTS "cantina_id";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_staff_must_have_name" CHECK (role != 'staff' OR name IS NOT NULL);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_rm_formato" CHECK (rm IS NULL OR rm ~ '^[0-9]{6}$');