import { db } from '../config/db.js';
import { and, asc, desc, eq, ilike, inArray } from 'drizzle-orm';
import { Profiles } from '../schema/Profiles.js';
import appAssert from '../utils/appAssert.js';
import { BAD_REQUEST, CONFLICT, FORBIDDEN, NOT_FOUND } from '../constants/http.js';
import { Stores } from '../schema/Stores.js';
import { StoreRequests } from '../schema/StoreRequest.js';
import {
  createStoreSchema,
  storeQuerySchema,
  updateStoreSchema,
  createProductSchema,
  updateProductSchema,
  createStoreRequestSchema,
} from './storeSchema.js';
import { productParamSchema } from '../types/global.js';
import { ProductImages, Products } from '../schema/Products.js';
import {
  checkFolderExists,
  deleteFile,
  deleteFolder,
  getObjectSignedUrl,
  uploadFile,
} from '../utils/s3Utils.js';
import sanitize from 'sanitize-filename';
import { imageFileBuffer } from '../utils/imageFile.js';
import { Categories } from '../schema/Categories.js';
import { TransactionType, storeParamSchema } from '../types/global.js';

/**
 * Helper function to get authorized seller and their store
 * @param tx - Database transaction
 * @param userId - ID of the user
 * @param storeId - Optional store ID to verify ownership
 * @returns Object containing seller and store
 */

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

    appAssert(newStore, NOT_FOUND, 'Store creation failed');

    const [newRequest] = await tx
      .insert(StoreRequests)
      .values({
        requestMessage: storeDto.requestMessage,
        storeId: newStore.id,
      })
      .returning();

    appAssert(newRequest, NOT_FOUND, 'Store Request creation failed');

    return { newStore };
  });
};

export const createRequest = async (
  userId: string,
  storeId: storeParamSchema,
  request: createStoreRequestSchema,
) => {
  return await db.transaction(async (tx) => {
    const { store } = await getAuthorizedSellerAndStore(tx, userId, storeId);

    const existingRequest = await tx.query.StoreRequests.findFirst({
      where: and(eq(StoreRequests.storeId, store.id), eq(StoreRequests.requestStatus, 'pending')),
    });

    appAssert(!existingRequest, CONFLICT, 'Request already exists');

    const [newRequest] = await tx
      .insert(StoreRequests)
      .values({
        requestMessage: request.requestMessage,
        storeId: store.id,
      })
      .returning();

    appAssert(newRequest, NOT_FOUND, 'Request creation failed');

    return { store, newRequest };
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

export const createProduct = async (
  userId: string,
  storeId: storeParamSchema,
  productDto: createProductSchema,
  imageFiles: Express.Multer.File[],
) => {
  return await db.transaction(async (tx) => {
    const { store } = await getAuthorizedSellerAndStore(tx, userId, storeId);

    appAssert(store.storeStatus === 'active', FORBIDDEN, 'Store is not active');

    const categoryExists = await tx.query.Categories.findFirst({
      where: eq(Categories.id, productDto.category),
    });

    appAssert(categoryExists, NOT_FOUND, 'Category not found');

    const [newProduct] = await tx
      .insert(Products)
      .values({
        storeId: store.id,
        productName: productDto.name,
        description: productDto.description,
        price: productDto.price,
        categoryId: productDto.category,
        quantity: productDto.quantity,
      })
      .returning();

    const uploadImages = async (): Promise<string[]> => {
      const filePath = `products/${newProduct.id}/images`;
      const folderExist = await checkFolderExists(filePath);

      appAssert(!folderExist, CONFLICT, 'Product already exists');
      try {
        const uploadPromises = imageFiles.map(async (file) => {
          const imageName = `${newProduct.id}-img-${Date.now()}-${sanitize(file.originalname)}`;
          const buffer = await imageFileBuffer(file.buffer);
          const fullPath = `${filePath}/${imageName}`;

          await uploadFile(buffer, imageName, file.mimetype, filePath);

          return `${fullPath}`;
        });
        return await Promise.all(uploadPromises);
      } catch (error) {
        console.error('Error uploading file', error);
        await deleteFolder(filePath);
        const errorMessage = error instanceof Error ? error.message : String(error);
        appAssert(false, BAD_REQUEST, `Failed to upload file: ${errorMessage}`);
      }
    };

    const uploadedImages = await uploadImages();
    appAssert(uploadedImages.length > 0, NOT_FOUND, 'Uploaded images not found');

    const images = await tx
      .insert(ProductImages)
      .values(
        uploadedImages.map((file: string) => ({
          productId: newProduct.id,
          imageUrl: file,
        })),
      )
      .returning();

    return {
      newProduct: {
        newProduct,
        images,
      },
    };
  });
};

export const listSellerProducts = async (storeId: storeParamSchema, userId: string) => {
  return await db.transaction(async (tx) => {
    const { store } = await getAuthorizedSellerAndStore(tx, userId, storeId);

    const products = await tx.query.Products.findMany({
      where: eq(Products.storeId, store.id),
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

    appAssert(products.length > 0, NOT_FOUND, 'Products not found');

    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        return {
          ...product,
          images: await Promise.all(
            product.images.map(async (image) => ({
              id: image.id,
              imageUrl: await getObjectSignedUrl(image.imageUrl),
            })),
          ),
        };
      }),
    );

    appAssert(productsWithImages.length > 0, NOT_FOUND, 'Products not found');

    return { products: productsWithImages };
  });
};

export const getSellerProduct = async (
  userId: string,
  storeId: storeParamSchema,
  productId: productParamSchema,
) => {
  return await db.transaction(async (tx) => {
    const { store } = await getAuthorizedSellerAndStore(tx, userId, storeId);

    const product = await tx.query.Products.findFirst({
      where: and(eq(Products.id, productId), eq(Products.storeId, store.id)),
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

    return { product: productWithImages };
  });
};

export const updateProduct = async (
  userId: string,
  storeId: storeParamSchema,
  productId: productParamSchema,
  productDto: updateProductSchema,
  imageFiles: Express.Multer.File[],
) => {
  return await db.transaction(async (tx) => {
    const { store } = await getAuthorizedSellerAndStore(tx, userId, storeId);
    const [updatedProduct] = await tx
      .update(Products)
      .set({
        productName: productDto.name,
        description: productDto.description,
        price: productDto.price as number,
        categoryId: productDto.category,
        quantity: productDto.quantity as number,
      })
      .where(and(eq(Products.id, productId), eq(Products.storeId, store.id)))
      .returning();

    appAssert(updatedProduct, NOT_FOUND, 'Product not found');

    const filePath = `products/${updatedProduct.id}/images`;

    const deletedImagePaths: string[] = [];
    const uploadedImagePaths: string[] = [];

    if (productDto.imagesToRemove && productDto.imagesToRemove?.length > 0) {
      console.log(productDto.imagesToRemove);
      const imagesToDelete = await tx.query.ProductImages.findMany({
        where: and(
          eq(ProductImages.productId, updatedProduct.id),
          inArray(ProductImages.imageUrl, productDto.imagesToRemove),
        ),
      });
      appAssert(imagesToDelete.length > 0, NOT_FOUND, 'Images not found');

      for (const image of imagesToDelete) {
        await deleteFile(image.imageUrl);
        deletedImagePaths.push(image.imageUrl);
      }

      const deletedImages = await tx
        .delete(ProductImages)
        .where(
          and(
            eq(ProductImages.productId, updatedProduct.id),
            inArray(ProductImages.imageUrl, productDto.imagesToRemove),
          ),
        )
        .returning();

      appAssert(deletedImages.length > 0, NOT_FOUND, 'Image not found');
    }

    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const imageName = `${updatedProduct.id}-img-${Date.now()}-${sanitize(file.originalname)}`;
        const buffer = await imageFileBuffer(file.buffer);
        const fullPath = `${filePath}/${imageName}`;

        await uploadFile(buffer, imageName, file.mimetype, filePath);
        uploadedImagePaths.push(fullPath);
      }

      appAssert(uploadedImagePaths.length > 0, BAD_REQUEST, 'Image upload failed');

      const uploadImages = await tx
        .insert(ProductImages)
        .values(
          uploadedImagePaths.map((url) => ({
            productId: updatedProduct.id,
            imageUrl: url,
          })),
        )
        .returning();
      appAssert(uploadImages.length > 0, NOT_FOUND, 'Image upload failed');
    }
    return { updatedProduct, uploadedImagePaths, deletedImagePaths };
  });
};

export const deleteSellerProduct = async (
  userId: string,
  storeId: storeParamSchema,
  productId: productParamSchema,
) => {
  return await db.transaction(async (tx) => {
    const { store } = await getAuthorizedSellerAndStore(tx, userId, storeId);

    const [deletedProduct] = await tx
      .delete(Products)
      .where(and(eq(Products.id, productId), eq(Products.storeId, store.id)))
      .returning();

    appAssert(deletedProduct, NOT_FOUND, 'Product not found');
    const folderPath = `products/${deletedProduct.id}`;
    const folderExist = await checkFolderExists(folderPath);
    appAssert(folderExist, NOT_FOUND, 'Product folder not found');
    await deleteFolder(folderPath);

    return { deletedProduct, deletedFolderPath: folderPath };
  });
};
