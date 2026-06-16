import { z } from 'zod';
import { shippingAddressSchema } from './shipping-address';

export const orderStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'FULFILLABLE',
  'PAYMENT_COMPLETE',
  'UNFULFILLABLE',
  'PAYMENT_FAILED',
  'CANCELLED',
]);

export const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const orderLineItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const orderPaymentSchema = z.object({
  cardNumber: z.string().regex(/^\d{4,19}$/),
  description: z.string().optional(),
});

export const createOrderRequestSchema = z.object({
  customer: customerSchema,
  shippingAddress: shippingAddressSchema,
  items: z.array(orderLineItemSchema).min(1),
  payment: orderPaymentSchema,
});

export const orderItemResponseSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
});

export const orderResponseSchema = z.object({
  id: z.string().uuid(),
  status: orderStatusSchema,
  customer: customerSchema,
  shippingAddress: shippingAddressSchema,
  totalAmount: z.number(),
  items: z.array(orderItemResponseSchema),
  warehouseId: z.string().uuid().optional(),
  warehouseName: z.string().optional(),
  distanceKm: z.number().optional(),
  estimatedShipment: z.record(z.unknown()).optional(),
  unfulfillableReason: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const paginatedOrdersResponseSchema = z.object({
  data: z.array(orderResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const updateOrderRequestSchema = z
  .object({
    customer: customerSchema.partial().optional(),
    shippingAddress: shippingAddressSchema.partial().optional(),
  })
  .refine(
    (data) => data.customer !== undefined || data.shippingAddress !== undefined,
    { message: 'At least one of customer or shippingAddress must be provided' },
  );

export const cancelOrderResponseSchema = z.object({
  status: z.literal('CANCELLED'),
});

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type OrderLineItem = z.infer<typeof orderLineItemSchema>;
export type OrderPayment = z.infer<typeof orderPaymentSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type OrderItemResponse = z.infer<typeof orderItemResponseSchema>;
export type OrderResponse = z.infer<typeof orderResponseSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type PaginatedOrdersResponse = z.infer<typeof paginatedOrdersResponseSchema>;
export type UpdateOrderRequest = z.infer<typeof updateOrderRequestSchema>;
export type CancelOrderResponse = z.infer<typeof cancelOrderResponseSchema>;
