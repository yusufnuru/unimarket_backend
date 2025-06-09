import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { Products } from './Products.js';
import { relations, sql } from 'drizzle-orm';
import { Profiles } from './Profiles.js';

export const Wishlists = pgTable(
  'wishlists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => Profiles.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => Products.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [unique('uniqueBuyerProduct').on(table.buyerId, table.productId)],
);

export const WishlistsRelation = relations(Wishlists, ({ one }) => ({
  buyer: one(Profiles, {
    fields: [Wishlists.buyerId],
    references: [Profiles.id],
  }),

  product: one(Products, {
    fields: [Wishlists.productId],
    references: [Products.id],
  }),
}));
