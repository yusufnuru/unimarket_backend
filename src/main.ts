import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectToDatabase from './config/db';
import { NODE_ENV, APP_ORIGIN, PORT } from './constants/env';
import errorHandler from './middleware/errorHandler';
import authRoutes from './auth/authRoutes';
<<<<<<< HEAD
=======
import { authenticate, authorizeRole } from './middleware/authenticate';
import userRoutes from './user/shared/sharedRoutes';
>>>>>>> 034d025 (feat: enhance server setup with CORS, cookie parsing, and structured routing)
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors({
  origin: APP_ORIGIN,
  credentials: true,
}));
app.use(cookieParser());

<<<<<<< HEAD
app.use('/auth', authRoutes);

=======
// Routes
// auth routes
app.use('/auth', authRoutes);

// protected routes
app.use('/user', authenticate, authorizeRole(['admin', 'seller', 'buyer']), userRoutes);

>>>>>>> 034d025 (feat: enhance server setup with CORS, cookie parsing, and structured routing)
app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  console.log('Request originalUrl:', req.originalUrl);
  console.log('Request baseUrl:', req.baseUrl);
  console.log('Request path:', req.path);
  console.log('Cookies:', req.cookies);
  next();
});
app.use(errorHandler);


app.listen(PORT, async () => {
  console.log(`[server]: Server is running at http://localhost:${PORT} in ${NODE_ENV} environment`);
  await connectToDatabase();
});