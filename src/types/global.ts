import { db } from '../config/db.js';
import { z } from 'zod';
import validator from 'validator';

export const productParamSchema = z
  .string()
  .uuid('Invalid product id')
  .nonempty('Product id is required')
  .transform((val) => validator.escape(val).trim());

export const storeParamSchema = z
  .string()
  .uuid('Invalid store id')
  .nonempty('Store id is required')
  .transform((val) => validator.escape(val).trim());

export type TransactionType = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type productParamSchema = z.infer<typeof productParamSchema>;
export type storeParamSchema = z.infer<typeof storeParamSchema>;