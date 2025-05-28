import { and, count, desc, eq, inArray, lt, not, sql } from 'drizzle-orm';
import { Stores } from '../schema/Stores.js';
import { StoreParamSchema } from '../store/storeSchema.js';
import { db } from '../config/db.js';
import appAssert from '../utils/appAssert.js';
import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from '../constants/http.js';
import { Users } from '../schema/Users.js';
import { ChatHistoryQuery, RoomId, UserChatQuery } from './chatSchema.js';
import { ChatMessages } from '../schema/ChatMessages.js';
import { ChatRooms } from '../schema/ChatRooms.js';

export const initializeChat = async (buyerId: string, storeId: StoreParamSchema) => {
  return await db.transaction(async (tx) => {
    const store = await tx.query.Stores.findFirst({
      where: eq(Stores.id, storeId),
      with: { owner: true },
    });

    appAssert(
      store && store.storeStatus === 'active',
      NOT_FOUND,
      'Store not found, chat initialization failed',
    );

    const sellerId = store.owner.userId;

    const buyer = await tx.query.Users.findFirst({
      where: eq(Users.id, buyerId),
      columns: {
        id: true,
        email: true,
        verified: true,
      },
      with: {
        profile: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    appAssert(buyer && buyer.verified, NOT_FOUND, 'Buyer not found, chat initialization failed');

    appAssert(buyerId !== sellerId, FORBIDDEN, 'Buyer and seller cannot be the same person');

    const checkChatRoom = await tx.query.ChatRooms.findFirst({
      where: and(eq(ChatRooms.buyerId, buyerId), eq(ChatRooms.storeId, storeId)),
    });

    let chatRoomId: string;
    if (checkChatRoom) {
      chatRoomId = checkChatRoom.id;
    } else {
      const [newChatRoom] = await tx
        .insert(ChatRooms)
        .values({
          storeId: storeId,
          buyerId: buyerId,
        })
        .returning();
      chatRoomId = newChatRoom.id;
    }

    return {
      chatRoomId,
      buyer: {
        id: buyer.id,
        name: buyer.profile?.fullName,
      },
      store: {
        id: store.id,
        ownerId: sellerId,
        name: store.storeName,
      },
    };
  });
};

export const getChatHistory = async (
  storeId: StoreParamSchema,
  userId: string,
  role: string,
  query: ChatHistoryQuery,
) => {
  const { buyerId, cursor, limit } = query;
  return await db.transaction(async (tx) => {
    const store = await tx.query.Stores.findFirst({
      where: and(eq(Stores.id, storeId), eq(Stores.storeStatus, 'active')),
      with: { owner: true },
    });

    appAssert(store, NOT_FOUND, 'No active store found');

    let chatRoom;

    if (role === 'buyer') {
      chatRoom = await tx.query.ChatRooms.findFirst({
        where: and(eq(ChatRooms.storeId, storeId), eq(ChatRooms.buyerId, userId)),
      });
    } else if (role === 'seller') {
      appAssert(buyerId, BAD_REQUEST, 'Buyer id is required');

      // Verify the seller owns the store
      appAssert(store.owner.userId === userId, FORBIDDEN, 'Unauthorized to access this store');

      chatRoom = await tx.query.ChatRooms.findFirst({
        where: and(eq(ChatRooms.storeId, storeId), eq(ChatRooms.buyerId, buyerId)),
      });
    } else {
      appAssert(false, FORBIDDEN, 'Unauthorized to access this chat');
    }

    if (!chatRoom) {
      return {
        chatRoomId: null,
        messages: [],
        nextCursor: null,
        hasMore: false,
      };
    }

    const where = cursor
      ? and(eq(ChatMessages.chatRoomId, chatRoom.id), lt(ChatMessages.createdAt, cursor))
      : eq(ChatMessages.chatRoomId, chatRoom.id);

    const messages = await tx.query.ChatMessages.findMany({
      where,
      orderBy: [desc(ChatMessages.createdAt)],
      limit,
      with: {
        sender: {
          columns: {
            id: true,
            email: true,
          },
        },
        senderProfile: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    const hasMore = messages.length === limit;
    const nextCursor = hasMore ? messages[messages.length - 1].createdAt : null;

    return {
      chatRoomId: chatRoom.id,
      messages: messages.reverse(),
      nextCursor,
      hasMore,
    };
  });
};

export const getUserChats = async (userId: string, role: string, query: UserChatQuery) => {
  const { limit, page } = query;
  return await db.transaction(async (tx) => {
    const user = await tx.query.Users.findFirst({
      where: eq(Users.id, userId),
      with: { profile: true },
    });

    appAssert(user, NOT_FOUND, 'User not found');
    appAssert(user.verified, NOT_FOUND, 'User not verified');
    appAssert(user.profile, NOT_FOUND, 'User profile not found');

    const isSeller = user.profile.role === 'seller';
    const isBuyer = user.profile.role === 'buyer';

    appAssert(isSeller || isBuyer, FORBIDDEN, 'User is neither a seller nor a buyer');

    let chatRoomsQuery;

    if (isSeller) {
      const store = await tx.query.Stores.findFirst({
        where: and(eq(Stores.ownerId, user.profile.id), eq(Stores.storeStatus, 'active')),
        with: { owner: true },
      });

      console.log(store);

      appAssert(store, NOT_FOUND, 'No active store found');
      chatRoomsQuery = eq(ChatRooms.storeId, store.id);
    } else {
      chatRoomsQuery = eq(ChatRooms.buyerId, userId);
    }

    const offset = (page - 1) * limit;
    const chatRooms = await tx.query.ChatRooms.findMany({
      where: chatRoomsQuery,
      limit,
      offset,
      orderBy: desc(ChatRooms.updatedAt),
      with: {
        store: true,
        buyer: {
          with: {
            profile: true,
          },
        },
      },
    });

    if (chatRooms.length === 0) {
      return {
        page,
        limit,
        total: 0,
        totalPages: 0,
        data: [],
      };
    }

    const roomIds = chatRooms.map((room) => room.id);

    const latestMessages = await tx
      .selectDistinctOn([ChatMessages.chatRoomId], {
        chatRoomId: ChatMessages.chatRoomId,
        message: ChatMessages.message,
        createdAt: ChatMessages.createdAt,
        updatedAt: ChatMessages.updatedAt,
        senderId: ChatMessages.senderId,
      })
      .from(ChatMessages)
      .where(inArray(ChatMessages.chatRoomId, roomIds))
      .orderBy(ChatMessages.chatRoomId, desc(ChatMessages.createdAt))
      .execute();

    const messageMap = new Map(latestMessages.filter(Boolean).map((msg) => [msg.chatRoomId, msg]));

    const unreadCounts = await tx
      .select({
        chatRoomId: ChatMessages.chatRoomId,
        count: count(),
      })
      .from(ChatMessages)
      .where(
        and(
          inArray(ChatMessages.chatRoomId, roomIds),
          eq(ChatMessages.isRead, false),
          not(eq(ChatMessages.senderId, userId)),
        ),
      )
      .groupBy(ChatMessages.chatRoomId);

    const unReadMap = new Map(unreadCounts.map((item) => [item.chatRoomId, item.count]));

    const previews = chatRooms.map((room) => {
      const latestMsg = messageMap.get(room.id);

      return {
        chatRoomId: room.id,
        storeId: room.storeId,
        buyerId: room.buyerId,
        storeName: room.store?.storeName || 'Unknown Store',
        buyerName: room.buyer?.profile.fullName || 'Unknown Buyer',
        lastMessage: latestMsg?.message || undefined,
        senderId: latestMsg?.senderId || undefined,
        lastMessageTime: latestMsg?.createdAt || new Date().toISOString(),
        unreadCount: unReadMap.get(room.id) || 0,
      };
    });

    previews.sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime(),
    );

    const total = await tx
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(ChatMessages)
      .innerJoin(ChatRooms, eq(ChatRooms.id, ChatMessages.chatRoomId)) // Add this join
      .where(chatRoomsQuery)
      .then((r) => r[0]?.count || 0);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(previews.length / limit),
      data: previews,
    };
  });
};

export const getChatRoomDetails = async (chatRoomId: RoomId, userId: string, role: string) => {
  return await db.transaction(async (tx) => {
    const chatRoom = await tx.query.ChatRooms.findFirst({
      where: eq(ChatRooms.id, chatRoomId),
      with: {
        store: {
          columns: {
            id: true,
            storeName: true,
            storeStatus: true,
            description: true,
          },
          with: {
            owner: {
              columns: {
                id: true,
                userId: true,
                fullName: true,
              },
              with: {
                user: {
                  columns: {
                    id: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        buyer: {
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
              },
            },
          },
        },
      },
    });

    appAssert(chatRoom, NOT_FOUND, 'Chat room not found');

    const hasAccess =
      (role === 'buyer' && chatRoom.buyerId === userId) ||
      (role === 'seller' && chatRoom.store.owner.userId === userId);

    appAssert(hasAccess, FORBIDDEN, 'Unauthorized to access this chat room');

    return {
      chatRoomId,
      store: {
        id: chatRoom.store.id,
        name: chatRoom.store.storeName,
        sellerId: chatRoom.store.owner.userId,
      },
      buyer: {
        id: chatRoom.buyer.id,
        name: chatRoom.buyer.profile?.fullName,
      },
    };
  });
};
