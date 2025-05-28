import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { Users } from './Users.js';
import { sql, relations } from 'drizzle-orm';
import { Profiles } from './Profiles.js';
import { ChatRooms } from './ChatRooms.js';

export const ChatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatRoomId: uuid('chat_room_id')
    .notNull()
    .references(() => ChatRooms.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => Users.id, { onDelete: 'cascade' }),
  message: varchar('message', { length: 500 }).notNull(),
  isRead: boolean('is_read').notNull().default(false),
  attachmentUrl: varchar('attachment_url', { length: 1000 }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});

export const chatMessagesRelation = relations(ChatMessages, ({ one }) => ({
  sender: one(Users, {
    fields: [ChatMessages.senderId],
    references: [Users.id],
  }),
  senderProfile: one(Profiles, {
    fields: [ChatMessages.senderId],
    references: [Profiles.userId],
  }),
  chatRoom: one(ChatRooms, {
    fields: [ChatMessages.chatRoomId],
    references: [ChatRooms.id],
  }),
}));
