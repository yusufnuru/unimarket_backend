import {
  AdminParamSchema,
  AdminStoreQuerySchema,
  CreateWarningSchema,
  RejectRequestSchema,
  StoreRequestParamSchema,
} from './adminSchema.js';
import { and, asc, desc, eq, ilike } from 'drizzle-orm';
import appAssert from '../utils/appAssert.js';
import { INTERNAL_SERVER_ERROR, NOT_FOUND } from '../constants/http.js';
import { db } from '../config/db.js';
import { StoreRequests } from '../schema/StoreRequest.js';
import { Stores } from '../schema/Stores.js';
import { Products } from '../schema/Products.js';
import { Profiles } from '../schema/Profiles.js';
import { Warnings } from '../schema/Warnings.js';
import { StoreParamSchema, StoreRequestQuerySchema } from '../store/storeSchema.js';
import { ProductParamSchema, ProductQuerySchema } from '../product/productSchema.js';
import { deleteFolder } from '../utils/s3Utils.js';
import { sendMail } from '../utils/sendMail.js';
import { getWarningEmailTemplate } from '../utils/emailTemplate.js';
import { Reports } from '../schema/Reports.js';
import { getStoreProduct, listStoreProducts } from '../store/storeService.js';
import { APP_ORIGIN } from '../constants/env.js';

export const approveStoreRequest = async (
  userId: string,
  adminId: AdminParamSchema,
  storeRequestId: StoreRequestParamSchema,
) => {
  return await db.transaction(async (tx) => {
    const admin = await tx.query.Profiles.findFirst({
      where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
    });

    appAssert(admin, NOT_FOUND, 'Admin  not found');

    const [approvedRequest] = await tx
      .update(StoreRequests)
      .set({
        requestStatus: 'approved',
        approvedBy: admin.id,
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
  adminId: AdminParamSchema,
  storeRequestId: StoreRequestParamSchema,
  request: RejectRequestSchema,
) => {
  return await db.transaction(async (tx) => {
    const admin = await tx.query.Profiles.findFirst({
      where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
    });

    appAssert(admin, NOT_FOUND, 'Admin not found');

    const [rejectedRequest] = await tx
      .update(StoreRequests)
      .set({
        requestStatus: 'rejected',
        approvedBy: admin.id,
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

export const reviewStoreProducts = async (
  userId: string,
  adminId: AdminParamSchema,
  storeId: StoreParamSchema,
  productId: ProductParamSchema,
  request: CreateWarningSchema,
) => {
  type ActionTaken = 'product_deleted' | 'product_hidden';

  return await db.transaction(async (tx) => {
    const admin = await tx.query.Profiles.findFirst({
      where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
    });

    appAssert(admin, NOT_FOUND, 'Admin not found');

    const store = await tx.query.Stores.findFirst({
      where: eq(Stores.id, storeId),
      with: {
        owner: {
          columns: {
            userId: true,
            fullName: true,
            id: true,
          },
          with: {
            user: true,
          },
        },
      },
    });

    appAssert(store, NOT_FOUND, 'Store not found');

    let product: typeof Products.$inferSelect | undefined;

    if (request.actionTaken === 'product_deleted') {
      const [deletedProduct] = await tx
        .delete(Products)
        .where(and(eq(Products.id, productId), eq(Products.storeId, storeId)))
        .returning();

      appAssert(deletedProduct, NOT_FOUND, 'Product not found');
      const folderPath = `products/${deletedProduct.id}`;
      await deleteFolder(folderPath);

      product = deletedProduct;
    } else if (request.actionTaken !== 'product_hidden') {
      const [hiddenProduct] = await tx
        .update(Products)
        .set({
          visibility: false,
        })
        .where(and(eq(Products.id, productId), eq(Products.storeId, storeId)))
        .returning();

      appAssert(hiddenProduct, NOT_FOUND, 'Product not found or already processed');
      product = hiddenProduct;
    }

    const [warning] = await tx
      .insert(Warnings)
      .values({
        storeId: store.id,
        productId: product?.id as string,
        reason: request.reason,
        actionTaken: request.actionTaken as ActionTaken,
      })
      .returning();

    appAssert(warning, NOT_FOUND, 'Warning could not be created');

    const { data, error } = await sendMail({
      to: store.owner.user.email,
      ...getWarningEmailTemplate({
        productName: product?.productName as string,
        actionTaken: request.actionTaken,
        reason: request.reason,
        storeName: store.storeName,
        price: product?.price.toString() as string,
        description: product?.description as string,
        quantity: product?.quantity as number,
        productUrl: `${APP_ORIGIN}/seller/product/${product?.id}`,
      }),
    });
    appAssert(data?.id, INTERNAL_SERVER_ERROR, `${error?.name}: ${error?.message}`);

    return {
      warning,
      product,
      store,
    };
  });
};

export const listWarnings = async (userId: string, adminId: AdminParamSchema) => {
  const admin = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
  });

  appAssert(admin, NOT_FOUND, 'Admin not found');

  const warnings = await db.query.Warnings.findMany({
    with: {
      store: true,
      product: true,
    },
  });

  appAssert(warnings.length, NOT_FOUND, 'No warnings found');

  return warnings;
};

export const listProductWarnings = async (
  userId: string,
  adminId: AdminParamSchema,
  productId: ProductParamSchema,
) => {
  const admin = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
  });

  appAssert(admin, NOT_FOUND, 'Admin not found');

  const warnings = await db.query.Warnings.findMany({
    where: eq(Warnings.productId, productId),
    with: {
      store: {
        with: {
          owner: true,
        },
      },
    },
  });

  appAssert(warnings, NOT_FOUND, 'No warnings found for this product');

  return warnings;
};

export const listStoreWarnings = async (
  userId: string,
  adminId: AdminParamSchema,
  storeId: StoreParamSchema,
) => {
  const admin = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
  });

  appAssert(admin, NOT_FOUND, 'Admin not found');

  const warnings = await db.query.Warnings.findMany({
    where: eq(Warnings.storeId, storeId),
    with: {
      product: true,
    },
  });

  appAssert(warnings, NOT_FOUND, 'No warnings found for this store');

  return warnings;
};

export const listReports = async (userId: string, adminId: AdminParamSchema) => {
  const admin = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
  });

  appAssert(admin, NOT_FOUND, 'Admin not found');

  const reports = await db.query.Reports.findMany({
    with: {
      product: {
        with: {
          store: true,
        },
      },
    },
  });

  appAssert(reports, NOT_FOUND, 'No reports found');

  return reports;
};

export const listProductReports = async (
  userId: string,
  adminId: AdminParamSchema,
  productId: ProductParamSchema,
) => {
  const admin = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
  });

  appAssert(admin, NOT_FOUND, 'Admin not found');

  const reports = await db.query.Reports.findMany({
    where: eq(Reports.productId, productId),
    with: {
      product: {
        with: {
          store: true,
        },
      },
    },
  });

  appAssert(reports, NOT_FOUND, 'No reports found');

  return reports;
};

export const listStoreReports = async (
  userId: string,
  adminId: AdminParamSchema,
  storeId: StoreParamSchema,
) => {
  const admin = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
  });

  appAssert(admin, NOT_FOUND, 'Admin not found');

  const storeProductsReport = await db
    .select({ reports: Reports, product: Products })
    .from(Reports)
    .innerJoin(Products, eq(Reports.productId, Products.id))
    .innerJoin(Stores, eq(Products.storeId, Stores.id))
    .where(eq(Stores.id, storeId));

  appAssert(storeProductsReport, NOT_FOUND, 'No reports found for this store');

  return storeProductsReport;
};

export const listStoresAdmin = async (
  userId: string,
  adminId: AdminParamSchema,
  query: AdminStoreQuerySchema,
) => {
  const admin = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
  });

  appAssert(admin, NOT_FOUND, 'Admin not found');

  const { page, limit, search, sortBy, status } = query;
  const offset = (page - 1) * limit;

  const searchFilter = search ? ilike(Stores.storeName, `%${search}%`) : undefined;
  const statusFilter = status ? eq(Stores.storeStatus, status) : undefined;

  const whereConditions = statusFilter ? and(searchFilter, statusFilter) : searchFilter;
  const orderBy = sortBy
    ? sortBy === 'name'
      ? asc(Stores.storeName)
      : asc(Stores.createdAt)
    : desc(Stores.createdAt);

  const stores = await db.query.Stores.findMany({
    where: whereConditions,
    orderBy,
    offset,
    limit,
  });

  appAssert(stores, NOT_FOUND, 'No stores found');

  const total = await db.$count(Stores, whereConditions);

  return { stores, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const getStoreAdmin = async (
  userId: string,
  adminId: AdminParamSchema,
  storeId: StoreParamSchema,
) => {
  const admin = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
  });

  appAssert(admin, NOT_FOUND, 'Admin not found');

  const store = await db.query.Stores.findFirst({
    where: eq(Stores.id, storeId),
    with: {
      owner: {
        with: {
          user: {
            columns: {
              email: true,
            },
          },
        },
      },
      requests: true,
      warnings: true,
    },
  });

  appAssert(store, NOT_FOUND, 'Store not found');
  return store;
};

export const listStoreProductsAdmin = async (
  userId: string,
  adminId: AdminParamSchema,
  storeId: StoreParamSchema,
  query: ProductQuerySchema,
) => {
  const admin = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
  });

  appAssert(admin, NOT_FOUND, 'Admin not found');

  return await listStoreProducts(storeId, query);
};

export const getProductAdmin = async (
  userId: string,
  adminId: AdminParamSchema,
  storeId: StoreParamSchema,
  productId: ProductParamSchema,
) => {
  const admin = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
  });

  appAssert(admin, NOT_FOUND, 'Admin not found');

  return await getStoreProduct(storeId, productId);
};

export const listStoreRequestsAdmin = async (
  userId: string,
  adminId: AdminParamSchema,
  query: StoreRequestQuerySchema,
) => {
  const admin = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
  });

  appAssert(admin, NOT_FOUND, 'Admin not found');

  const { page, limit } = query;
  const offset = (page - 1) * limit;

  const storeRequests = await db.query.StoreRequests.findMany({
    offset,
    limit,
    with: {
      store: {
        columns: {
          id: true,
          storeName: true,
        },
      },
    },
  });

  appAssert(storeRequests.length, NOT_FOUND, 'No store requests found');

  const total = await db.$count(StoreRequests);

  return {
    storeRequests,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};
