import { db } from '../config/db.js';
import { and, asc, desc, eq, ilike } from 'drizzle-orm';
import { Profiles } from '../schema/Profiles.js';
import appAssert from '../utils/appAssert.js';
import { CONFLICT, FORBIDDEN, NOT_FOUND } from '../constants/http.js';
import { Stores } from '../schema/Stores.js';
import { StoreRequests } from '../schema/StoreRequest.js';
import {
  createStoreSchema,
  storeQuerySchema,
  updateStoreSchema,
  storeParamSchema,
} from './storeSchema.js';
import { Products } from '../schema/Products.js';
import { deleteFolder } from '../utils/s3Utils.js';

/**
 * Helper function to get authorized seller and their store
 * @param tx - Database transaction
 * @param userId - ID of the user
 * @param storeId - Optional store ID to verify ownership
 * @returns Object containing seller and store
 */

type TransactionType = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function getAuthorizedSellerAndStore(
  tx: TransactionType,
  userId: string,
  storeId: string | null = null,
) {
  const seller = await tx.query.Profiles.findFirst({
    where: eq(Profiles.userId, userId),
    with: {
      user: {
        columns: {
          id: true,
        },
      },
      store: {
        columns: {
          id: true,
          ownerId: true,
          storeName: true,
          storeStatus: true,
        },
      },
    },
  });

  appAssert(
    seller && seller.hasStore,
    FORBIDDEN,
    'You are not authorized to access the store or store not found',
  );

  appAssert(seller.store.id === storeId, NOT_FOUND, 'Store not found');

  return { seller, store: seller.store };
}

export const listStores = async (query: storeQuerySchema) => {
  const { page, limit, search, sortBy } = query;
  const offset = (page - 1) * limit;

  const where = search
    ? and(eq(Stores.storeStatus, 'active'), ilike(Stores.storeName, `%${search}%`))
    : eq(Stores.storeStatus, 'active');

  const orderBy = sortBy
    ? sortBy === 'name'
      ? asc(Stores.storeName)
      : asc(Stores.createdAt)
    : desc(Stores.createdAt);

  const stores = await db.query.Stores.findMany({
    where,
    orderBy,
    offset,
    limit,
  });

  const total = await db.$count(Stores, where);

  return { stores, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const getStore = async (storeId: storeParamSchema) => {
  const store = await db.query.Stores.findFirst({
    where: and(eq(Stores.id, storeId), eq(Stores.storeStatus, 'active')),
    with: {
      products: {
        columns: {
          id: true,
          productName: true,
          description: true,
          price: true,
          quantity: true,
        },
      },
      owner: {
        columns: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  appAssert(store, NOT_FOUND, 'Store not found');

  return { store };
};

export const createStore = async (storeDto: createStoreSchema, userId: string) => {
  return await db.transaction(async (tx) => {
    const seller = await tx.query.Profiles.findFirst({
      where: eq(Profiles.userId, userId),
      with: {
        user: {
          columns: {
            id: true,
          },
        },
        store: {
          columns: {
            id: true,
            ownerId: true,
            storeName: true,
          },
        },
      },
    });

    appAssert(seller && seller.hasStore, FORBIDDEN, 'You are not authorized to create a store');

    appAssert(!seller.store, FORBIDDEN, 'You already have a store');

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
        ownerId: seller.id,
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

export const updateStore = async (
  storeDto: updateStoreSchema,
  userId: string,
  storeId: storeParamSchema,
) => {
  return await db.transaction(async (tx) => {
    const { store } = await getAuthorizedSellerAndStore(tx, userId, storeId);

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
      .where(and(eq(Stores.id, store.id), eq(Stores.ownerId, store.ownerId)))
      .returning();

    appAssert(updatedStore, NOT_FOUND, 'Store not found');

    return { updatedStore };
  });
};

export const getSellerStore = async (storeId: storeParamSchema, userId: string) => {
  return await db.transaction(async (tx) => {
    const { store } = await getAuthorizedSellerAndStore(tx, userId, storeId);

    return { store };
  });
};

export const deleteSellerStore = async (storeId: storeParamSchema, userId: string) => {
  return await db.transaction(async (tx) => {
    const { store, seller } = await getAuthorizedSellerAndStore(tx, userId, storeId);
    const sellerId = seller.id;

    const products = await tx.query.Products.findMany({
      where: eq(Products.storeId, store.id),
      with: {
        images: {
          columns: {
            id: true,
            imageUrl: true,
          },
        },
      },
    });

    let deletedImageFolders: Set<string> | undefined;
    if (products.length > 0) {
      const folderPaths = new Set(
        products
          .flatMap((product) => product.images)
          .map((image) => {
            const parts = image.imageUrl.split('/');
            return `${parts[0]}/${parts[1]}`;
          }),
      );
      await Promise.all([...folderPaths].map(async (filePath) => await deleteFolder(filePath)));
      deletedImageFolders = folderPaths;
      console.log('deletedImageFolders', folderPaths);
    }

    const [deletedStore] = await tx
      .delete(Stores)
      .where(and(eq(Stores.id, store.id), eq(Stores.ownerId, sellerId)))
      .returning();

    appAssert(deletedStore, NOT_FOUND, 'Store not found');

    return { deletedStore, deletedImageFolders };
  });
};
