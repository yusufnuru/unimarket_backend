import { and, eq, ilike, gte, lte, asc, desc, sql, inArray } from 'drizzle-orm';
import { ProductParamSchema } from './productSchema.js';
import { db } from '../config/db.js';
import { Products } from '../schema/Products.js';
import { NOT_FOUND } from '../constants/http.js';
import appAssert from '../utils/appAssert.js';
import { getObjectSignedUrl } from '../utils/s3Utils.js';
import { ProductQuerySchema } from './productSchema.js';
import { Wishlists } from '../schema/Wishlists.js';

export const getProduct = async (productId: ProductParamSchema) => {
  return await db.transaction(async (tx) => {
    const product = await tx.query.Products.findFirst({
      where: and(eq(Products.id, productId), eq(Products.visibility, true)),
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
      columns: {
        visibility: false,
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
  });
};

export const listProducts = async (query: ProductQuerySchema) => {
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

  return await db.transaction(async (tx) => {
    const products = await tx.query.Products.findMany({
      where,
      limit,
      offset,
      columns: {
        visibility: false,
      },
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

    const total = await tx.$count(Products, where);

    appAssert(products, NOT_FOUND, 'Products not found');

    // Get wishlist counts for all products in a single query
    const productIds = products.map((p) => p.id);
    const wishlistCounts = await tx
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
  });
};
