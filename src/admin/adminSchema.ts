import { z } from 'zod';
import validator from 'validator';

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
export type storeRequestParamSchema = z.infer<typeof storeRequestParamSchema>;
export type rejectRequestSchema = z.infer<typeof rejectRequestSchema>;
