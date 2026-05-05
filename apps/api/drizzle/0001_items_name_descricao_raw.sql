ALTER TABLE "items" ALTER COLUMN "name_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "descricao_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "descricao" text NOT NULL;