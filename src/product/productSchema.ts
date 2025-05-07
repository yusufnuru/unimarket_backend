import { z } from 'zod';
import validator from 'validator';

export const productQuerySchema = z.object({
  page: z
    .string()
    .transform((val) => validator.escape(val).trim())
    .refine((val) => !isNaN(Number(val)), { message: 'Page must be a number' })
    .transform((val) => Number(val))
    .default('1'),
  limit: z
    .string()
    .transform((val) => validator.escape(val).trim())
    .refine((val) => !isNaN(Number(val)), { message: 'Limit must be a number' })
    .transform((val) => Number(val))
    .default('10'),
  search: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .transform((val) => (val ? validator.escape(val).trim() : val)),

  categoryId: z.string().uuid('Invalid category id').optional(),
  storeId: z.string().uuid('Invalid store id').optional(),

  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? validator.escape(val).trim() : val))
    .refine((val) => val === undefined || !isNaN(Number(val)), {
      message: 'Min price must be a number',
    })
    .transform((val) => (val !== undefined ? Number(val) : undefined)),

  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? validator.escape(val).trim() : val))
    .refine((val) => val === undefined || !isNaN(Number(val)), {
      message: 'Max price must be a number',
    })
    .transform((val) => (val !== undefined ? Number(val) : undefined)),

  sortBy: z.enum(['createdAt', 'price', 'productName']).optional().default('createdAt'),

  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type productQuerySchema = z.infer<typeof productQuerySchema>;
