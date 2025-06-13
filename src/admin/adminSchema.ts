import { z } from 'zod';
import validator from 'validator';
import { storeQuerySchema } from '../store/storeSchema.js';

export const adminParamSchema = z
  .string()
  .uuid('Invalid admin id')
  .nonempty('Admin id is required')
  .transform((val) => validator.escape(val).trim());

export const storeRequestParamSchema = z
  .string()
  .uuid('Invalid store request id')
  .nonempty('Store Request id is required')
  .transform((val) => validator.escape(val).trim());

export const rejectRequestSchema = z.object({
  rejectionReason: z
    .string()
    .min(30)
    .max(500, 'Rejection reason must be between 30 and 500 characters')
    .nonempty('Rejection reason is required')
    .transform((val) => validator.escape(val).trim()),
});

export const createWarningSchema = z.object({
  actionTaken: z
    .enum(['product_deleted', 'product_hidden'], {
      errorMap: () => ({ message: 'Invalid action taken' }),
    })
    .transform((val) => validator.escape(val).trim()),

  reason: z
    .string()
    .min(30, 'Reason must be at least 30 characters long')
    .max(255, 'Reason must be at most 255 characters long')
    .nonempty('Reason is required')
    .transform((val) => validator.escape(val).trim()),
});

export const adminStoreQuerySchema = storeQuerySchema.extend({
  status: z
    .enum(['incomplete', 'active', 'inactive', 'suspended'], {
      errorMap: () => ({ message: 'Invalid store request status' }),
    })
    .optional(),
});
export type StoreRequestParamSchema = z.infer<typeof storeRequestParamSchema>;
export type RejectRequestSchema = z.infer<typeof rejectRequestSchema>;
export type CreateWarningSchema = z.infer<typeof createWarningSchema>;
export type AdminStoreQuerySchema = z.infer<typeof adminStoreQuerySchema>;
export type AdminParamSchema = z.infer<typeof adminParamSchema>;
