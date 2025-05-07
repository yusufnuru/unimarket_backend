import catchError from '../utils/cacheErrors.js';
import { BAD_REQUEST, CREATED, OK } from '../constants/http.js';
import {
  createStoreSchema,
  updateStoreSchema,
  createProductSchema,
  addImageSchema,
  storeQuerySchema,
  updateProductSchema,
  updateImageSchema,
  createStoreRequestSchema,
} from './storeSchema.js';
import { productParamSchema } from '../types/global.js';
import {
  createProduct,
  createStore,
  deleteSellerStore,
  getSellerStore,
  getStore,
  listStores,
  updateStore,
  listSellerProducts,
  getSellerProduct,
  updateProduct,
  deleteSellerProduct,
  createRequest,
} from './storeService.js';
import appAssert from '../utils/appAssert.js';
import { storeParamSchema } from '../types/global.js';

export const listStoresHandler = catchError(async (req, res) => {
  const request = storeQuerySchema.parse(req.query);

  //call service
  const { stores } = await listStores(request);

  // return response
  res.status(OK).json({
    message: 'Stores fetched successfully',
    stores,
  });
});

export const getStoreHandler = catchError(async (req, res) => {
  const storeId = storeParamSchema.parse(req.params.id);

  //call service
  const { store } = await getStore(storeId);

  // return response
  res.status(OK).json({
    message: 'Store fetched successfully',
    store,
  });
});

export const registerStoreHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const request = createStoreSchema.parse(req.body);

  // call service
  const { newStore } = await createStore(request, userId);

  // return response
  res.status(CREATED).json({
    message: 'Store created successfully',
    store: newStore,
  });
});

export const createRequestHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const storeId = storeParamSchema.parse(req.params.id);
  const request = createStoreRequestSchema.parse(req.body);
  // call service
  const { store, newRequest } = await createRequest(userId, storeId, request);

  // return response
  res.status(OK).json({
    message: 'Store request created successfully',
    store,
    request: newRequest,
  });
});

export const updateStoreHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const storeId = storeParamSchema.parse(req.params.id);
  const request = updateStoreSchema.parse(req.body);

  // call service
  const { updatedStore } = await updateStore(request, userId, storeId);

  // return response
  res.status(OK).json({
    message: 'Store updated successfully',
    store: updatedStore,
  });
});

export const getSellerStoreHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const storeId = storeParamSchema.parse(req.params.id);

  // call service
  const { store } = await getSellerStore(storeId, userId);

  // return response
  res.status(OK).json({
    message: 'Store fetched successfully',
    store,
  });
});

export const deleteSellerStoreHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const storeId = storeParamSchema.parse(req.params.id);

  // call service
  const { deletedStore, deletedImageFolders } = await deleteSellerStore(storeId, userId);

  // return response
  res.status(OK).json({
    message: 'Store deleted successfully',
    store: deletedStore,
    ...deletedImageFolders,
  });
});

export const createProductHandler = catchError(async (req, res) => {
  const { userId } = req;
  const storeId = storeParamSchema.parse(req.params.id);
  const request = createProductSchema.parse(req.body);
  const imageFiles = (await addImageSchema.parseAsync(req.files)) as Express.Multer.File[];

  appAssert(imageFiles, BAD_REQUEST, 'Image files are required');

  // call service
  const { newProduct } = await createProduct(userId, storeId, request, imageFiles);

  // return response
  res.status(CREATED).json({
    message: 'Product created successfully',
    product: newProduct,
  });
});

export const listSellerProductsHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const storeId = storeParamSchema.parse(req.params.id);

  // call service
  const products = await listSellerProducts(storeId, userId);

  // return response
  res.status(OK).json({
    message: 'Products fetched successfully',
    products,
  });
});

export const getSellerProductHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const storeId = storeParamSchema.parse(req.params.id);
  const productId = storeParamSchema.parse(req.params.productId);

  // call service
  const { product } = await getSellerProduct(userId, storeId, productId);

  // return response
  res.status(OK).json({
    message: 'Product fetched successfully',
    product,
  });
});

export const updateProductHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const storeId = storeParamSchema.parse(req.params.id);
  const productId = productParamSchema.parse(req.params.productId);
  const request = updateProductSchema.parse(req.body);
  const imageFiles = (await updateImageSchema.parseAsync(req.files)) as Express.Multer.File[];

  // call service
  const { updatedProduct, deletedImagePaths, uploadedImagePaths } = await updateProduct(
    userId,
    storeId,
    productId,
    request,
    imageFiles,
  );

  // return response
  res.status(OK).json({
    message: 'Product updated successfully',
    product: updatedProduct,
    deleted: deletedImagePaths,
    added: uploadedImagePaths,
  });
});
export const deleteSellerProductHandler = catchError(async (req, res) => {
  //validate request
  const { userId } = req;
  const storeId = storeParamSchema.parse(req.params.id);
  const productId = productParamSchema.parse(req.params.productId);

  const { deletedProduct } = await deleteSellerProduct(userId, storeId, productId);

  // return response
  res.status(OK).json({
    message: 'Product deleted successfully',
    product: deletedProduct,
  });
});
