import { z } from 'zod';
import validator from 'validator';
import { productParamSchema } from '../product/productSchema.js';

export const buyerParamSchema = z
  .string()
  .uuid('Invalid buyer id')
  .nonempty('Buyer id is required')
  .transform((val) => validator.escape(val).trim());

export const createReportSchema = z.object({
  productId: productParamSchema,
  reason: z
    .enum(['spam', 'scam', 'offensive', 'other'], {
      errorMap: () => ({ message: 'Invalid report reason' }),
    })
    .transform((val) => validator.escape(val).trim()),
  description: z
    .string()
    .min(50, 'Description is required')
    .max(500, 'Description must be less than 500 characters')
    .transform((val) => validator.escape(val).trim()),
});

export type BuyerParamSchema = z.infer<typeof buyerParamSchema>;
export type CreateReportSchema = z.infer<typeof createReportSchema>;
