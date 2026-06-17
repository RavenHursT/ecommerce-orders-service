import { Logger } from '@nestjs/common';
import type { MessageMetadata } from '@vercel/queue';
import { QueueClient } from '@vercel/queue';
import { createPrismaClient } from '@repo/database';
import type { OrderProcessingMessage } from '@repo/schemas';
import { loadMonorepoEnv } from '../load-env';
import { OrderProcessingProcessor } from './order-processing.processor';

loadMonorepoEnv();

const { VERCEL_DEPLOYMENT_ID } = process.env;

export const orderProcessingQueueClient = new QueueClient({
  deploymentId: VERCEL_DEPLOYMENT_ID ? undefined : null,
});

export async function handleOrderProcessingMessage(
  message: OrderProcessingMessage,
  metadata: MessageMetadata,
): Promise<void> {
  const { orderId } = message;
  const { messageId, deliveryCount } = metadata;

  Logger.log(
    `Order processing message received messageId=${messageId} orderId=${orderId} deliveryCount=${deliveryCount}`,
    'OrderProcessingConsumer',
  );

  loadMonorepoEnv();

  const { DATABASE_URL } = process.env;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const prisma = createPrismaClient(DATABASE_URL);

  try {
    await new OrderProcessingProcessor(prisma).process(message);
  } finally {
    await prisma.$disconnect();
  }
}

export const orderProcessingNodeHandler = orderProcessingQueueClient.handleNodeCallback(
  handleOrderProcessingMessage,
);
