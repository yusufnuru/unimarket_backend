import { pgTable, varchar, uuid, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { Stores } from './Stores.js';
import { Categories } from './Categories.js';

export const Products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => Stores.id, { onDelete: 'cascade' }),
  productName: varchar('product_name', { length: 100 }).notNull(),
  visibility: boolean('visibility').notNull().default(true),
  description: varchar('description', { length: 500 }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => Categories.id, { onDelete: 'restrict' }),
  price: numeric('price', { precision: 10, scale: 2, mode: 'number' }).notNull(),
  quantity: numeric('quantity', { scale: 0, mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});

export const ProductImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => Products.id, { onDelete: 'cascade' }),
  imageUrl: varchar('image_url', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});

export const productsRelation = relations(Products, ({ one, many }) => ({
  images: many(ProductImages),

  category: one(Categories, {
    fields: [Products.categoryId],
    references: [Categories.id],
  }),

  store: one(Stores, {
    fields: [Products.storeId],
    references: [Stores.id],
  }),
}));

export const productImagesRelation = relations(ProductImages, ({ one }) => ({
  product: one(Products, {
    fields: [ProductImages.productId],
    references: [Products.id],
  }),
}));
