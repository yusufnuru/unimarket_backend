import { boolean, pgTable, varchar, uuid, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { Users } from './Users';
import { relations } from 'drizzle-orm';

export const roleEnum = pgEnum('roles', ['admin', 'buyer', 'seller']);

export const Profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => Users.id, {onDelete: 'cascade'}).unique(),
  fullName: varchar('full_name', {length: 100}).notNull(),
  phoneNumber: varchar('phone_number', {length: 20}).notNull().unique(),
  role: roleEnum('roles').default('buyer').notNull(),
  has_store: boolean('has_store').notNull().default(false),
  created_at: timestamp('created_at', { mode: 'string'}).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { mode: 'string'}).notNull().defaultNow(),
});


export const profilesRelation = relations(Profiles, ({one}) => ({
  user: one(Users, {
    fields: [Profiles.userId],
    references: [Users.id],
  }),
}));