import catchError from '../utils/cacheErrors.js';
import {
  approveStoreRequest,
  getProductAdmin,
  getStoreAdmin,
  listProductReports,
  listProductWarnings,
  listReports,
  listStoreProductsAdmin,
  listStoreReports,
  listStoreRequestsAdmin,
  listStoresAdmin,
  listStoreWarnings,
  listWarnings,
  rejectStoreRequest,
  reviewStoreProducts,
} from './adminService.js';
import {
  adminParamSchema,
  adminStoreQuerySchema,
  createWarningSchema,
  rejectRequestSchema,
  storeRequestParamSchema,
} from './adminSchema.js';
import { OK } from '../constants/http.js';
import { storeParamSchema, storeRequestQuerySchema } from '../store/storeSchema.js';
import { productParamSchema, productQuerySchema } from '../product/productSchema.js';

export const approveStoreRequestHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const adminId = adminParamSchema.parse(req.params.id);
  const storeRequestId = storeRequestParamSchema.parse(req.params.requestId);

  // call service
  const { store, storeRequest } = await approveStoreRequest(userId, adminId, storeRequestId);

  // return response
  res.status(OK).json({ message: 'Store request approved successfully', storeRequest, store });
});

export const rejectStoreRequestHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const adminId = adminParamSchema.parse(req.params.id);
  const storeRequestId = storeRequestParamSchema.parse(req.params.requestId);
  const rejectionReason = rejectRequestSchema.parse(req.body);

  // call service
  const { store, storeRequest } = await rejectStoreRequest(
    userId,
    adminId,
    storeRequestId,
    rejectionReason,
  );

  // return response
  res.status(OK).json({ message: 'Store request rejected successfully', storeRequest, store });
});

export const reviewStoreProductsHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const adminId = adminParamSchema.parse(req.params.id);
  const storeId = storeParamSchema.parse(req.params.storeId);
  const productId = productParamSchema.parse(req.params.productId);
  const request = createWarningSchema.parse(req.body);

  // call service to create warning
  const { store, product, warning } = await reviewStoreProducts(
    userId,
    adminId,
    storeId,
    productId,
    request,
  );

  // return response
  res.status(OK).json({ message: 'Warning created successfully', product, warning, store });
});

export const listWarningsHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const adminId = adminParamSchema.parse(req.params.id);

  // call service to list warnings
  const warnings = await listWarnings(userId, adminId);

  // return response
  res.status(OK).json({ message: 'Warnings retrieved successfully', warnings });
});

export const listProductWarningsHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const adminId = adminParamSchema.parse(req.params.id);
  const productId = productParamSchema.parse(req.params.productId);

  // call service to list product warnings
  const warnings = await listProductWarnings(userId, adminId, productId);

  // return response
  res.status(OK).json({ message: 'Product warnings retrieved successfully', warnings });
});

export const listStoreWarningsHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const adminId = adminParamSchema.parse(req.params.id);

  const storeId = storeParamSchema.parse(req.params.storeId);

  // call service to list store warnings
  const warnings = await listStoreWarnings(userId, adminId, storeId);

  // return response
  res.status(OK).json({ message: 'Store warnings retrieved successfully', warnings });
});

export const listReportsHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const adminId = adminParamSchema.parse(req.params.id);

  // call service to list reports
  const reports = await listReports(userId, adminId);

  // return response
  res.status(OK).json({ message: 'Reports retrieved successfully', reports });
});

export const listStoreReportsHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const adminId = adminParamSchema.parse(req.params.id);
  const storeId = storeParamSchema.parse(req.params.storeId);

  // call service to list store reports
  const storeProductsReport = await listStoreReports(userId, adminId, storeId);

  // return response
  res.status(OK).json({ message: 'Store reports retrieved successfully', storeProductsReport });
});

export const listProductReportsHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const adminId = adminParamSchema.parse(req.params.id);
  const productId = productParamSchema.parse(req.params.productId);

  // call service to list product reports
  const reports = await listProductReports(userId, adminId, productId);

  // return response
  res.status(OK).json({ message: 'Product reports retrieved successfully', reports });
});

export const listStoresAdminHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const adminId = adminParamSchema.parse(req.params.id);
  const request = adminStoreQuerySchema.parse(req.query);

  // call service to list stores
  const stores = await listStoresAdmin(userId, adminId, request);

  // return response
  res.status(OK).json({ message: 'Stores retrieved successfully', stores });
});

export const getStoreAdminHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const adminId = adminParamSchema.parse(req.params.id);
  const storeId = storeParamSchema.parse(req.params.storeId);

  // call service to get store
  const store = await getStoreAdmin(userId, adminId, storeId);

  // return response
  res.status(OK).json({ message: 'Store retrieved successfully', store });
});

export const getStoreProductAdminHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const adminId = adminParamSchema.parse(req.params.id);
  const storeId = storeParamSchema.parse(req.params.storeId);
  const productId = productParamSchema.parse(req.params.productId);

  // call service to get product
  const { product } = await getProductAdmin(userId, adminId, storeId, productId);

  // return response
  res.status(OK).json({ message: 'Product retrieved successfully', product });
});

export const listStoreProductsAdminHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const adminId = adminParamSchema.parse(req.params.id);
  const storeId = storeParamSchema.parse(req.params.storeId);
  const request = productQuerySchema.parse(req.query);

  // call service to list store products
  const { products, pagination } = await listStoreProductsAdmin(userId, adminId, storeId, request);

  // return response
  res.status(OK).json({ message: 'Store products retrieved successfully', products, pagination });
});

export const listStoreRequestsAdminHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const adminId = adminParamSchema.parse(req.params.id);
  const request = storeRequestQuerySchema.parse(req.query);

  // call service to list store requests
  const { storeRequests, pagination } = await listStoreRequestsAdmin(userId, adminId, request);

  // return response
  res
    .status(OK)
    .json({ message: 'Store requests retrieved successfully', storeRequests, pagination });
});
