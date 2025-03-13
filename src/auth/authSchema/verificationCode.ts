import {z} from 'zod';

export const verificationCodeSchema = z.string().length(36);

export type VerificationCode = z.infer<typeof verificationCodeSchema>;