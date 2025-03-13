import {pgTable, uuid, timestamp, pgEnum} from 'drizzle-orm/pg-core';
import { Users } from './Users';
import { relations } from 'drizzle-orm';

export const verificationCodeTypeEnum = pgEnum('verification_code_type',[
  'email_verification',
  'password_reset',
]);

export const VerificationCodes = pgTable('verification_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').
    notNull().
    references(() => Users.id, {onDelete: 'cascade'}),
  type: verificationCodeTypeEnum('verification_code_type').notNull(),
  createdAt: timestamp('created_at', { mode: 'string'}).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { mode: 'string'}).notNull(),
});

export const verificationCodesRelation = relations(VerificationCodes, ({one}) => ({
  user: one(Users, {
    fields: [VerificationCodes.userId],
    references: [Users.id],
  }),
}));
