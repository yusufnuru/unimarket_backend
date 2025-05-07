import { Router } from 'express';
import { approveStoreRequestHandler, rejectStoreRequestHandler } from './adminController.js';

const adminRoutes = Router();

adminRoutes.patch('/store-requests/:id/approve', approveStoreRequestHandler);
adminRoutes.patch('/store-requests/:id/reject', rejectStoreRequestHandler);

export default adminRoutes;
