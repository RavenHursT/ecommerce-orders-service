import { z } from 'zod';

export const productResponseSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  unitPrice: z.number(),
});

export const productCatalogItemSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  unitPrice: z.number(),
  availableQuantity: z.number().int().nonnegative(),
});

export const productCatalogResponseSchema = z.object({
  data: z.array(productCatalogItemSchema),
});

export type ProductResponse = z.infer<typeof productResponseSchema>;
export type ProductCatalogItem = z.infer<typeof productCatalogItemSchema>;
export type ProductCatalogResponse = z.infer<typeof productCatalogResponseSchema>;
