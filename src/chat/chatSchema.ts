import { z } from 'zod';
import { storeParamSchema } from '../store/storeSchema.js';

export const roomIdSchema = z.string().uuid('Invalid room id').nonempty('Room id is required');

export const buyerIdSchema = z.string().uuid('Invalid buyer id').nonempty('Buyer id is required');
export const limit = z.coerce
  .number()
  .min(1, 'Limit must be at least 1')
  .max(100, 'Limit must be at most 100')
  .optional()
  .default(50);

export const userChatQuerySchema = z.object({
  limit,
  page: z.coerce.number().min(1).optional().default(1),
});

export const chatHistoryQuerySchema = z.object({
  buyerId: buyerIdSchema.optional(),
  cursor: z.string().datetime().optional(),
  limit,
});

export const ChatRoomSchema = z.object({
  chatRoomId: roomIdSchema,
});

export const TypingSchema = ChatRoomSchema.extend({
  isTyping: z.boolean(),
});

export const JoinRoomSchema = z.object({
  storeId: storeParamSchema,
  buyerId: buyerIdSchema,
});

export const SendMessageSchema = JoinRoomSchema.extend({
  message: z.string().min(1).max(500),
  attachmentUrl: z.string().optional(),
});

export const FetchOldMessagesSchema = JoinRoomSchema.extend({
  beforeMessageId: z.string().uuid('Invalid message id').optional(),
});

export type RoomId = z.infer<typeof roomIdSchema>;
export type ChatRoom = z.infer<typeof ChatRoomSchema>;
export type Typing = z.infer<typeof TypingSchema>;
export type SendMessage = z.infer<typeof SendMessageSchema>;
export type JoinRoom = z.infer<typeof JoinRoomSchema>;
export type FetchOldMessages = z.infer<typeof FetchOldMessagesSchema>;
export type ChatHistoryQuery = z.infer<typeof chatHistoryQuerySchema>;
export type UserChatQuery = z.infer<typeof userChatQuerySchema>;
