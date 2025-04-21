import catchError from '../utils/cacheErrors.js';
import { BAD_REQUEST, CREATED, OK } from '../constants/http.js';
import {
  createStoreSchema,
  storeParamSchema,
  updateStoreSchema,
  createProductSchema,
  addImageSchema,
  storeQuerySchema,
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
} from './storeService.js';
import appAssert from '../utils/appAssert.js';

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
  const { deletedStore,deletedImageFolders } = await deleteSellerStore(storeId, userId);

  // return response
  res.status(OK).json({
    message: 'Store deleted successfully',
    store: deletedStore,
    deletedProduct: deletedImageFolders,
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

// export const getProductHandler = catchError(async (req, res) => {
//   // validate request
//   const { userId } = req;
//   const storeId = storeParamSchema.parse(req.params.id);
//   const productId = storeParamSchema.parse(req.params.productId);
//
//   // call service
//   const { product } = await getSellerProduct(productId, storeId, userId);
//
//   // return response
//   res.status(OK).json({
//     message: 'Product fetched successfully',
//     product,
//   });
// });
// export const updateProductHandler = catchError(async (req, res) => {})
// export const deleteProductHandler = catchError(async (req, res) => {})
