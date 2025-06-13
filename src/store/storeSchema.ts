import { z } from 'zod';
import { validateBufferMIMEType } from 'validate-image-type';
import validator from 'validator';

const requestMessageSchema = z
  .string()
  .min(30)
  .max(500, 'Request message must be between 30 and 500 characters')
  .nonempty('Request message is required')
  .transform((val) => validator.escape(val).trim());

export const createStoreRequestSchema = z.object({
  requestMessage: requestMessageSchema,
});

export const createStoreSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .transform((val: string) => validator.escape(val).trim()),
  description: z
    .string()
    .min(1)
    .max(500)
    .optional()
    .transform((val) => (val ? validator.escape(val).trim() : val)),
  address: z
    .string()
    .min(1)
    .max(500)
    .transform((val) => (val ? validator.escape(val).trim() : val)),
  requestMessage: requestMessageSchema,
});

export const updateStoreSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .max(100)
      .optional()
      .transform((val) => (val ? validator.escape(val).trim() : val)),
    description: z
      .string()
      .min(1)
      .max(500)
      .optional()
      .transform((val) => (val ? validator.escape(val).trim() : val)),
    address: z
      .string()
      .min(1)
      .max(500)
      .optional()
      .transform((val) => (val ? validator.escape(val).trim() : val)),
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
    .transform((val) => validator.escape(val).trim()),
  category: z
    .string()
    .uuid('Invalid category id')
    .nonempty('Category id is required')
    .transform((val) => validator.escape(val).trim()),
  description: z
    .string()
    .min(1)
    .max(500)
    .optional()
    .transform((val) => (val ? validator.escape(val).trim() : val)),
  price: z
    .string()
    .min(0)
    .refine((val) => validator.isDecimal(val), {
      message: 'Price must be a valid number with up to 2 decimal places',
      path: ['price'],
    })
    .transform((val) => parseFloat(validator.escape(val).trim())),
  quantity: z
    .string()
    .refine((val) => validator.isInt(val, { min: 0 }), {
      message: 'Quantity must be a valid positive integer',
      path: ['quantity'],
    })
    .transform((val) => parseInt(validator.escape(val).trim(), 10)),
});

export const updateProductSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .transform((val) => (val ? validator.escape(val).trim() : val)),
  category: z
    .string()
    .uuid('Invalid category id')
    .optional()
    .transform((val) => (val ? validator.escape(val).trim() : val)),
  description: z
    .string()
    .min(1)
    .max(500)
    .optional()
    .transform((val) => (val ? validator.escape(val).trim() : val)),
  price: z
    .string()
    .min(0)
    .refine((val) => validator.isDecimal(val), {
      message: 'Price must be a valid number with up to 2 decimal places',
      path: ['price'],
    })
    .optional()
    .transform((val) => (val ? parseFloat(validator.escape(val).trim()) : val)),
  quantity: z
    .string()
    .refine((val) => validator.isInt(val, { min: 0 }), {
      message: 'Quantity must be a valid positive integer',
      path: ['quantity'],
    })
    .optional()
    .transform((val) => (val ? parseInt(validator.escape(val).trim(), 10) : val)),
  imagesToRemove: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return val;
    }, z.array(z.string()))
    .optional(),
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

export const updateImageSchema = z
  .any()
  .superRefine(async (files: Express.Multer.File[] | undefined, ctx) => {
    // If no files are provided, skip validation (making upload optional)
    if (!files || files.length === 0) {
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = Buffer.from(file.buffer);
      const filePath = ['images', i]; // Helps identify which file index had a problem

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
  sortBy: z
    .enum(['name', 'joined'], {
      errorMap: () => ({ message: 'Invalid sortBy value' }),
    })
    .optional()
    .transform((val) => (val ? validator.escape(val).trim() : val)),
});

export const storeParamSchema = z
  .string()
  .uuid('Invalid store id')
  .nonempty('Store id is required')
  .transform((val) => validator.escape(val).trim());

export const storeRequestQuerySchema = z.object({
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
    .default('5'),
  status: z
    .enum(['pending', 'approved', 'rejected'], {
      errorMap: () => ({ message: 'Invalid status value' }),
    })
    .optional(),
});

export type StoreParamSchema = z.infer<typeof storeParamSchema>;
export type CreateStoreRequestSchema = z.infer<typeof createStoreRequestSchema>;
export type CreateStoreSchema = z.infer<typeof createStoreSchema>;
export type UpdateStoreSchema = z.infer<typeof updateStoreSchema>;
export type CreateProductSchema = z.infer<typeof createProductSchema>;
export type StoreQuerySchema = z.infer<typeof storeQuerySchema>;
export type UpdateProductSchema = z.infer<typeof updateProductSchema>;
export type AddImageSchema = z.infer<typeof addImageSchema>;
export type UpdateImageSchema = z.infer<typeof updateImageSchema>;
export type StoreRequestQuerySchema = z.infer<typeof storeRequestQuerySchema>;
