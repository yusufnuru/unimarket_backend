import { Server, Socket } from 'socket.io';
import { AuthenticatedSocket } from '../middleware/socketAuthenticate.js';
import { db } from '../config/db.js';
import { Stores } from '../schema/Stores.js';
import { and, eq, not, lt, desc, SQL } from 'drizzle-orm';
import { ChatMessages } from '../schema/ChatMessages.js';
import { Users } from '../schema/Users.js';
import { ChatRoom, JoinRoom, SendMessage, FetchOldMessages, Typing } from './chatSchema.js';
import { getChatRoomDetails, initializeChat } from './chatServices.js';
import { socketAuthenticate } from '../middleware/socketAuthenticate.js';
import appAssert from '../utils/appAssert.js';
import { NOT_FOUND } from '../constants/http.js';

const connectedUsers: Map<string, Socket[]> = new Map();

export const setUpMessageHandler = (io: Server) => {
  // Socket.io namespace for messages
  const chatMessageNamespace = io.of('/message');

  chatMessageNamespace.use(socketAuthenticate());
  chatMessageNamespace.on('connect', (socket: Socket) => {
    const authenticatedSocket = socket as AuthenticatedSocket;
    const userId = authenticatedSocket.userId;

    if (!userId || !authenticatedSocket.role) {
      authenticatedSocket.emit('error', { message: 'Authentication failed' });
      authenticatedSocket.disconnect();
      return;
    }

    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, []);
    }
    connectedUsers.get(userId)!.push(authenticatedSocket);

    // Join Room
    authenticatedSocket.on('join-room', async ({ storeId, buyerId }: JoinRoom) => {
      try {
        const userId = authenticatedSocket.userId;
        const userRole = authenticatedSocket.role;

        const store = await db.query.Stores.findFirst({
          with: {
            owner: true,
          },
          where: eq(Stores.id, storeId),
        });

        if (!store) {
          authenticatedSocket.emit('error', { message: 'Store not found' });
          return;
        }

        const sellerId = store.owner.userId;

        const hasPermission =
          (userRole === 'buyer' && userId === buyerId) ||
          (userRole === 'seller' && userId === sellerId) ||
          userId === sellerId ||
          userId === buyerId;

        if (!hasPermission) {
          authenticatedSocket.emit('error', {
            message: 'You do not have permission to join this room',
          });
          return;
        }

        const { chatRoomId } = await initializeChat(buyerId, storeId);

        await authenticatedSocket.join(chatRoomId);

        const unreadMessages = await db
          .update(ChatMessages)
          .set({ isRead: true })
          .where(
            and(
              eq(ChatMessages.chatRoomId, chatRoomId),
              eq(ChatMessages.isRead, false),
              not(eq(ChatMessages.senderId, userId)),
            ),
          )
          .returning();

        if (unreadMessages.length > 0) {
          authenticatedSocket.to(chatRoomId).emit('messages-read', { readBy: userId });
        }
      } catch (error) {
        console.error('Error joining room:', error);
        authenticatedSocket.emit('error', { message: 'Error joining room' });
      }
    });

    // Fetch Older Messages
    authenticatedSocket.on(
      'fetch-older-messages',
      async ({ storeId, buyerId, beforeMessageId }: FetchOldMessages) => {
        try {
          const userId = authenticatedSocket.userId;
          const userRole = authenticatedSocket.role;

          const { chatRoomId, store } = await initializeChat(buyerId, storeId);

          if (!store) {
            authenticatedSocket.emit('error', { message: 'Store not found' });
            return;
          }

          const sellerId = store.ownerId;
          const hasPermission =
            (userRole === 'buyer' && userId === buyerId) ||
            (userRole === 'seller' && userId === sellerId) ||
            userId === sellerId ||
            userId === buyerId;

          if (!hasPermission) {
            authenticatedSocket.emit('error', { message: 'Unauthorized to fetch messages' });
            return;
          }

          let whereCondition: SQL | undefined = eq(ChatMessages.chatRoomId, chatRoomId);

          if (beforeMessageId) {
            const beforeMessage = await db.query.ChatMessages.findFirst({
              where: eq(ChatMessages.id, beforeMessageId),
            });

            if (beforeMessage) {
              whereCondition = and(
                eq(ChatMessages.chatRoomId, chatRoomId),
                lt(ChatMessages.createdAt, beforeMessage.createdAt),
              );
            }
          }

          // Fetch messages with sender details
          const messages = await db.query.ChatMessages.findMany({
            where: whereCondition,
            orderBy: [desc(ChatMessages.createdAt)],
            limit: 50,
          });

          authenticatedSocket.emit('older-messages', messages.reverse());
        } catch (err) {
          console.error('Error fetching older messages:', err);
          authenticatedSocket.emit('error', { message: 'Failed to fetch older messages' });
        }
      },
    );

    // Send Messages
    authenticatedSocket.on('send-message', async (data: SendMessage) => {
      try {
        const { storeId, buyerId, message, attachmentUrl } = data;

        if (!message?.trim() && !attachmentUrl) {
          authenticatedSocket.emit('error', { message: 'Message content cannot be empty' });
          return;
        }
        const userId = authenticatedSocket.userId;
        const userRole = authenticatedSocket.role;

        const { chatRoomId, store, buyer } = await initializeChat(buyerId, storeId);

        const sellerId = store.ownerId;

        const hasPermission =
          (userRole === 'buyer' && userId === buyerId) ||
          (userRole === 'seller' && userId === sellerId) ||
          userId === sellerId ||
          userId === buyerId;

        if (!hasPermission) {
          authenticatedSocket.emit('error', {
            message: 'Unauthorized to send messages in this chat',
          });
          return;
        }

        const [newMessage] = await db
          .insert(ChatMessages)
          .values({
            chatRoomId,
            senderId: userId,
            message,
            isRead: false,
            attachmentUrl,
          })
          .returning();

        appAssert(newMessage, NOT_FOUND, 'Failed to send message');

        const sender = await db.query.Users.findFirst({
          where: eq(Users.id, userId),
          columns: {
            id: true,
            email: true,
          },
          with: {
            profile: {
              columns: {
                id: true,
                userId: true,
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        });

        chatMessageNamespace.to(chatRoomId).emit('new-message', newMessage);

        if (sender?.profile) {
          type ChatPayload = {
            chatRoomId: typeof chatRoomId;
            lastMessage: typeof newMessage.message;
            lastMessageTime: typeof newMessage.createdAt;
            senderName: typeof sender.profile.fullName;
            senderId: typeof sender.id;
            storeId: typeof store.id;
            sellerId: typeof store.ownerId;
            buyerId: typeof buyerId;
            storeName: typeof store.name;
            buyerName: typeof buyer.name;
          };

          const payload: ChatPayload = {
            chatRoomId: chatRoomId,
            lastMessage: newMessage.message,
            lastMessageTime: newMessage.createdAt,
            senderName: sender.profile.fullName,
            senderId: sender.id,
            storeId: store.id,
            buyerId: buyerId,
            sellerId: sellerId,
            storeName: store.name,
            buyerName: buyer.name,
          };

          const notifyUser = (userId: string, event: string, payload: ChatPayload) => {
            const sockets = connectedUsers.get(userId);
            if (!sockets) return;
            for (const socket of sockets) {
              socket.emit(event, payload);
            }
          };
          notifyUser(buyerId, 'update-chat-preview', payload);
          notifyUser(store.ownerId, 'update-chat-preview', payload);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        authenticatedSocket.emit('error', { message: 'Error sending message' });
      }
    });

    authenticatedSocket.on('mark-read', async ({ chatRoomId: incomingChatRoomId }: ChatRoom) => {
      try {
        const userId = authenticatedSocket.userId;
        const userRole = authenticatedSocket.role;

        const { chatRoomId, store, buyer } = await getChatRoomDetails(
          incomingChatRoomId,
          userId,
          authenticatedSocket.role,
        );
        const sellerId = store.sellerId;
        const buyerId = buyer.id;

        const hasPermission =
          (userRole === 'buyer' && userId === buyerId) ||
          (userRole === 'seller' && userId === sellerId) ||
          userId === sellerId ||
          userId === buyerId;

        if (!hasPermission) {
          authenticatedSocket.emit('error', {
            message: 'You do not have permission to mark messages as read in this room',
          });
          return;
        }

        const updatedMessages = await db
          .update(ChatMessages)
          .set({ isRead: true })
          .where(
            and(
              eq(ChatMessages.chatRoomId, chatRoomId),
              eq(ChatMessages.isRead, false),
              not(eq(ChatMessages.senderId, userId)),
            ),
          )
          .returning();

        if (updatedMessages.length > 0) {
          authenticatedSocket.to(chatRoomId).emit('messages-read', { readBy: userId });
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
        authenticatedSocket.emit('error', { message: 'Error marking message as read' });
      }
    });

    // Handle typing indicators
    authenticatedSocket.on('typing', ({ chatRoomId, isTyping }: Typing) => {
      authenticatedSocket.to(chatRoomId).emit('user-typing', {
        userId: authenticatedSocket.userId,
        isTyping,
      });
    });

    // Leave the chat room
    authenticatedSocket.on('leave-room', async ({ chatRoomId }: ChatRoom) => {
      await authenticatedSocket.leave(chatRoomId);
    });

    // Handle disconnection
    authenticatedSocket.on('disconnect', () => {
      const sockets = connectedUsers.get(authenticatedSocket.userId) || [];
      const updatedSockets = sockets.filter((s) => s.id !== authenticatedSocket.id);

      if (updatedSockets.length > 0) {
        connectedUsers.set(authenticatedSocket.userId, updatedSockets);
      } else {
        connectedUsers.delete(authenticatedSocket.userId);
      }
    });
  });
};
