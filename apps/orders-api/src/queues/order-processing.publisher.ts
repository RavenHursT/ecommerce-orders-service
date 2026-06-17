import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import {
  ORDER_PROCESSING_TOPIC,
  type OrderPayment,
  type OrderProcessingMessage,
} from '@repo/schemas';
import { orderProcessingQueueClient } from './order-processing';

@Injectable()
export class OrderProcessingPublisher {
  async publish(orderId: string, payment: OrderPayment): Promise<void> {
    const { cardNumber, description } = payment;
    const payload: OrderProcessingMessage = {
      orderId,
      payment: {
        cardNumber,
        description,
      },
    };

    try {
      const { messageId } = await orderProcessingQueueClient.send(
        ORDER_PROCESSING_TOPIC,
        payload,
        {
          idempotencyKey: orderId,
        },
      );

      Logger.log(
        `Enqueued order processing messageId=${messageId ?? 'pending'} orderId=${orderId}`,
        'OrderProcessingPublisher',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown queue error';
      throw new ServiceUnavailableException(`Failed to enqueue order processing: ${message}`);
    }
  }
}
