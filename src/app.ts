import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { APP_ORIGIN } from '@src/constants/env.js';
import errorHandler from '@middleware/errorHandler.js';
import authRoutes from '@auth/authRoutes.js';
import { authenticate, authorizeRole } from '@middleware/authenticate.js';
import { userRoutes } from '@shared/sharedRoutes/userRoutes.js';
import { sessionRoutes } from '@shared/sharedRoutes/sessionRoutes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: APP_ORIGIN,
    credentials: true,
  }),
);
app.use(cookieParser());

// Routes
// auth routes
app.use('/auth', authRoutes);
app.use('/auth', authRoutes);

// protected routes
app.use('/user', authenticate, authorizeRole(['admin', 'seller', 'buyer']), userRoutes);

app.use('/sessions', authenticate, authorizeRole(['admin', 'seller', 'buyer']), sessionRoutes);

app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  console.log('Request originalUrl:', req.originalUrl);
  console.log('Request baseUrl:', req.baseUrl);
  console.log('Request path:', req.path);
  console.log('Cookies:', req.cookies);
  next();
});
app.use(errorHandler);

export default app;
