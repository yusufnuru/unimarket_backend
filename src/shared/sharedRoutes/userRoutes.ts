import { Router } from 'express';
import { getUserHandler } from '@shared/sharedController/userController.js';

export const userRoutes = Router();
userRoutes.get('/', getUserHandler);
