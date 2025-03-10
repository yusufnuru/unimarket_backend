import { drizzle} from 'drizzle-orm/node-postgres';
import { Pool} from 'pg';
import * as schema from '../schema';
import { DB_URL } from '../constants/env';

const pool = new Pool({
  connectionString: DB_URL,
});

const connectToDatabase = async () => {
  try{
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL with Drizzle');
    client.release();
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL with Drizzle', error);
    process.exit(1);
  }
};

export default connectToDatabase;
export const db = drizzle(pool, {schema:  schema}) ;