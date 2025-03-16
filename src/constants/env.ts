import 'dotenv/config';
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

export const DB_URL = getEnv('DB_URL');
export const ACCESS_TOKEN_SECRET = getEnv('ACCESS_TOKEN_SECRET');
export const REFRESH_TOKEN_SECRET = getEnv('REFRESH_TOKEN_SECRET');
export const NODE_ENV = getEnv('NODE_ENV');
export const APP_ORIGIN = getEnv('APP_ORIGIN');
export const PORT = getEnv('PORT', '5000');
export const RESEND_API_KEY = getEnv('RESEND_API_KEY');
export const EMAIL_SENDER = getEnv('EMAIL_SENDER');
