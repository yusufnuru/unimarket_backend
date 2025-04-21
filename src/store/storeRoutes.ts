import { Router } from 'express';
import { authorizeRole } from '../middleware/authenticate.js';
import {
  createProductHandler,
  deleteSellerStoreHandler,
  getSellerStoreHandler,
  getStoreHandler,
  listSellerProductsHandler,
  listStoresHandler,
  registerStoreHandler,
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
storeRoutes.patch('/:id/seller', authorizeSeller, updateStoreHandler);
storeRoutes.get('/:id/seller', authorizeSeller, getSellerStoreHandler);
storeRoutes.delete('/:id/seller', authorizeSeller, deleteSellerStoreHandler);
storeRoutes.post('/:id/products', authorizeSeller, uploadMultipleImages(), createProductHandler);
storeRoutes.get('/:id/products', authorizeSeller, listSellerProductsHandler);
