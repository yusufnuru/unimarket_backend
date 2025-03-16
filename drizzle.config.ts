import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/drizzle/',
  schema: './src/schema/*.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DB_URL!,
  },
  verbose: true,
  strict: true,
});
