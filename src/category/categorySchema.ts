import { z } from 'zod';
import validator from 'validator';

export const categoryParamSchema = z
  .string()
  .uuid('Invalid category id')
  .nonempty('Category id is required')
  .transform((val) => validator.escape(val).trim());

export type CategoryParamSchema = z.infer<typeof categoryParamSchema>;
