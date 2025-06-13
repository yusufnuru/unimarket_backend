import { boolean, pgTable, varchar, uuid, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { Users } from './Users.js';
import { relations, sql } from 'drizzle-orm';
import { Stores } from './Stores.js';
import { Wishlists } from './Wishlists.js';
import { Reports } from './Reports.js';

export const roleEnum = pgEnum('roles', ['admin', 'buyer', 'seller']);

export const Profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => Users.id, { onDelete: 'cascade' })
    .unique(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  role: roleEnum('role').default('buyer').notNull(),
  hasStore: boolean('has_store').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});

export const profilesRelation = relations(Profiles, ({ one, many }) => ({
  user: one(Users, {
    fields: [Profiles.userId],
    references: [Users.id],
  }),

  store: one(Stores, {
    fields: [Profiles.id],
    references: [Stores.ownerId],
  }),
  reports: many(Reports),
  wishLists: many(Wishlists),
}));
