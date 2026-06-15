ALTER TABLE "eos"."orders" DROP COLUMN "payment_authorization_id";

DROP INDEX IF EXISTS "eos"."payment_authorizations_order_id_idx";

CREATE UNIQUE INDEX "payment_authorizations_order_id_key" ON "eos"."payment_authorizations"("order_id");

ALTER TABLE "eos"."payment_authorizations" ADD CONSTRAINT "payment_authorizations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "eos"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "eos"."orders" ADD CONSTRAINT "orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "eos"."warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
