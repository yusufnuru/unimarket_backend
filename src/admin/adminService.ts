import {
  AdminParamSchema,
  AdminStoreQuerySchema,
  CreateWarningSchema,
  RejectRequestSchema,
  StoreRequestParamSchema,
} from './adminSchema.js';
import { and, asc, desc, eq, gte, ilike, inArray, lte, sql } from 'drizzle-orm';
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
import { deleteFolder, getObjectSignedUrl } from '../utils/s3Utils.js';
import { sendMail } from '../utils/sendMail.js';
import {
  getWarningEmailTemplate,
  getProductRestoredEmailTemplate,
} from '../utils/emailTemplate.js';
import { Reports } from '../schema/Reports.js';
import { getStoreProduct, listStoreProducts } from '../store/storeService.js';
import { APP_ORIGIN } from '../constants/env.js';
import { Wishlists } from '../schema/Wishlists.js';

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

    return {
      storeRequest: rejectedRequest,
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
    } else if (request.actionTaken === 'product_hidden') {
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
      store: {
        columns: {
          id: true,
          storeName: true,
        },
      },
      product: {
        columns: {
          id: true,
          productName: true,
          storeId: true,
        },
      },
    },
  });

  appAssert(warnings.length, NOT_FOUND, 'No warnings found');

  return warnings;
};

export const restoreStoreProducts = async (
  userId: string,
  adminId: AdminParamSchema,
  storeId: StoreParamSchema,
  productId: ProductParamSchema,
) => {
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

    const product = await getStoreProduct(storeId, productId);

    if (!product) {
      throw new Error('Product not found');
    }

    const [restoredProduct] = await tx
      .update(Products)
      .set({ visibility: true })
      .where(and(eq(Products.id, productId), eq(Products.storeId, storeId)))
      .returning();

    appAssert(restoredProduct, NOT_FOUND, 'Product not found or already restored');

    const { data, error } = await sendMail({
      to: store.owner.user.email,
      ...getProductRestoredEmailTemplate({
        productName: restoredProduct?.productName,
        storeName: store.storeName,
        price: restoredProduct?.price.toString(),
        description: restoredProduct?.description as string,
        quantity: restoredProduct?.quantity,
        productUrl: `${APP_ORIGIN}/seller/product/${restoredProduct?.id}`,
      }),
    });
    appAssert(data?.id, INTERNAL_SERVER_ERROR, `${error?.name}: ${error?.message}`);

    return {
      product: restoredProduct,
      store,
    };
  });
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
      product: {
        columns: {
          id: true,
          productName: true,
          storeId: true,
        },
      },
      store: {
        columns: {
          id: true,
          storeName: true,
        },
      },
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
      warnings: {
        with: {
          product: {
            columns: {
              id: true,
              productName: true,
              storeId: true,
            },
          },
          store: {
            columns: {
              id: true,
              storeName: true,
            },
          },
        },
      },
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
  productId: ProductParamSchema,
) => {
  const admin = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
  });

  appAssert(admin, NOT_FOUND, 'Admin not found');

  const product = await db.query.Products.findFirst({
    where: eq(Products.id, productId),
    with: {
      category: {
        columns: {
          id: true,
          name: true,
        },
      },
      images: {
        columns: {
          id: true,
          imageUrl: true,
        },
      },
      wishlists: {
        where: eq(Wishlists.productId, productId),
        columns: {
          id: true,
        },
      },
    },
  });

  appAssert(product, NOT_FOUND, 'Product not found');

  const wishlistCount = product.wishlists.length;

  const productWithImages = {
    id: product.id,
    productName: product.productName,
    description: product.description,
    price: product.price,
    quantity: product.quantity,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    storeId: product.storeId,
    categoryId: product.categoryId,
    visibility: product.visibility,
    category: {
      id: product.category.id,
      name: product.category.name,
    },
    wishlistCount,
    images: await Promise.all(
      product.images.map(async (image) => ({
        id: image.id,
        imageUrl: await getObjectSignedUrl(image.imageUrl),
      })),
    ),
  };

  appAssert(productWithImages, NOT_FOUND, 'Product not found');

  return {
    product: {
      ...productWithImages,
    },
  };
};

export const listProductsAdmin = async (
  userId: string,
  adminId: AdminParamSchema,
  query: ProductQuerySchema,
) => {
  const admin = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
  });

  appAssert(admin, NOT_FOUND, 'Admin not found');

  const { page, limit, search, storeId, maxPrice, minPrice, sortBy, sortOrder, categoryId } = query;

  const offset = (page - 1) * limit;

  const whereConditions = [eq(Products.visibility, true)];

  if (search) {
    whereConditions.push(ilike(Products.productName, `%${search}%`));
  }
  if (storeId) {
    whereConditions.push(eq(Products.storeId, storeId));
  }
  if (categoryId) {
    whereConditions.push(eq(Products.categoryId, categoryId));
  }
  if (minPrice !== undefined) {
    whereConditions.push(gte(Products.price, minPrice));
  }
  if (maxPrice !== undefined) {
    whereConditions.push(lte(Products.price, maxPrice));
  }

  const where = and(...whereConditions);

  const products = await db.query.Products.findMany({
    where,
    limit,
    offset,
    orderBy:
      sortBy === 'price'
        ? sortOrder === 'asc'
          ? asc(Products.price)
          : desc(Products.price)
        : sortBy === 'productName'
          ? sortOrder === 'asc'
            ? asc(Products.productName)
            : desc(Products.productName)
          : sortOrder === 'asc'
            ? asc(Products.createdAt)
            : desc(Products.createdAt),
    with: {
      images: {
        columns: {
          id: true,
          imageUrl: true,
        },
      },
    },
  });

  const total = await db.$count(Products, where);

  appAssert(products, NOT_FOUND, 'Products not found');

  // Get wishlist counts for all products in a single query
  const productIds = products.map((p) => p.id);
  const wishlistCounts = await db
    .select({
      productId: Wishlists.productId,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(Wishlists)
    .where(inArray(Wishlists.productId, productIds))
    .groupBy(Wishlists.productId);

  // Create a map for a quick lookup
  const wishlistCountMap = new Map(wishlistCounts.map((wc) => [wc.productId, wc.count]));

  const productsWithImages = await Promise.all(
    products.map(async (product) => ({
      ...product,
      images: await Promise.all(
        product.images.map(async (image) => ({
          id: image.id,
          imageUrl: await getObjectSignedUrl(image.imageUrl),
        })),
      ),
      wishlistCount: wishlistCountMap.get(product.id) || 0,
    })),
  );

  appAssert(productsWithImages, NOT_FOUND, 'Products not found');

  return {
    products: productsWithImages,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
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

  appAssert(storeRequests, NOT_FOUND, 'No store requests found');

  const total = await db.$count(StoreRequests);

  return {
    storeRequests,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const getStoreRequestAdmin = async (
  userId: string,
  adminId: AdminParamSchema,
  storeRequestId: StoreRequestParamSchema,
) => {
  const admin = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
  });
  appAssert(admin, NOT_FOUND, 'Admin not found');

  const storeRequest = await db.query.StoreRequests.findFirst({
    where: eq(StoreRequests.id, storeRequestId),
    with: {
      store: {
        with: {
          owner: {
            columns: {
              id: true,
              fullName: true,
            },
          },
        },
      },
    },
  });

  appAssert(storeRequest, NOT_FOUND, 'Store request not found');

  return storeRequest;
};

export const listStoreRequestsByStore = async (
  userId: string,
  adminId: AdminParamSchema,
  request: StoreRequestQuerySchema,
  storeId: StoreParamSchema,
) => {
  const admin = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, adminId), eq(Profiles.userId, userId), eq(Profiles.role, 'admin')),
  });

  appAssert(admin, NOT_FOUND, 'Admin not found');

  const { page, limit } = request;
  const offset = (page - 1) * limit;

  const storeRequests = await db.query.StoreRequests.findMany({
    where: eq(StoreRequests.storeId, storeId),
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

  appAssert(storeRequests.length, NOT_FOUND, 'No store requests found for this store');

  const total = await db.$count(StoreRequests, eq(StoreRequests.storeId, storeId));

  return {
    storeRequests,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};
