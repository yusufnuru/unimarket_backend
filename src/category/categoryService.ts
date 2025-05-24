import { db } from '../config/db.js';
import { CategoryParamSchema } from './categorySchema.js';
import { ProductQuerySchema } from '../product/productSchema.js';
import { and, asc, desc, eq, gte, ilike, lte } from 'drizzle-orm';
import { Products } from '../schema/Products.js';
import { NOT_FOUND } from '../constants/http.js';
import appAssert from '../utils/appAssert.js';
import { getObjectSignedUrl } from '../utils/s3Utils.js';
import { Categories } from '../schema/Categories.js';

export const listCategories = async () => {
  return db.transaction(async (transaction) => {
    const categories = await transaction.query.Categories.findMany({
      orderBy: (categories, { asc }) => asc(categories.name),
      with: {
        products: {
          columns: {
            id: true,
          },
        },
      },
    });

    const categoriesWithCount = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      productCount: category.products.length,
    }));

    return { categories: categoriesWithCount };
  });
};

export const getCategoryProducts = async (
  category: CategoryParamSchema,
  query: ProductQuerySchema,
) => {
  const { page, limit, search, storeId, maxPrice, minPrice, sortBy, sortOrder } = query;
  const offset = (page - 1) * limit;

  let { categoryId } = query;
  categoryId = category;
  appAssert(categoryId, NOT_FOUND, 'Category not found');

  const whereConditions = [eq(Products.visibility, true), eq(Products.categoryId, categoryId)];
  if (search) {
    whereConditions.push(ilike(Products.productName, `%${search}%`));
  }
  if (storeId) {
    whereConditions.push(eq(Products.storeId, storeId));
  }
  if (minPrice !== undefined) {
    whereConditions.push(gte(Products.price, minPrice));
  }
  if (maxPrice !== undefined) {
    whereConditions.push(lte(Products.price, maxPrice));
  }

  const where = and(...whereConditions);

  return db.transaction(async (tx) => {
    const categoryInfo = await tx.query.Categories.findFirst({
      where: eq(Categories.id, categoryId),
      columns: {
        id: true,
        name: true,
      },
    });

    appAssert(categoryInfo, NOT_FOUND, 'Category not found');

    const categoryProducts = await tx.query.Products.findMany({
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
      },
    });

    const total = await tx.$count(Products, where);

    appAssert(categoryProducts, NOT_FOUND, 'Products not found');

    const categoryProductsWithImages = await Promise.all(
      categoryProducts.map(async (product) => ({
        ...product,
        images: await Promise.all(
          product.images.map(async (image) => ({
            id: image.id,
            imageUrl: await getObjectSignedUrl(image.imageUrl),
          })),
        ),
      })),
    );

    appAssert(categoryProductsWithImages, NOT_FOUND, 'Products not found');
    return {
      category: categoryInfo,
      products: categoryProductsWithImages,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  });
};
