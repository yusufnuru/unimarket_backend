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
  getProductAdminHandler,
  listStoreProductsAdminHandler,
  listProductsAdminHandler,
  listStoreRequestsAdminHandler,
  getStoreRequestAdminHandler,
  listStoreRequestsByStoreHandler,
  restoreStoreProductsHandler,
} from './adminController.js';

const adminRoutes = Router();

adminRoutes.patch('/:id/store-requests/:requestId/approve', approveStoreRequestHandler);
adminRoutes.patch('/:id/store-requests/:requestId/reject', rejectStoreRequestHandler);
adminRoutes.get('/:id/store-requests', listStoreRequestsAdminHandler);
adminRoutes.get('/:id/store-requests/:requestId', getStoreRequestAdminHandler);
adminRoutes.patch('/:id/review/stores/:storeId/products/:productId', reviewStoreProductsHandler);
adminRoutes.patch('/:id/restore/stores/:storeId/products/:productId', restoreStoreProductsHandler);
adminRoutes.get('/:id/stores/:storedId/store-requests', listStoreRequestsByStoreHandler);
adminRoutes.get('/:id/warnings', listWarningsHandler);
adminRoutes.get('/:id/warnings/products/:productId', listProductWarningsHandler);
adminRoutes.get('/:id/warnings/stores/:productId', listStoreWarningsHandler);
adminRoutes.get('/:id/reports', listReportsHandler);
adminRoutes.get('/:id/reports/stores/:storeId', listStoreReportsHandler);
adminRoutes.get('/:id/reports/products/:productId', listProductReportsHandler);
adminRoutes.get('/:id/stores', listStoresAdminHandler);
adminRoutes.get('/:id/stores/:storeId', getStoreAdminHandler);
adminRoutes.get('/:id/products/:productId', getProductAdminHandler);
adminRoutes.get('/:id/stores/:storeId/products/', listStoreProductsAdminHandler);
adminRoutes.get('/:id/products', listProductsAdminHandler);

export default adminRoutes;
