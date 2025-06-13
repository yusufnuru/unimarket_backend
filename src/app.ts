import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './auth/authRoutes.js';
import { authenticate, authorizeRole } from './middleware/authenticate.js';
import { userRoutes, sessionRoutes } from './shared/sharedRoutes.js';
import { storeRoutes, publicStoreRoutes } from './store/storeRoutes.js';
import adminRoutes from './admin/adminRoutes.js';
import { productRoutes, publicProductRoutes } from './product/productRoutes.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { closeDatabase, connectToDatabase } from './config/db.js';
import { PORT, NODE_ENV, APP_ORIGIN } from './constants/env.js';
import chatRouter from './chat/chatRoutes.js';
import { publicCategoryRouter } from './category/categoryRoutes.js';
import { setUpMessageHandler } from './chat/chatMessageSocketHandler.js';
import buyerRoutes from './buyer/buyerRoutes.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [`${APP_ORIGIN}`, 'http://localhost:3000'],
    credentials: true,
  },
});

app.set('io', io);
// socketSetupIO(io);
setUpMessageHandler(io);

app.use(
  cors({
    origin: [`${APP_ORIGIN}`, 'http://localhost:3000'],
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// auth routes
app.use('/api/auth', authRoutes);

// protected routes
app.use('/api/user', authenticate, authorizeRole(['admin', 'seller', 'buyer']), userRoutes);
app.use('/api/sessions', authenticate, authorizeRole(['admin', 'seller', 'buyer']), sessionRoutes);
app.use('/api/chat', authenticate, authorizeRole(['admin', 'seller', 'buyer']), chatRouter);
app.use('/api/admin', authenticate, authorizeRole(['admin']), adminRoutes);
app.use('/api/buyer', authenticate, authorizeRole(['buyer']), buyerRoutes);
app.use('/api/store', authenticate, storeRoutes);
app.use('/api/product', authenticate, productRoutes);

// public routes
app.use('/api/public-store', publicStoreRoutes);
app.use('/api/public-product', publicProductRoutes);
app.use('/api/public-category', publicCategoryRouter);

app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  console.log('Request originalUrl:', req.originalUrl);
  console.log('Request baseUrl:', req.baseUrl);
  console.log('Request path:', req.path);
  console.log('Cookies:', req.cookies);
  next();
});
app.use(errorHandler);

server.listen(Number(PORT), () => {
  console.log(`[server]: Server is running at http://localhost:${PORT} in ${NODE_ENV} environment`);

  connectToDatabase()
    .then(() => {
      console.log('Database connection successful');
    })
    .catch((err) => {
      console.error('Failed to connect to database:', err);
      process.exit(1);
    });
});

function shutdown() {
  console.log('Shutting down server...');
  void io.close(() => {
    console.log('WebSocket connections closed');
    server.close(() => {
      closeDatabase()
        .then(() => {
          console.log('Server shut down complete');
          process.exit(0);
        })
        .catch((err) => {
          console.error('Error closing database connection:', err);
          process.exit(1);
        });
    });
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => {
  shutdown();
});

process.on('SIGTERM', () => {
  shutdown();
});
