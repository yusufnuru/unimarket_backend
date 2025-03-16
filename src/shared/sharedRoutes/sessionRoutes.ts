import { Router } from 'express';
import {
  getSessionHandler,
  deleteSessionHandler,
} from '@shared/sharedController/sessionController.js';

export const sessionRoutes = Router();

sessionRoutes.get('/', getSessionHandler);
sessionRoutes.delete('/:id', deleteSessionHandler);
