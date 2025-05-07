import catchError from '../utils/cacheErrors.js';
import { approveStoreRequest, rejectStoreRequest } from './adminService.js';
import { rejectRequestSchema, storeRequestParamSchema } from './adminSchema.js';
import { OK } from '../constants/http.js';

export const approveStoreRequestHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const storeRequestId = req.params.id;

  // call service
  const { store, storeRequest } = await approveStoreRequest(userId, storeRequestId);

  // return response
  res.status(OK).json({ message: 'Store request approved successfully', storeRequest, store });
});

export const rejectStoreRequestHandler = catchError(async (req, res) => {
  // validate request
  const { userId } = req;
  const storeRequestId = storeRequestParamSchema.parse(req.params.id);
  const rejectionReason = rejectRequestSchema.parse(req.body);

  // call service
  const { store, storeRequest } = await rejectStoreRequest(userId, storeRequestId, rejectionReason);

  // return response
  res.status(OK).json({ message: 'Store request rejected successfully', storeRequest, store });
});
