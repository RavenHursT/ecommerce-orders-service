import { z } from 'zod';

export const authorizePaymentRequestSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  cardNumber: z.string().regex(/^\d{4,19}$/),
  description: z.string().optional(),
});

export const authorizePaymentAuthorizedResponseSchema = z.object({
  status: z.literal('AUTHORIZED'),
  authorizationId: z.string().uuid(),
  cardLastFour: z.string().length(4),
});

export const authorizePaymentDeclinedResponseSchema = z.object({
  status: z.literal('DECLINED'),
});

export const authorizePaymentResponseSchema = z.discriminatedUnion('status', [
  authorizePaymentAuthorizedResponseSchema,
  authorizePaymentDeclinedResponseSchema,
]);

export type AuthorizePaymentRequest = z.infer<typeof authorizePaymentRequestSchema>;
export type AuthorizePaymentAuthorizedResponse = z.infer<
  typeof authorizePaymentAuthorizedResponseSchema
>;
export type AuthorizePaymentDeclinedResponse = z.infer<
  typeof authorizePaymentDeclinedResponseSchema
>;
export type AuthorizePaymentResponse = z.infer<typeof authorizePaymentResponseSchema>;
