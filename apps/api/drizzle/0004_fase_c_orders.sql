-- Rename pendente/preparando → pedido (idempotente); orders com status retirado viram cancelado
UPDATE "orders" SET "status" = 'pedido' WHERE "status" IN ('pendente','preparando');--> statement-breakpoint
UPDATE "orders" SET "status" = 'cancelado', "cancelado_em" = COALESCE("cancelado_em", now()) WHERE "status" = 'retirado';--> statement-breakpoint

ALTER TABLE "orders" ADD COLUMN "canceled_by" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancel_reason" text;--> statement-breakpoint

-- Backfill canceled_by pros cancelamentos legacy (assume 'customer' como default razoável)
UPDATE "orders" SET "canceled_by" = 'customer' WHERE "status" = 'cancelado' AND "canceled_by" IS NULL;--> statement-breakpoint

ALTER TABLE "orders" ADD CONSTRAINT "orders_canceled_by_check"
  CHECK (canceled_by IS NULL OR canceled_by IN ('customer','staff'));--> statement-breakpoint

ALTER TABLE "orders" ADD CONSTRAINT "orders_cancel_consistency"
  CHECK ((status = 'cancelado' AND cancelado_em IS NOT NULL AND canceled_by IS NOT NULL)
       OR (status != 'cancelado' AND canceled_by IS NULL));--> statement-breakpoint

ALTER TABLE "orders" ADD CONSTRAINT "orders_status_validos"
  CHECK (status IN ('pedido','pronto','cancelado'));
