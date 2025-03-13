import { RequestHandler } from 'express';
import appAssert from '../utils/appAssert';
import { UNAUTHORIZED, AppErrorCode } from '../constants';
import { verifyToken } from '../utils/jwt';


export const authenticate: RequestHandler = (req, res, next) => {
  
  const accesstoken = req.cookies.accessToken as string; 
  appAssert(accesstoken, UNAUTHORIZED, 'Not authorized', AppErrorCode.InvalidAccessToken);

  const {error, payload} = verifyToken(accesstoken);
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

export const authorizeRole = (allowedRoles: string[]): RequestHandler => (req, res, next) => {
  const role = req.role;

  appAssert(allowedRoles.includes(role), UNAUTHORIZED, 'Insufficient permissions', AppErrorCode.InsufficientPermissions);

  next();
};
