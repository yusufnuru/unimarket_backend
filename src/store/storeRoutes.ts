import { Router } from 'express';
import { authorizeRole } from '../middleware/authenticate.js';
import {
  createProductHandler,
  createRequestHandler,
  deleteSellerProductHandler,
  deleteSellerStoreHandler,
  getSellerProductHandler,
  getSellerStoreHandler,
  getStoreHandler,
  listRequestHandler,
  listSellerProductsHandler,
  listStoresHandler,
  registerStoreHandler,
  updateProductHandler,
  updateStoreHandler,
} from './storeController.js';
import { uploadMultipleImages } from '../middleware/multer.js';

const authorizeSeller = authorizeRole(['seller']);
export const storeRoutes = Router();
export const publicStoreRoutes = Router();

// public routes
publicStoreRoutes.get('', listStoresHandler);
publicStoreRoutes.get('/:id', getStoreHandler);

//seller routes
storeRoutes.post('/create', authorizeSeller, registerStoreHandler);
storeRoutes.post('/:id/request', authorizeSeller, createRequestHandler);
storeRoutes.get('/:id/request', authorizeSeller, listRequestHandler);
storeRoutes.patch('/:id', authorizeSeller, updateStoreHandler);
storeRoutes.get('/', authorizeSeller, getSellerStoreHandler);
storeRoutes.delete('/:id', authorizeSeller, deleteSellerStoreHandler);
storeRoutes.post('/:id/products', authorizeSeller, uploadMultipleImages(), createProductHandler);
storeRoutes.get('/:id/products', authorizeSeller, listSellerProductsHandler);
storeRoutes.get('/:id/products/:productId', authorizeSeller, getSellerProductHandler);
storeRoutes.patch(
  '/:id/products/:productId',
  authorizeSeller,
  uploadMultipleImages(),
  updateProductHandler,
);
storeRoutes.delete('/:id/products/:productId', authorizeSeller, deleteSellerProductHandler);
