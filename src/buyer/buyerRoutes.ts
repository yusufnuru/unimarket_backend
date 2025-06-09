import { Router } from 'express';
import {
  addToWishListHandler,
  getWishListItemHandler,
  listWishListsHandler,
  removeWishListItemHandler,
} from './buyerController.js';

const buyerRoutes = Router();

buyerRoutes.post('/:id/wishlists/', addToWishListHandler);
buyerRoutes.get('/:id/wishlists/', listWishListsHandler);
buyerRoutes.get('/:id/wishlists/:productId', getWishListItemHandler);
buyerRoutes.delete('/:id/wishlists/:productId', removeWishListItemHandler);
export default buyerRoutes;
