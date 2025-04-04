import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './auth/authRoutes.js';
import { authenticate, authorizeRole } from './middleware/authenticate.js';
import { userRoutes, sessionRoutes } from './shared/sharedRoutes.js';
import storeRoutes from './store/storeRoutes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(cookieParser());

// Routes
// auth routes
app.use('/api/auth', authRoutes);

// protected routes
app.use('/api/user', authenticate, authorizeRole(['admin', 'seller', 'buyer']), userRoutes);
app.use('/api/sessions', authenticate, authorizeRole(['admin', 'seller', 'buyer']), sessionRoutes);
app.use('/api/store', authenticate, storeRoutes);

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
