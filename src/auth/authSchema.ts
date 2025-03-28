import { z } from 'zod';

export const emailSchema = z.string().email().min(3).max(255);
export const passwordSchema = z.string().min(6).max(255);
export const verificationCodeSchema = z.string().min(36);
const phoneRegex = new RegExp(/^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userAgent: z.string().optional(),
});

export const registerSchema = loginSchema
  .extend({
    firstName: z.string().min(1).max(255),
    lastName: z.string().min(1).max(255),
    phoneNumber: z.string().regex(phoneRegex),
    confirmPassword: z.string().min(6).max(255),
    userAgent: z.string().optional(),
    role: z.enum(['buyer', 'seller']).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  verificationCode: verificationCodeSchema,
  userAgent: z.string().optional(),
});
export const resetPasswordSchema = z.object({
  password: z.string().min(6).max(255),
  verificationCode: verificationCodeSchema,
});

export type LoginUserDto = z.infer<typeof loginSchema>;
export type Email = z.infer<typeof emailSchema>;
export type Password = z.infer<typeof passwordSchema>;
export type RegisterUserDto = z.infer<typeof registerSchema>;
export type EmailVerification = z.infer<typeof verifyEmailSchema>;
