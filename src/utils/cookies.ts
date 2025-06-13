import { NODE_ENV } from '../constants/env.js';
import { CookieOptions, Response } from 'express';
import { fifteenMinutesFromNow, thirtyDaysFromNow } from './date.js';

export const REFRESH_PATH = '/api/auth/refresh';
const isDev = NODE_ENV === 'development';

const defaults: CookieOptions = {
  httpOnly: true,
  sameSite: isDev ? 'lax' : 'none',
  secure: !isDev,
};

export const getAccessTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: fifteenMinutesFromNow(),
});

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: thirtyDaysFromNow(),
  path: REFRESH_PATH,
});

type Params = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};

export const setAuthCookies = ({ res, accessToken, refreshToken }: Params) =>
  res
    .cookie('accessToken', accessToken, getAccessTokenCookieOptions())
    .cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

export const clearAuthCookies = (res: Response) =>
  res.clearCookie('accessToken').clearCookie('refreshToken', { path: REFRESH_PATH });
