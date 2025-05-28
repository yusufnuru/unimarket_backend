import { storeParamSchema } from '../store/storeSchema.js';
import catchError from '../utils/cacheErrors.js';
import {
  getChatHistory,
  getChatRoomDetails,
  getUserChats,
  initializeChat,
} from './chatServices.js';
import { chatHistoryQuerySchema, roomIdSchema, userChatQuerySchema } from './chatSchema.js';

export const initializeChatHandler = catchError(async (req, res) => {
  // Validate request

  const storeId = storeParamSchema.parse(req.params.storeId);
  const buyerId = req.userId;

  // call service
  const { buyer, chatRoomId, store } = await initializeChat(buyerId, storeId);
  res.status(200).json({
    message: 'Chat initialized successfully',
    data: {
      chatRoomId,
      buyer,
      store,
    },
  });
});

export const getChatHistoryHandler = catchError(async (req, res) => {
  // Validate request
  const storeId = storeParamSchema.parse(req.params.storeId);
  const role = req.role;
  const userId = req.userId;
  const query = chatHistoryQuerySchema.parse(req.query);

  // Call service
  const { chatRoomId, messages, nextCursor, hasMore } = await getChatHistory(
    storeId,
    userId,
    role,
    query,
  );

  res.status(200).json({
    message: 'Chat history fetched successfully',
    data: {
      chatRoomId,
      messages,
      nextCursor,
      hasMore,
    },
  });
});

export const getUserChatsHandler = catchError(async (req, res) => {
  const userId = req.userId;
  const role = req.role;
  const query = userChatQuerySchema.parse(req.query);

  // Call service
  const { data, limit, total, page, totalPages } = await getUserChats(userId, role, query);

  res.status(200).json({
    message: 'User chats fetched successfully',
    data: {
      chats: data,
      limit,
      total,
      page,
      totalPages,
    },
  });
});

export const getChatRoomDetailsHandler = catchError(async (req, res) => {
  const roomId = roomIdSchema.parse(req.params.roomId);
  const role = req.role;
  const userId = req.userId;

  // Call service
  const { chatRoomId, buyer, store } = await getChatRoomDetails(roomId, userId, role);

  res.status(200).json({
    message: 'Chat room details fetched successfully',
    data: {
      chatRoomId,
      buyer,
      store,
    },
  });
});
