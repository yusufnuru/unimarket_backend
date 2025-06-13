import { Router } from 'express';
import { getSessionHandler, deleteSessionHandler } from './sharedController.js';
import { getUserHandler } from './sharedController.js';

export const sessionRoutes = Router();
sessionRoutes.get('/', getSessionHandler);
sessionRoutes.delete('/:id', deleteSessionHandler);

export const userRoutes = Router();
userRoutes.get('/', getUserHandler);
