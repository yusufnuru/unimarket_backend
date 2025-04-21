import { z } from 'zod';
import { validateBufferMIMEType } from 'validate-image-type';
import validator from 'validator';

export const createStoreSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .transform((val: string) => validator.trim(val)),
  description: z
    .string()
    .min(1)
    .max(500)
    .optional()
    .transform((val) => (val ? validator.trim(val) : val)),
  address: z
    .string()
    .min(1)
    .max(500)
    .transform((val: string) => validator.trim(val)),
});

export const storeParamSchema = z
  .string()
  .uuid('Invalid store id')
  .nonempty('Store id is required');
export const productParamSchema = z
  .string()
  .uuid('Invalid product id')
  .nonempty('Product id is required');

export const updateStoreSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .max(100)
      .optional()
      .transform((val) => (val ? validator.trim(val) : val)),
    description: z
      .string()
      .min(1)
      .max(500)
      .optional()
      .transform((val) => (val ? validator.trim(val) : val)),
    address: z
      .string()
      .min(1)
      .max(500)
      .optional()
      .transform((val) => (val ? validator.trim(val) : val)),
  })
  .refine(
    (data) => Object.keys(data).length > 0, // Ensure at least one field is present
    {
      message: 'At least one field (name, description, or address) must be provided',
      path: [], // Empty path applies to the whole object
    },
  );

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .transform((val) => validator.trim(val)),
  description: z
    .string()
    .min(1)
    .max(500)
    .optional()
    .transform((val) => (val ? validator.trim(val) : val)),
  price: z
    .string()
    .min(1)
    .max(20)
    .transform((val) => validator.trim(val)),
  quantity: z
    .string()
    .min(1)
    .max(20)
    .transform((val) => validator.trim(val)),
});

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

export const addImageSchema = z.any().superRefine(async (files: Express.Multer.File[], ctx) => {
  if (!files || files.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one image file is required.',
      path: ['images'], // top-level key
    });
    return;
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buffer = Buffer.from(file.buffer);
    const filePath = ['images', i]; // helps identify which file index had a problem

    const mimeCheck = await validateBufferMIMEType(buffer, {
      allowMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
    });

    if (!mimeCheck.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `File "${file.originalname}" has an unsupported format or is corrupted.`,
        path: filePath,
      });
      continue;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `File "${file.originalname}" exceeds the maximum size of 5MB.`,
        path: filePath,
      });
    }
  }
});

export const storeQuerySchema = z.object({
  page: z
    .string()
    .transform((val) => validator.trim(val))
    .refine((val) => !isNaN(Number(val)), { message: 'Page must be a number' })
    .transform((val) => Number(val))
    .default('1'),
  limit: z
    .string()
    .transform((val) => validator.trim(val))
    .refine((val) => !isNaN(Number(val)), { message: 'Limit must be a number' })
    .transform((val) => Number(val))
    .default('10'),
  search: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .transform((val) => (val ? validator.trim(val) : val)),
  sortBy: z
    .enum(['name', 'joined'], {
      errorMap: () => ({ message: 'Invalid sortBy value' }),
    })
    .optional()
    .transform((val) => (val ? validator.trim(val) : val)),
});

export type createStoreSchema = z.infer<typeof createStoreSchema>;
export type updateStoreSchema = z.infer<typeof updateStoreSchema>;
export type storeParamSchema = z.infer<typeof storeParamSchema>;
export type productParamSchema = z.infer<typeof productParamSchema>;
export type createProductSchema = z.infer<typeof createProductSchema>;
export type storeQuerySchema = z.infer<typeof storeQuerySchema>;
