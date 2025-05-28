import { Socket, ExtendedError } from 'socket.io';
import { parse } from 'cookie';
import appAssert from '../utils/appAssert.js';
import { UNAUTHORIZED } from '../constants/http.js';
import { AppErrorCode } from '../constants/appErrorCode.js';
import { verifyToken } from '../utils/jwt.js';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  sessionId: string;
  role: string;
}

// Shared authentication middleware
export const socketAuthenticate = () => {
  return (socket: Socket, next: (err?: ExtendedError) => void) => {
    try {
      const cookieHeader = socket.request.headers.cookie;
      appAssert(cookieHeader, UNAUTHORIZED, 'Missing cookies', AppErrorCode.MissingCookies);

      const cookies = parse(cookieHeader);
      const accessToken = cookies['accessToken'];

      appAssert(accessToken, UNAUTHORIZED, 'Missing access token', AppErrorCode.MissingAccessToken);
      const { error, payload } = verifyToken(accessToken);
      appAssert(
        payload,
        UNAUTHORIZED,
        error === 'jwt expired' ? 'Token expired' : 'Invalid token',
        error === 'jwt expired' ? AppErrorCode.TokenExpired : AppErrorCode.InvalidAccessToken,
      );

      // Attach userId and sessionId to the socket object
      (socket as AuthenticatedSocket).userId = payload.userId;
      (socket as AuthenticatedSocket).sessionId = payload.sessionId;
      (socket as AuthenticatedSocket).role = payload.role;

      // Set auth data
      socket.handshake.auth = {
        userId: payload.userId,
        sessionId: payload.sessionId,
        role: payload.role,
      };

      next();
    } catch (error) {
      next(error as ExtendedError);
    }
  };
};
