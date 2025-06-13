import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { Stores } from './Stores.js';
import { Products } from './Products.js';

export const actionEnum = pgEnum('action', ['product_deleted', 'product_hidden']);

export const Warnings = pgTable('warnings', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => Stores.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => Products.id, { onDelete: 'cascade' }),
  reason: varchar('reason', { length: 255 }).notNull(),
  actionTaken: actionEnum('action_taken').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});

export const warningsRelation = relations(Warnings, ({ one }) => ({
  store: one(Stores, {
    fields: [Warnings.storeId],
    references: [Stores.id],
  }),
  product: one(Products, {
    fields: [Warnings.productId],
    references: [Products.id],
  }),
}));
