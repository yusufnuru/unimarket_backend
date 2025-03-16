import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import pkg from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '@src/constants/env.js';

const { JsonWebTokenError } = pkg;

export type RefreshTokenPayload = {
  sessionId: string;
  role: string;
};

export type AccessTokenPayload = {
  userId: string;
  sessionId: string;
  role: string;
};

type SignOptionsAndSecret = SignOptions & { secret: string };

const defaults: SignOptions = { audience: ['marketplace-api'] };

export const accessTokenSignOptions: SignOptionsAndSecret = {
  expiresIn: '15m',
  secret: ACCESS_TOKEN_SECRET,
};

export const refreshTokenSignOptions: SignOptionsAndSecret = {
  expiresIn: '30d',
  secret: REFRESH_TOKEN_SECRET,
};

export const signToken = (
  payload: RefreshTokenPayload | AccessTokenPayload,
  options?: SignOptionsAndSecret,
) => {
  const { secret, ...signOpts } = options || accessTokenSignOptions;
  return jwt.sign(payload, secret, {
    ...defaults,
    ...signOpts,
  });
};

export const verifyToken = <TPayload extends object = AccessTokenPayload>(
  token: string,
  options?: VerifyOptions & { secret: string },
) => {
  const { secret = ACCESS_TOKEN_SECRET, ...verifyOpts } = options || {};
  try {
    const payload = jwt.verify(token, secret, {
      ...defaults,
      ...verifyOpts,
    }) as TPayload;
    return {
      payload,
    };
  } catch (error: unknown) {
    if (error instanceof JsonWebTokenError) {
      return {
        error: error.message,
      };
    }
    return {
      error: 'A payload error occurred',
    };
  }
};
