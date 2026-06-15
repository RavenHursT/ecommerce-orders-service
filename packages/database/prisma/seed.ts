import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  OrderStatus,
  PaymentAuthorizationStatus,
  PrismaClient,
} from '../generated/prisma/client.js';

const seedDirectory = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(seedDirectory, '../../..');

config({ path: resolve(monorepoRoot, '.env.example') });
config({ path: resolve(monorepoRoot, '.env.local'), override: true });

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DIRECT_URL or DATABASE_URL is required to run the seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const WAREHOUSE_EAST_ID = 'wh-east';
const WAREHOUSE_CENTRAL_ID = 'wh-central';
const WAREHOUSE_WEST_ID = 'wh-west';

const ORDER_PENDING_ID = 'order-seed-pending';
const ORDER_COMPLETE_ID = 'order-seed-complete';
const PAYMENT_COMPLETE_ID = 'pay-auth-seed-complete';

const OUT_OF_STOCK_PRODUCT_ID = 'prod-050';
const CENTRAL_ONLY_PRODUCT_ID = 'prod-049';

const warehouses = [
  {
    id: WAREHOUSE_EAST_ID,
    name: 'Newark Distribution Center',
    address: '100 Industrial Pkwy, Newark, NJ 07114',
    latitude: 40.7357,
    longitude: -74.1724,
  },
  {
    id: WAREHOUSE_CENTRAL_ID,
    name: 'Dallas Fulfillment Hub',
    address: '500 Logistics Blvd, Dallas, TX 75201',
    latitude: 32.7767,
    longitude: -96.797,
  },
  {
    id: WAREHOUSE_WEST_ID,
    name: 'Los Angeles Warehouse',
    address: '900 Harbor Ave, Los Angeles, CA 90021',
    latitude: 34.0522,
    longitude: -118.2437,
  },
] as const;

function toProductId(index: number) {
  return `prod-${String(index).padStart(3, '0')}`;
}

function buildProducts() {
  return Array.from({ length: 50 }, (_, index) => {
    const number = index + 1;
    const id = toProductId(number);

    return {
      id,
      sku: `EOS-SKU-${String(number).padStart(3, '0')}`,
      name: `EOS Product ${number}`,
      unitPrice: (9.99 + number * 2.5).toFixed(2),
    };
  });
}

function buildInventory(productIds: string[]) {
  return productIds.flatMap((productId) => {
    if (productId === OUT_OF_STOCK_PRODUCT_ID) {
      return [
        { warehouseId: WAREHOUSE_EAST_ID, productId, quantity: 0 },
        { warehouseId: WAREHOUSE_CENTRAL_ID, productId, quantity: 0 },
        { warehouseId: WAREHOUSE_WEST_ID, productId, quantity: 0 },
      ];
    }

    if (productId === CENTRAL_ONLY_PRODUCT_ID) {
      return [
        { warehouseId: WAREHOUSE_EAST_ID, productId, quantity: 0 },
        { warehouseId: WAREHOUSE_CENTRAL_ID, productId, quantity: 75 },
        { warehouseId: WAREHOUSE_WEST_ID, productId, quantity: 0 },
      ];
    }

    return [
      { warehouseId: WAREHOUSE_EAST_ID, productId, quantity: 120 },
      { warehouseId: WAREHOUSE_CENTRAL_ID, productId, quantity: 60 },
      { warehouseId: WAREHOUSE_WEST_ID, productId, quantity: 60 },
    ];
  });
}

async function clearSeedData() {
  await prisma.paymentAuthorization.deleteMany({
    where: {
      id: { in: [PAYMENT_COMPLETE_ID] },
    },
  });
  await prisma.orderItem.deleteMany({
    where: {
      orderId: { in: [ORDER_PENDING_ID, ORDER_COMPLETE_ID] },
    },
  });
  await prisma.order.deleteMany({
    where: {
      id: { in: [ORDER_PENDING_ID, ORDER_COMPLETE_ID] },
    },
  });
  await prisma.warehouseInventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
}

async function seedCatalog() {
  const products = buildProducts();

  for (const warehouse of warehouses) {
    await prisma.warehouse.create({ data: warehouse });
  }

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  const inventoryRows = buildInventory(products.map(({ id }) => id));

  for (const row of inventoryRows) {
    await prisma.warehouseInventory.create({ data: row });
  }

  return products;
}

async function seedOrders(products: ReturnType<typeof buildProducts>) {
  const { unitPrice: pendingUnitPrice } = products[0];
  const { unitPrice: completeUnitPrice } = products[1];
  const pendingQuantity = 2;
  const completeQuantity = 1;
  const pendingTotal = (Number(pendingUnitPrice) * pendingQuantity).toFixed(2);
  const completeTotal = (Number(completeUnitPrice) * completeQuantity).toFixed(2);

  await prisma.order.create({
    data: {
      id: ORDER_PENDING_ID,
      status: OrderStatus.PENDING,
      customerName: 'Seed Pending Customer',
      customerEmail: 'pending@example.com',
      shippingLine1: '350 Fifth Avenue',
      shippingCity: 'New York',
      shippingState: 'NY',
      shippingPostalCode: '10118',
      shippingCountry: 'US',
      totalAmount: pendingTotal,
      items: {
        create: [
          {
            id: 'order-item-pending-1',
            productId: products[0].id,
            quantity: pendingQuantity,
            unitPrice: pendingUnitPrice,
          },
        ],
      },
    },
  });

  await prisma.paymentAuthorization.create({
    data: {
      id: PAYMENT_COMPLETE_ID,
      orderId: ORDER_COMPLETE_ID,
      amount: completeTotal,
      cardLastFour: '4242',
      description: 'Seed completed order payment',
      status: PaymentAuthorizationStatus.AUTHORIZED,
      authorizationCode: 'AUTH-SEED-001',
    },
  });

  await prisma.order.create({
    data: {
      id: ORDER_COMPLETE_ID,
      status: OrderStatus.PAYMENT_COMPLETE,
      customerName: 'Seed Complete Customer',
      customerEmail: 'complete@example.com',
      shippingLine1: '233 S Wacker Dr',
      shippingCity: 'Chicago',
      shippingState: 'IL',
      shippingPostalCode: '60606',
      shippingCountry: 'US',
      totalAmount: completeTotal,
      warehouseId: WAREHOUSE_CENTRAL_ID,
      warehouseName: 'Dallas Fulfillment Hub',
      paymentAuthorizationId: PAYMENT_COMPLETE_ID,
      distanceKm: '925.000',
      estimatedShipment: {
        carrier: 'EOS Freight',
        serviceLevel: 'standard',
        estimatedDays: 3,
      },
      items: {
        create: [
          {
            id: 'order-item-complete-1',
            productId: products[1].id,
            quantity: completeQuantity,
            unitPrice: completeUnitPrice,
          },
        ],
      },
    },
  });
}

async function main() {
  await clearSeedData();
  const products = await seedCatalog();
  await seedOrders(products);

  const { warehouseCount, productCount, orderCount } = {
    warehouseCount: await prisma.warehouse.count(),
    productCount: await prisma.product.count(),
    orderCount: await prisma.order.count(),
  };

  console.log(
    `Seed complete: ${warehouseCount} warehouses, ${productCount} products, ${orderCount} orders`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
