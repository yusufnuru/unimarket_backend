import { z } from 'zod';

export const emailSchema = z.string().email().min(3).max(255);
export const passwordSchema = z.string().min(6).max(255);
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userAgent: z.string().optional(),
});

export type LoginUserDto = z.infer<typeof loginSchema>;
export type Email = z.infer<typeof emailSchema>;
export type Password = z.infer<typeof passwordSchema>;