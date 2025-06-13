import { pgEnum, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { Products } from './Products.js';
import { Profiles } from './Profiles.js';

export const reportReasonEnum = pgEnum('report_reason', ['spam', 'scam', 'offensive', 'other']);

export const Reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    buyerId: uuid('buyer_Id')
      .notNull()
      .references(() => Profiles.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => Products.id, { onDelete: 'cascade' }),
    reason: reportReasonEnum('reason').notNull(),
    description: uuid('description').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [unique('uniqueBuyerProductOnReport').on(table.buyerId, table.productId)],
);

export const reportsRelation = relations(Reports, ({ one }) => ({
  buyer: one(Profiles, {
    fields: [Reports.buyerId],
    references: [Profiles.id],
  }),
  product: one(Products, {
    fields: [Reports.productId],
    references: [Products.id],
  }),
}));
