import {pgTable , uuid, timestamp, varchar } from 'drizzle-orm/pg-core';
import { Users } from './Users';
import { thirtyDaysFromNow } from '../utils/date';
import { relations } from 'drizzle-orm';
export const Sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => Users.id, {onDelete: 'cascade'}),
  userAgent: varchar('user_agent', {length: 255}),
  createdAt: timestamp('created_at', { mode: 'string'}).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { mode: 'string'}).notNull().$default(() => thirtyDaysFromNow().toISOString()),
});

export const sessionsRelation = relations(Sessions, ({one}) => ({
  user: one(Users, {
    fields: [Sessions.userId],
    references: [Users.id],
  }),
}));