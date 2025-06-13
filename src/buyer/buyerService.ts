import { BuyerParamSchema, CreateReportSchema } from './buyerSchema.js';
import { ProductParamSchema } from '../product/productSchema.js';
import { db } from '../config/db.js';
import { Profiles } from '../schema/Profiles.js';
import { Wishlists } from '../schema/Wishlists.js';
import { and, eq } from 'drizzle-orm';
import appAssert from '../utils/appAssert.js';
import { BAD_REQUEST, NOT_FOUND } from '../constants/http.js';
import { Products } from '../schema/Products.js';
import { getObjectSignedUrl } from '../utils/s3Utils.js';
import { Reports } from '../schema/Reports.js';

export const addToWishList = (
  userId: string,
  buyerId: BuyerParamSchema,
  productId: ProductParamSchema,
) => {
  return db.transaction(async (tx) => {
    const buyer = await tx.query.Profiles.findFirst({
      where: and(eq(Profiles.id, buyerId), eq(Profiles.userId, userId), eq(Profiles.role, 'buyer')),
    });

    appAssert(buyer, NOT_FOUND, 'Buyer not found');

    const product = await tx.query.Products.findFirst({
      where: and(eq(Products.id, productId), eq(Products.visibility, true)),
    });

    appAssert(product, NOT_FOUND, 'Product not found');

    const existingWishlist = await tx.query.Wishlists.findFirst({
      where: and(eq(Wishlists.buyerId, buyer.id), eq(Wishlists.productId, product.id)),
    });

    appAssert(!existingWishlist, BAD_REQUEST, 'Product already in wishlist');

    const newWishlist = await tx.insert(Wishlists).values({
      buyerId: buyer.id,
      productId: productId,
    });

    return {
      message: 'Product added to wishlist successfully',
      wishlist: newWishlist,
    };
  });
};

export const listWishLists = async (userId: string, buyerId: BuyerParamSchema) => {
  const buyer = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, buyerId), eq(Profiles.userId, userId), eq(Profiles.role, 'buyer')),
  });

  appAssert(buyer, NOT_FOUND, 'Buyer not found');

  const wishlists = await db.query.Wishlists.findMany({
    where: eq(Wishlists.buyerId, buyer.id),
    with: {
      product: {
        with: {
          images: true,
        },
      },
    },
  });

  appAssert(wishlists, NOT_FOUND, 'Wishlist not found');

  // Map wishlist items to include product images
  const wishlistsWithImages = await Promise.all(
    wishlists.map(async (wishlist) => {
      const productImages = await Promise.all(
        wishlist.product.images.map(async (image) => ({
          id: image.id,
          imageUrl: await getObjectSignedUrl(image.imageUrl),
        })),
      );

      return {
        ...wishlist,
        product: {
          ...wishlist.product,
          images: productImages,
        },
      };
    }),
  );

  appAssert(wishlistsWithImages, NOT_FOUND, 'Wishlist not found');

  return {
    wishlistsWithImages,
  };
};

export const getWishListItem = async (
  userId: string,
  buyerId: BuyerParamSchema,
  productId: ProductParamSchema,
) => {
  const buyer = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, buyerId), eq(Profiles.userId, userId), eq(Profiles.role, 'buyer')),
  });

  appAssert(buyer, NOT_FOUND, 'Buyer not found');

  const wishlistItem = await db.query.Wishlists.findFirst({
    where: and(eq(Wishlists.buyerId, buyer.id), eq(Wishlists.productId, productId)),
  });

  appAssert(wishlistItem, NOT_FOUND, 'Wishlist item not found');

  return wishlistItem;
};

export const removeWishListItem = async (
  userId: string,
  buyerId: BuyerParamSchema,
  productId: ProductParamSchema,
) => {
  const buyer = await db.query.Profiles.findFirst({
    where: and(eq(Profiles.id, buyerId), eq(Profiles.userId, userId), eq(Profiles.role, 'buyer')),
  });

  appAssert(buyer, NOT_FOUND, 'Buyer not found');

  const wishlistItem = await db.query.Wishlists.findFirst({
    where: and(eq(Wishlists.buyerId, buyer.id), eq(Wishlists.productId, productId)),
  });

  appAssert(wishlistItem, NOT_FOUND, 'Wishlist item not found');

  await db
    .delete(Wishlists)
    .where(and(eq(Wishlists.buyerId, buyer.id), eq(Wishlists.productId, productId)))
    .returning();

  return {
    message: 'Wishlist item removed successfully',
  };
};

export const createReport = async (
  userId: string,
  buyerId: BuyerParamSchema,
  request: CreateReportSchema,
) => {
  type Reason = 'spam' | 'scam' | 'offensive' | 'other';
  return db.transaction(async (tx) => {
    const buyer = await tx.query.Profiles.findFirst({
      where: and(eq(Profiles.id, buyerId), eq(Profiles.userId, userId), eq(Profiles.role, 'buyer')),
    });

    appAssert(buyer, NOT_FOUND, 'Buyer not found');

    const product = await tx.query.Products.findFirst({
      where: and(eq(Products.id, request.productId), eq(Products.visibility, true)),
    });

    appAssert(product, NOT_FOUND, 'Product not found');

    const existingReport = await tx.query.Reports.findFirst({
      where: and(eq(Reports.buyerId, buyer.id), eq(Reports.productId, product.id)),
    });

    appAssert(!existingReport, BAD_REQUEST, 'You have already reported this product');

    const newReport = await tx
      .insert(Reports)
      .values({
        buyerId: buyer.id,
        productId: product.id,
        reason: request.reason as Reason,
        description: request.description,
      })
      .returning();

    return {
      message: 'Report created successfully',
      report: newReport,
    };
  });
};
