import { Router } from 'express';
import { authorizeRole } from '../middleware/authenticate.js';
import {
  deleteSellerStoreHandler,
  getSellerStoreHandler,
  registerStoreHandler,
  updateStoreHandler,
} from './storeController.js';

const authorizeSeller = authorizeRole(['seller']);

const storeRoutes = Router();

storeRoutes.post('/create', authorizeSeller, registerStoreHandler);
storeRoutes.patch('/:id/seller', authorizeSeller, updateStoreHandler);
storeRoutes.get('/:id/seller', authorizeSeller, getSellerStoreHandler);
storeRoutes.delete('/:id/seller', authorizeSeller, deleteSellerStoreHandler);

export default storeRoutes;
