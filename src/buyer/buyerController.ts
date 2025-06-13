import catchError from '../utils/cacheErrors.js';
import { productParamSchema, type ProductParamSchema } from '../product/productSchema.js';
import { buyerParamSchema, createReportSchema } from './buyerSchema.js';
import {
  addToWishList,
  createReport,
  getWishListItem,
  listWishLists,
  removeWishListItem,
} from './buyerService.js';
import { CREATED } from '../constants/http.js';

export const addToWishListHandler = catchError(async (req, res) => {
  interface RequestBody {
    productId: ProductParamSchema;
  }
  // validate request
  const { userId } = req;
  const buyerId = buyerParamSchema.parse(req.params.id);
  const productId = productParamSchema.parse((req.body as RequestBody).productId);

  // call service
  const { message, wishlist } = await addToWishList(userId, buyerId, productId);

  // return response
  res.status(CREATED).json({
    message,
    wishlist,
  });
});

export const listWishListsHandler = catchError(async (req, res) => {
  const userId = req.userId;
  const buyerId = buyerParamSchema.parse(req.params.id);

  // call service to list wishlists
  const { wishlistsWithImages } = await listWishLists(userId, buyerId);

  // return response
  res.status(CREATED).json({
    message: 'Wishlists retrieved successfully',
    wishlists: wishlistsWithImages,
  });
});

export const getWishListItemHandler = catchError(async (req, res) => {
  const userId = req.userId;
  const buyerId = buyerParamSchema.parse(req.params.id);
  const productId = productParamSchema.parse(req.params.productId);

  // call service to get wishlist item
  const wishlistItem = await getWishListItem(userId, buyerId, productId);

  // return response
  res.status(CREATED).json({
    message: 'Wishlist item retrieved successfully',
    wishlistItem,
  });
});

export const removeWishListItemHandler = catchError(async (req, res) => {
  const userId = req.userId;
  const buyerId = buyerParamSchema.parse(req.params.id);
  const productId = productParamSchema.parse(req.params.productId);

  // call service to remove wishlist item
  const { message } = await removeWishListItem(userId, buyerId, productId);

  // return response
  res.status(CREATED).json({
    message,
  });
});

export const createReportHandler = catchError(async (req, res) => {
  const userId = req.userId;
  const buyerId = buyerParamSchema.parse(req.params.id);
  const request = createReportSchema.parse(req.body);

  // call service
  const { message, report } = await createReport(userId, buyerId, request);

  // return response
  res.status(CREATED).json({
    message,
    report,
  });
});
