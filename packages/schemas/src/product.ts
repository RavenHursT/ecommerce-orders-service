import { z } from 'zod';

export const productResponseSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  unitPrice: z.number(),
});

export type ProductResponse = z.infer<typeof productResponseSchema>;
