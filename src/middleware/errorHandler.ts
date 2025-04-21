import { Response, ErrorRequestHandler, NextFunction } from 'express';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../constants/http.js';
import { z } from 'zod';
import AppError from '../utils/AppError.js';
import { clearAuthCookies, REFRESH_PATH } from '../utils/cookies.js';
import multer from 'multer';

const handleMulterError = (res: Response, next: NextFunction, error: multer.MulterError) => {
  res.status(BAD_REQUEST).json({
    error,
  });
  next();
};

const handleZodError = (res: Response, next: NextFunction, error: z.ZodError) => {
  const errors = error.issues.map((err) => ({
    path: err.path.join(','),
    message: err.message,
  }));

  res.status(BAD_REQUEST).json({
    errors,
    message: error.message,
  });
  next();
};

const handleAppError = (res: Response, next: NextFunction, error: AppError) => {
  res.status(error.statusCode).json({
    message: error.message,
  });
  next();
};

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.log(`PATH: ${req.path}`, error);

  if (req.path === REFRESH_PATH) {
    clearAuthCookies(res);
  }
  if (error instanceof z.ZodError) {
    console.log(error);
    handleZodError(res, next, error);
    return;
  }

  if (error instanceof multer.MulterError) {
    console.log(error);
    handleMulterError(res, next, error);
    return;
  }

  if (error instanceof AppError) {
    console.log(error);
    handleAppError(res, next, error);
    return;
  }

  res.status(INTERNAL_SERVER_ERROR).send('Internal Server Error');
};

export default errorHandler;
