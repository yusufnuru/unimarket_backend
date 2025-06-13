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
  storeParamSchema,
} from './storeSchema.js';
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
  listRequest,
} from './storeService.js';
import appAssert from '../utils/appAssert.js';
import { productQuerySchema, productParamSchema } from '../product/productSchema.js';

export const listStoresHandler = catchError(async (req, res) => {
  const request = storeQuerySchema.parse(req.query);

  //call service
  const { stores } = await listStores(request);

  // return response
  res.status(OK).json({ message: 'Stores fetched successfully', stores });
});

export const getStoreHandler = catchError(async (req, res) => {
  const storeId = storeParamSchema.parse(req.params.id);

  //call service
  const { store } = await getStore(storeId);

  // return response
  res.status(OK).json({ message: 'Store fetched successfully', store });
});

export const registerStoreHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const request = createStoreSchema.parse(req.body);

  // call service
  const { newStore, newRequest } = await createStore(request, userId);

  // return response
  res.status(CREATED).json({
    message: 'Store created successfully',
    store: newStore,
    request: newRequest,
  });
});

export const createRequestHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const storeId = storeParamSchema.parse(req.params.id);
  const request = createStoreRequestSchema.parse(req.body);
  // call service
  const { newRequest } = await createRequest(userId, storeId, request);

  // return response
  res.status(OK).json({
    message: 'Store request created successfully',
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

  // call service
  const { store } = await getSellerStore(userId);

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
  res.status(CREATED).json({ message: 'Product created successfully', product: newProduct });
});

export const listSellerProductsHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const storeId = storeParamSchema.parse(req.params.id);
  const request = productQuerySchema.parse(req.query);

  // call service
  const { products, pagination } = await listSellerProducts(storeId, userId, request);

  // return response
  res.status(OK).json({ message: 'Products fetched successfully', products, pagination });
});

export const getSellerProductHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const storeId = storeParamSchema.parse(req.params.id);
  const productId = storeParamSchema.parse(req.params.productId);

  // call service
  const { product } = await getSellerProduct(userId, storeId, productId);

  // return response
  res.status(OK).json({ message: 'Product fetched successfully', product });
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
  res.status(OK).json({ message: 'Product deleted successfully', product: deletedProduct });
});

export const listRequestHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const storeId = storeParamSchema.parse(req.params.id);
  const request = storeQuerySchema.parse(req.query);

  // call service
  const { requests, pagination } = await listRequest(userId, storeId, request);

  // return response
  res.status(OK).json({ message: 'Requests fetched successfully', requests, pagination });
});
