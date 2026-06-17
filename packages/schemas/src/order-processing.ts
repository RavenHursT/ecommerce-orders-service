import { z } from 'zod';

export const ORDER_PROCESSING_TOPIC = 'order-processing';

export const orderProcessingPaymentSchema = z.object({
  cardNumber: z.string().regex(/^\d{4,19}$/),
  description: z.string().optional(),
});

export const orderProcessingMessageSchema = z.object({
  orderId: z.string().uuid(),
  payment: orderProcessingPaymentSchema,
});

export type OrderProcessingPayment = z.infer<typeof orderProcessingPaymentSchema>;
export type OrderProcessingMessage = z.infer<typeof orderProcessingMessageSchema>;
