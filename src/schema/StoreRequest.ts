import { relations, sql } from 'drizzle-orm';
import { Stores } from './Stores.js';
import { pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { Profiles } from './Profiles.js';

export const requestStatusEnum = pgEnum('request_status', ['pending', 'approved', 'rejected']);

export const StoreRequests = pgTable('store_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => Stores.id, { onDelete: 'cascade' }),
  requestMessage: varchar('request_message', { length: 500 }).notNull(),
  requestStatus: requestStatusEnum('request_status').default('pending').notNull(),
  rejectionReason: varchar('rejection_reason', { length: 500 }),
  approvedBy: uuid('approved_by').references(() => Profiles.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});

export const storeRequestRelation = relations(StoreRequests, ({ one }) => ({
  store: one(Stores, {
    fields: [StoreRequests.storeId],
    references: [Stores.id],
  }),
}));
