import { z } from 'zod';
import { loginSchema } from './loginUser';

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/);

export const registerSchema = loginSchema.extend({
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  phoneNumber: z.string().regex(phoneRegex),
  confirmPassword: z.string().min(6).max(255),
  userAgent: z.string().optional(),
  role: z.enum(['buyer', 'seller', 'admin']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterUserDto = z.infer<typeof registerSchema>;