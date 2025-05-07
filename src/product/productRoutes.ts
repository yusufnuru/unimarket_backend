import { Router } from 'express';
import { getProductHandler, listProductsHandler } from './productController.js';

export const publicProductRoutes = Router();
export const productRoutes = Router();

publicProductRoutes.get('/:id', getProductHandler);
publicProductRoutes.get('/', listProductsHandler);
