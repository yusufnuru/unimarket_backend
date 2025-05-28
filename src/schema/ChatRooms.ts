import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { Stores } from './Stores.js';
import { Users } from './Users.js';
import { relations, sql } from 'drizzle-orm';
import { Profiles } from './Profiles.js';
import { ChatMessages } from './ChatMessages.js';

export const ChatRooms = pgTable(
  'chat_rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => Stores.id, { onDelete: 'restrict' }),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => Users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [unique('uniqueStoreBuyer').on(table.storeId, table.buyerId)],
);

export const chatRoomsRelation = relations(ChatRooms, ({ one, many }) => ({
  messages: many(ChatMessages),
  buyer: one(Users, {
    fields: [ChatRooms.buyerId],
    references: [Users.id],
  }),

  buyerProfile: one(Profiles, {
    fields: [ChatRooms.buyerId],
    references: [Profiles.userId],
  }),

  store: one(Stores, {
    fields: [ChatRooms.storeId],
    references: [Stores.id],
  }),
}));
