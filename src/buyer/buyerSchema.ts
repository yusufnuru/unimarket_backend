import { z } from 'zod';
import validator from 'validator';

export const buyerParamSchema = z
  .string()
  .uuid('Invalid buyer id')
  .nonempty('Buyer id is required')
  .transform((val) => validator.escape(val).trim());

export type BuyerParamSchema = z.infer<typeof buyerParamSchema>;
