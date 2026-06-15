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

const WAREHOUSE_EAST_NAME = 'Newark Distribution Center';
const WAREHOUSE_CENTRAL_NAME = 'Dallas Fulfillment Hub';
const WAREHOUSE_WEST_NAME = 'Los Angeles Warehouse';

const OUT_OF_STOCK_SKU = 'EOS-SKU-050';
const CENTRAL_ONLY_SKU = 'EOS-SKU-049';

const SEED_ORDER_EMAILS = ['pending@example.com', 'complete@example.com'] as const;

const warehouses = [
  {
    name: WAREHOUSE_EAST_NAME,
    address: '100 Industrial Pkwy, Newark, NJ 07114',
    latitude: 40.7357,
    longitude: -74.1724,
  },
  {
    name: WAREHOUSE_CENTRAL_NAME,
    address: '500 Logistics Blvd, Dallas, TX 75201',
    latitude: 32.7767,
    longitude: -96.797,
  },
  {
    name: WAREHOUSE_WEST_NAME,
    address: '900 Harbor Ave, Los Angeles, CA 90021',
    latitude: 34.0522,
    longitude: -118.2437,
  },
] as const;

function buildProducts() {
  return Array.from({ length: 50 }, (_, index) => {
    const number = index + 1;

    return {
      sku: `EOS-SKU-${String(number).padStart(3, '0')}`,
      name: `EOS Product ${number}`,
      unitPrice: (9.99 + number * 2.5).toFixed(2),
    };
  });
}

function buildInventory(
  productSku: string,
  warehouseIds: { east: string; central: string; west: string },
) {
  const { east, central, west } = warehouseIds;

  if (productSku === OUT_OF_STOCK_SKU) {
    return [
      { warehouseId: east, quantity: 0 },
      { warehouseId: central, quantity: 0 },
      { warehouseId: west, quantity: 0 },
    ];
  }

  if (productSku === CENTRAL_ONLY_SKU) {
    return [
      { warehouseId: east, quantity: 0 },
      { warehouseId: central, quantity: 75 },
      { warehouseId: west, quantity: 0 },
    ];
  }

  return [
    { warehouseId: east, quantity: 120 },
    { warehouseId: central, quantity: 60 },
    { warehouseId: west, quantity: 60 },
  ];
}

async function clearSeedData() {
  await prisma.order.deleteMany({
    where: {
      customerEmail: { in: [...SEED_ORDER_EMAILS] },
    },
  });
  await prisma.warehouseInventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
}

async function seedCatalog() {
  const products = buildProducts();
  const createdWarehouses = await Promise.all(
    warehouses.map((warehouse) => prisma.warehouse.create({ data: warehouse })),
  );

  const warehouseIds = {
    east: createdWarehouses.find(({ name }) => name === WAREHOUSE_EAST_NAME)!.id,
    central: createdWarehouses.find(({ name }) => name === WAREHOUSE_CENTRAL_NAME)!.id,
    west: createdWarehouses.find(({ name }) => name === WAREHOUSE_WEST_NAME)!.id,
  };

  const createdProducts = await Promise.all(
    products.map((product) => prisma.product.create({ data: product })),
  );

  await Promise.all(
    createdProducts.flatMap((product) =>
      buildInventory(product.sku, warehouseIds).map(({ warehouseId, quantity }) =>
        prisma.warehouseInventory.create({
          data: {
            warehouseId,
            productId: product.id,
            quantity,
          },
        }),
      ),
    ),
  );

  return { products: createdProducts, warehouseIds };
}

async function seedOrders({
  products,
  warehouseIds,
}: Awaited<ReturnType<typeof seedCatalog>>) {
  const [pendingProduct, completeProduct] = products;
  const pendingQuantity = 2;
  const completeQuantity = 1;
  const pendingTotal = (Number(pendingProduct.unitPrice) * pendingQuantity).toFixed(2);
  const completeTotal = (Number(completeProduct.unitPrice) * completeQuantity).toFixed(2);

  await prisma.order.create({
    data: {
      status: OrderStatus.PENDING,
      customerName: 'Seed Pending Customer',
      customerEmail: SEED_ORDER_EMAILS[0],
      shippingLine1: '350 Fifth Avenue',
      shippingCity: 'New York',
      shippingState: 'NY',
      shippingPostalCode: '10118',
      shippingCountry: 'US',
      totalAmount: pendingTotal,
      items: {
        create: [
          {
            productId: pendingProduct.id,
            quantity: pendingQuantity,
            unitPrice: pendingProduct.unitPrice,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      status: OrderStatus.PAYMENT_COMPLETE,
      customerName: 'Seed Complete Customer',
      customerEmail: SEED_ORDER_EMAILS[1],
      shippingLine1: '233 S Wacker Dr',
      shippingCity: 'Chicago',
      shippingState: 'IL',
      shippingPostalCode: '60606',
      shippingCountry: 'US',
      totalAmount: completeTotal,
      warehouseId: warehouseIds.central,
      warehouseName: WAREHOUSE_CENTRAL_NAME,
      distanceKm: '925.000',
      estimatedShipment: {
        carrier: 'EOS Freight',
        serviceLevel: 'standard',
        estimatedDays: 3,
      },
      items: {
        create: [
          {
            productId: completeProduct.id,
            quantity: completeQuantity,
            unitPrice: completeProduct.unitPrice,
          },
        ],
      },
      paymentAuthorization: {
        create: {
          amount: completeTotal,
          cardLastFour: '4242',
          description: 'Seed completed order payment',
          status: PaymentAuthorizationStatus.AUTHORIZED,
          authorizationCode: 'AUTH-SEED-001',
        },
      },
    },
  });
}

async function main() {
  await clearSeedData();
  const catalog = await seedCatalog();
  await seedOrders(catalog);

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
