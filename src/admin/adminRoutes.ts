import { Router } from 'express';
import {
  approveStoreRequestHandler,
  rejectStoreRequestHandler,
  reviewStoreProductsHandler,
  listWarningsHandler,
  listProductWarningsHandler,
  listStoreWarningsHandler,
  listReportsHandler,
  listStoreReportsHandler,
  listProductReportsHandler,
  listStoresAdminHandler,
  getStoreAdminHandler,
  getStoreProductAdminHandler,
  listStoreProductsAdminHandler,
  listStoreRequestsAdminHandler,
} from './adminController.js';

const adminRoutes = Router();

adminRoutes.patch('/:id/store-requests/:requestId/approve', approveStoreRequestHandler);
adminRoutes.patch('/:id/store-requests/:requestId/reject', rejectStoreRequestHandler);
adminRoutes.get('/:id/store-requests', listStoreRequestsAdminHandler);
adminRoutes.patch('/:id/review/stores/:storeId/products/:productId', reviewStoreProductsHandler);
adminRoutes.get('/:id/warnings', listWarningsHandler);
adminRoutes.get('/:id/warnings/products/:productId', listProductWarningsHandler);
adminRoutes.get('/:id/warnings/stores/:productId', listStoreWarningsHandler);
adminRoutes.get('/:id/reports', listReportsHandler);
adminRoutes.get('/:id/reports/stores/:storeId', listStoreReportsHandler);
adminRoutes.get('/:id/reports/products/:productId', listProductReportsHandler);
adminRoutes.get('/:id/stores', listStoresAdminHandler);
adminRoutes.get('/:id/stores/:storeId', getStoreAdminHandler);
adminRoutes.get('/:id/stores/:storeId/products/:productId', getStoreProductAdminHandler);
adminRoutes.get('/:id/store/:storeId/products/', listStoreProductsAdminHandler);

export default adminRoutes;
