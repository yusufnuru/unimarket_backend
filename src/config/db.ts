import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as usersSchema from '../schema/Users.js';
import * as profilesSchema from '../schema/Profiles.js';
import * as sessionsSchema from '../schema/Sessions.js';
import * as verificationCodesSchema from '../schema/VerificationCodes.js';
import * as storeSchema from '../schema/Stores.js';
import * as storeRequestSchema from '../schema/StoreRequest.js';
import * as productsSchema from '../schema/Products.js';
import * as categoriesSchema from '../schema/Categories.js';
import * as chatMessageSchema from '../schema/ChatMessages.js';
import { DB_URL } from '../constants/env.js';

const { Pool } = pkg;
const pool = new Pool({
  connectionString: DB_URL,
});

export const db = drizzle(pool, {
  schema: {
    ...usersSchema,
    ...profilesSchema,
    ...sessionsSchema,
    ...verificationCodesSchema,
    ...storeSchema,
    ...storeRequestSchema,
    ...productsSchema,
    ...categoriesSchema,
    ...chatMessageSchema,
  },
});

export const connectToDatabase = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL with Drizzle');
    client.release();
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL with Drizzle', error);
    process.exit(1);
  }
};

export const closeDatabase = async () => {
  try {
    await pool.end();
    console.log('✅ Successfully Database Pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool', error);
  }
};

export const cleanDb = () => {
  return db.transaction(async (tx) => {
    await tx.delete(verificationCodesSchema.VerificationCodes);
    await tx.delete(sessionsSchema.Sessions);
    await tx.delete(profilesSchema.Profiles);
    await tx.delete(usersSchema.Users);
  });
};
