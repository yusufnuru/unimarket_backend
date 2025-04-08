import { z } from 'zod';

export const createStoreSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500).optional(),
  address: z.string().min(1).max(500),
});

export const storeParamSchema = z.string().uuid('Invalid store id');

export const updateStoreSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().min(1).max(500).optional(),
    address: z.string().min(1).max(500).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0, // Ensure at least one field is present
    {
      message: 'At least one field (name, description, or address) must be provided',
      path: [], // Empty path applies to the whole object
    },
  );

export type createStoreSchema = z.infer<typeof createStoreSchema>;
export type updateStoreSchema = z.infer<typeof updateStoreSchema>;
export type storeParamSchema = z.infer<typeof storeParamSchema>;
