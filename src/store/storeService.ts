import { db } from '../config/db.js';
import { and, eq } from 'drizzle-orm';
import { Users } from '../schema/Users.js';
import { Profiles } from '../schema/Profiles.js';
import appAssert from '../utils/appAssert.js';
import { CONFLICT, FORBIDDEN, NOT_FOUND } from '../constants/http.js';
import { Stores } from '../schema/Stores.js';
import { StoreRequests } from '../schema/StoreRequest.js';
import { createStoreSchema, storeParamSchema, updateStoreSchema } from './storeSchema.js';

export const createStore = async (storeDto: createStoreSchema, userId: string) => {
  return await db.transaction(async (tx) => {
    const [seller] = await tx
      .select({
        userId: Users.id,
        profileId: Profiles.id,
        hasStore: Profiles.hasStore,
      })
      .from(Users)
      .innerJoin(Profiles, eq(Users.id, Profiles.userId))
      .where(eq(Users.id, userId))
      .limit(1);

    appAssert(seller && seller.hasStore, FORBIDDEN, 'You are not authorized to create a store');

    const existingStore = await tx.query.Stores.findFirst({
      where: eq(Stores.ownerId, seller.profileId),
    });

    appAssert(!existingStore, CONFLICT, 'You already have a store');

    const storeNameTaken = await tx.query.Stores.findFirst({
      where: (Stores, { eq }) => eq(Stores.storeName, storeDto.name),
    });

    appAssert(!storeNameTaken, CONFLICT, 'Store name already exists');

    const [newStore] = await tx
      .insert(Stores)
      .values({
        storeName: storeDto.name,
        description: storeDto.description,
        storeAddress: storeDto.address,
        ownerId: seller.profileId,
      })
      .returning();

    await tx
      .insert(StoreRequests)
      .values({
        storeId: newStore.id,
      })
      .returning();

    return { newStore };
  });
};

export const updateSellerStore = async (
  storeDto: updateStoreSchema,
  userId: string,
  storeId: storeParamSchema,
) => {
  return await db.transaction(async (tx) => {
    const [seller] = await tx
      .select({
        userId: Users.id,
        profileId: Profiles.id,
        hasStore: Profiles.hasStore,
      })
      .from(Users)
      .innerJoin(Profiles, eq(Users.id, Profiles.userId))
      .where(eq(Users.id, userId))
      .limit(1);

    appAssert(seller && seller.hasStore, FORBIDDEN, 'You are not authorized to access the store');

    const storeNameTaken = await tx.query.Stores.findFirst({
      where: eq(Stores.storeName, storeDto.name as string),
    });

    appAssert(!storeNameTaken, CONFLICT, 'Store name already exists');

    const [updatedStore] = await tx
      .update(Stores)
      .set({
        storeName: storeDto.name,
        description: storeDto.description,
        storeAddress: storeDto.address,
      })
      .where(and(eq(Stores.id, storeId), eq(Stores.ownerId, seller.profileId)))
      .returning();

    appAssert(updatedStore, NOT_FOUND, 'Store not found');

    return { updatedStore };
  });
};

export const getSellerStore = async (storeId: storeParamSchema, userId: string) => {
  return await db.transaction(async (tx) => {
    const [seller] = await tx
      .select({
        userId: Users.id,
        profileId: Profiles.id,
        hasStore: Profiles.hasStore,
      })
      .from(Users)
      .innerJoin(Profiles, eq(Users.id, Profiles.userId))
      .where(eq(Users.id, userId))
      .limit(1);

    appAssert(seller && seller.hasStore, FORBIDDEN, 'You are not authorized to access the store');

    const store = await tx.query.Stores.findFirst({
      where: and(eq(Stores.id, storeId), eq(Stores.ownerId, seller.profileId)),
    });

    appAssert(store, NOT_FOUND, 'Store not found');

    return { store };
  });
};

export const deleteSellerStore = async (storeId: storeParamSchema, userId: string) => {
  return await db.transaction(async (tx) => {
    const [seller] = await tx
      .select({
        userId: Users.id,
        profileId: Profiles.id,
        hasStore: Profiles.hasStore,
      })
      .from(Users)
      .innerJoin(Profiles, eq(Users.id, Profiles.userId))
      .where(eq(Users.id, userId))
      .limit(1);

    appAssert(seller && seller.hasStore, FORBIDDEN, 'You are not authorized to access the store');

    const [deletedStore] = await tx
      .delete(Stores)
      .where(and(eq(Stores.id, storeId), eq(Stores.ownerId, seller.profileId)))
      .returning();

    appAssert(deletedStore, NOT_FOUND, 'Store not found');

    return { deletedStore };
  });
};
