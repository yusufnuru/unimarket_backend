import catchError from '../utils/cacheErrors.js';
import appAssert from '../utils/appAssert.js';
import { CREATED, FORBIDDEN, OK } from '../constants/http.js';
import { createStoreSchema, storeParamSchema, updateStoreSchema } from './storeSchema.js';
import {
  createStore,
  deleteSellerStore,
  getSellerStore,
  updateSellerStore,
} from './storeService.js';

export const registerStoreHandler = catchError(async (req, res) => {
  // validate request
  const { userId, role } = req;
  appAssert(role || userId, FORBIDDEN, 'You are not authorized to create a store');

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
  const { userId, role } = req;
  appAssert(role || userId, FORBIDDEN, 'You are not authorized to update the store');

  const storeId = storeParamSchema.parse(req.params.id);
  const request = updateStoreSchema.parse(req.body);

  // call service
  const { updatedStore } = await updateSellerStore(request, userId, storeId);

  // return response
  res.status(OK).json({
    message: 'Store updated successfully',
    store: updatedStore,
  });
});

export const getSellerStoreHandler = catchError(async (req, res) => {
  // validate request
  const { userId, role } = req;
  appAssert(role || userId, FORBIDDEN, 'You are not authorized to update the store');

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
  const { userId, role } = req;
  appAssert(role || userId, FORBIDDEN, 'You are not authorized to access the store');

  const storeId = storeParamSchema.parse(req.params.id);

  // call service
  const { deletedStore } = await deleteSellerStore(storeId, userId);

  // return response
  res.status(OK).json({
    message: 'Store deleted successfully',
    store: deletedStore,
  });
});
