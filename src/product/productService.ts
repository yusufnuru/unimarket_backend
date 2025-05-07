import { and, eq, ilike, gte, lte, asc, desc } from 'drizzle-orm';
import { productParamSchema } from '../types/global.js';
import { db } from '../config/db.js';
import { Products } from '../schema/Products.js';
import { NOT_FOUND } from '../constants/http.js';
import appAssert from '../utils/appAssert.js';
import { getObjectSignedUrl } from '../utils/s3Utils.js';
import { productQuerySchema } from './productSchema.js';

export const getProduct = async (productId: productParamSchema) => {
  const product = await db.query.Products.findFirst({
    where: and(eq(Products.id, productId), eq(Products.visibility, true)),
    with: {
      category: true,
      images: true,
    },
  });

  appAssert(product, NOT_FOUND, 'Product not found');

  const productWithImages = {
    ...product,
    images: await Promise.all(
      product.images.map(async (image) => ({
        id: image.id,
        imageUrl: await getObjectSignedUrl(image.imageUrl),
      })),
    ),
  };

  appAssert(productWithImages, NOT_FOUND, 'Product not found');

  return {
    product: productWithImages,
  };
};

export const listProducts = async (query: productQuerySchema) => {
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
    limit,
    offset,
    with: {
      images: true,
    },
  });

  const total = await db.$count(Products, where);

  appAssert(products, NOT_FOUND, 'Products not found');

  const productsWithImages = await Promise.all(
    products.map(async (product) => ({
      ...product,
      images: await Promise.all(
        product.images.map(async (image) => ({
          id: image.id,
          imageUrl: await getObjectSignedUrl(image.imageUrl),
        })),
      ),
    })),
  );

  appAssert(productsWithImages, NOT_FOUND, 'Products not found');

  return {
    products: productsWithImages,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};
