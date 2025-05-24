import { Router } from 'express';
import { getCategoryProductsHandler, listCategoriesHandler } from './categoryController.js';

export const publicCategoryRouter = Router();
export const categoryRouter = Router();

publicCategoryRouter.get('/', listCategoriesHandler);
publicCategoryRouter.get('/:id', getCategoryProductsHandler);
