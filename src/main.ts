import { connectToDatabase, closeDatabase } from '@config/db.js';
import { NODE_ENV, PORT } from '@src/constants/env.js';
import app from '@src/app.js';

const server = app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT} in ${NODE_ENV} environment`);

  // Use void to explicitly ignore the promise
  void connectToDatabase()
    .then(() => {
      // Database connection successful
    })
    .catch((err) => {
      console.error('Failed to connect to database:', err);
      process.exit(1);
    });
});

function shutdown() {
  console.log('Shutting down server...');

  server.close(() => {
    // Use void to explicitly ignore the promise or handle with then/catch
    void closeDatabase()
      .then(() => {
        console.log('Server shut down complete');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Error closing database connection:', err);
        process.exit(1);
      });
  });

  // Set a timeout to force shutdown if close operations take too long
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Use these handlers instead of directly passing the async function
process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());
