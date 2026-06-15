import { z } from 'zod';
import { shippingAddressSchema } from './shipping-address';

export const fulfillmentLineItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const evaluateFulfillmentRequestSchema = z.object({
  shippingAddress: shippingAddressSchema,
  items: z.array(fulfillmentLineItemSchema).min(1),
});

export const estimatedShipmentSchema = z.object({
  carrier: z.string(),
  serviceLevel: z.string(),
  estimatedDays: z.number().int().positive(),
});

export const evaluateFulfillmentAcceptedSchema = z.object({
  status: z.literal('ACCEPTED'),
  warehouseId: z.string().uuid(),
  warehouseName: z.string(),
  distanceKm: z.number(),
  estimatedShipment: estimatedShipmentSchema,
});

export const evaluateFulfillmentUnfulfillableSchema = z.object({
  status: z.literal('UNFULFILLABLE'),
  reason: z.literal('NO_WAREHOUSE_WITH_FULL_INVENTORY'),
});

export const evaluateFulfillmentResponseSchema = z.discriminatedUnion('status', [
  evaluateFulfillmentAcceptedSchema,
  evaluateFulfillmentUnfulfillableSchema,
]);

export type FulfillmentLineItem = z.infer<typeof fulfillmentLineItemSchema>;
export type EvaluateFulfillmentRequest = z.infer<typeof evaluateFulfillmentRequestSchema>;
export type EstimatedShipment = z.infer<typeof estimatedShipmentSchema>;
export type EvaluateFulfillmentAccepted = z.infer<typeof evaluateFulfillmentAcceptedSchema>;
export type EvaluateFulfillmentUnfulfillable = z.infer<typeof evaluateFulfillmentUnfulfillableSchema>;
export type EvaluateFulfillmentResponse = z.infer<typeof evaluateFulfillmentResponseSchema>;
