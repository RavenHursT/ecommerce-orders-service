DROP TABLE IF EXISTS "eos"."payment_authorizations";
DROP TABLE IF EXISTS "eos"."order_items";
DROP TABLE IF EXISTS "eos"."warehouse_inventory";
DROP TABLE IF EXISTS "eos"."orders";
DROP TABLE IF EXISTS "eos"."products";
DROP TABLE IF EXISTS "eos"."warehouses";

CREATE TABLE "eos"."orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "eos"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "shipping_line1" TEXT NOT NULL,
    "shipping_line2" TEXT,
    "shipping_city" TEXT NOT NULL,
    "shipping_state" TEXT NOT NULL,
    "shipping_postal_code" TEXT NOT NULL,
    "shipping_country" TEXT NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "warehouse_id" UUID,
    "payment_authorization_id" UUID,
    "warehouse_name" TEXT,
    "distance_km" DECIMAL(10,3),
    "estimated_shipment" JSONB,
    "unfulfillable_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "eos"."order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "eos"."warehouses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "eos"."products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "eos"."warehouse_inventory" (
    "warehouse_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "warehouse_inventory_pkey" PRIMARY KEY ("warehouse_id","product_id")
);

CREATE TABLE "eos"."payment_authorizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "card_last_four" VARCHAR(4) NOT NULL,
    "description" TEXT,
    "status" "eos"."PaymentAuthorizationStatus" NOT NULL,
    "authorization_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_authorizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "products_sku_key" ON "eos"."products"("sku");

CREATE INDEX "payment_authorizations_order_id_idx" ON "eos"."payment_authorizations"("order_id");

ALTER TABLE "eos"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "eos"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "eos"."order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "eos"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "eos"."warehouse_inventory" ADD CONSTRAINT "warehouse_inventory_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "eos"."warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "eos"."warehouse_inventory" ADD CONSTRAINT "warehouse_inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "eos"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
