import { Logger } from '@nestjs/common';
import type { MessageMetadata } from '@vercel/queue';
import { QueueClient } from '@vercel/queue';
import type { OrderProcessingMessage } from '@repo/schemas';

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
}

export const orderProcessingNodeHandler = orderProcessingQueueClient.handleNodeCallback(
  handleOrderProcessingMessage,
);
