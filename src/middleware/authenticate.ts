import { NextFunction, RequestHandler, Response, Request } from 'express';
import appAssert from '../utils/appAssert.js';
import { UNAUTHORIZED } from '../constants/http.js';
import { AppErrorCode } from '../constants/appErrorCode.js';
import { verifyToken } from '../utils/jwt.js';

interface AuthenticatedRequest extends Request {
  cookies: {
    accessToken: string;
    [key: string]: string | undefined;
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.accessToken;
  appAssert(accessToken, UNAUTHORIZED, 'Not authorized', AppErrorCode.InvalidAccessToken);

  const { error, payload } = verifyToken(accessToken);
  appAssert(
    payload,
    UNAUTHORIZED,
    error === 'jwt expired' ? 'Token expired' : 'Invalid token',
    AppErrorCode.InvalidAccessToken,
  );

  console.log('Error received:', error); // Debugging

  req.userId = payload.userId;
  req.sessionId = payload.sessionId;
  req.role = payload.role;

  next();
};

export const authorizeRole =
  (allowedRoles: string[]): RequestHandler =>
  (req, res, next) => {
    const role = req.role;
    appAssert(
      allowedRoles.includes(role),
      UNAUTHORIZED,
      'Insufficient permissions',
      AppErrorCode.InsufficientPermissions,
    );

    next();
  };
