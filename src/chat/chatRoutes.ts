import express from 'express';
import {
  initializeChatHandler,
  getChatHistoryHandler,
  getUserChatsHandler,
  getChatRoomDetailsHandler,
} from './chatController.js';

const chatRouter = express.Router();

chatRouter.get('/init/:storeId', initializeChatHandler);
chatRouter.get('/history/:storeId', getChatHistoryHandler);
chatRouter.get('/my-chats', getUserChatsHandler);
chatRouter.get('/room/:roomId', getChatRoomDetailsHandler);

export default chatRouter;
