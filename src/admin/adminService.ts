import { rejectRequestSchema, storeRequestParamSchema } from './adminSchema.js';
import { and, eq } from 'drizzle-orm';
import appAssert from '../utils/appAssert.js';
import { NOT_FOUND } from '../constants/http.js';
import { db } from '../config/db.js';
import { StoreRequests } from '../schema/StoreRequest.js';
import { Stores } from '../schema/Stores.js';
import { Products } from '../schema/Products.js';
import { Profiles } from '../schema/Profiles.js';

export const approveStoreRequest = async (
  userId: string,
  storeRequestId: storeRequestParamSchema,
) => {
  return await db.transaction(async (tx) => {
    const adminProfile = await tx.query.Profiles.findFirst({
      where: and(eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
    });

    appAssert(adminProfile, NOT_FOUND, 'Admin profile not found');

    const [approvedRequest] = await tx
      .update(StoreRequests)
      .set({
        requestStatus: 'approved',
        approvedBy: adminProfile.id,
        rejectionReason: null,
      })
      .where(and(eq(StoreRequests.id, storeRequestId), eq(StoreRequests.requestStatus, 'pending')))
      .returning();

    appAssert(approvedRequest, NOT_FOUND, 'Store request not found or already processed');

    const [approvedStore] = await tx
      .update(Stores)
      .set({
        storeStatus: 'active',
      })
      .where(and(eq(Stores.id, approvedRequest.storeId)))
      .returning();

    await tx
      .update(Products)
      .set({ visibility: true })
      .where(eq(Products.storeId, approvedStore.id))
      .returning();

    appAssert(approvedStore, NOT_FOUND, 'Store not found or already processed');

    return {
      storeRequest: approvedRequest,
      store: approvedStore,
    };
  });
};

export const rejectStoreRequest = async (
  userId: string,
  storeRequestId: storeRequestParamSchema,
  request: rejectRequestSchema,
) => {
  return await db.transaction(async (tx) => {
    const adminProfile = await tx.query.Profiles.findFirst({
      where: and(eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
    });

    appAssert(adminProfile, NOT_FOUND, 'Admin profile not found');

    const [rejectedRequest] = await tx
      .update(StoreRequests)
      .set({
        requestStatus: 'rejected',
        approvedBy: adminProfile.id,
        rejectionReason: request.rejectionReason,
      })
      .where(and(eq(StoreRequests.id, storeRequestId), eq(StoreRequests.requestStatus, 'pending')))
      .returning();

    appAssert(rejectedRequest, NOT_FOUND, 'Store request not found or already processed');

    const [rejectedStore] = await tx
      .update(Stores)
      .set({
        storeStatus: 'inactive',
      })
      .where(and(eq(Stores.id, rejectedRequest.storeId)))
      .returning();

    await tx
      .update(Products)
      .set({ visibility: false })
      .where(eq(Products.storeId, rejectedStore.id))
      .returning();

    appAssert(rejectedStore, NOT_FOUND, 'Store not found or already processed');

    return {
      storeRequest: rejectedRequest,
      store: rejectedStore,
    };
  });
};
