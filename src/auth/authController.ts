import catchError from '@utils/cacheErrors.js';
import {
  createAccount,
  deleteSession,
  loginUser,
  refreshUserAccessToken,
  resetPassword,
  sendPasswordResetEmail,
  verifyEmail,
} from '@auth/authService.js';
import {
  clearAuthCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthCookies,
} from '@utils/cookies.js';
import {
  registerSchema,
  loginSchema,
  verificationCodeSchema,
  emailSchema,
} from '@auth/authSchema.js';
import { verifyToken } from '@utils/jwt.js';
import { CREATED, OK, UNAUTHORIZED } from '@constants/http.js';
import appAssert from '@utils/appAssert.js';
import { resetPasswordSchema } from '@auth/authSchema.js';

export const registerHandler = catchError(async (req, res) => {
  const request = registerSchema.parse({
    ...req.body,
    userAgent: req.headers['user-agent'],
  });

  // call service
  const { user, accessToken, refreshToken } = await createAccount(request);

  // return response
  setAuthCookies({ res, accessToken, refreshToken }).status(CREATED).json({ user });
});

export const loginHandler = catchError(async (req, res) => {
  const request = loginSchema.parse({
    ...req.body,
    userAgent: req.headers['user-agent'],
  });

  // call service
  const { refreshToken, accessToken } = await loginUser(request);

  // return response
  setAuthCookies({ res, accessToken, refreshToken }).status(OK).json({
    message: 'Login successful',
  });
});

export const logoutHandler = catchError(async (req, res) => {
  const accessToken = req.cookies.accessToken as string;
  const { payload } = verifyToken(accessToken);

  // call service
  if (payload) {
    await deleteSession(payload.sessionId);
  }

  // return response
  clearAuthCookies(res).status(OK).json({
    message: 'Logout successful',
  });
});

export const refreshHandler = catchError(async (req, res) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;
  appAssert(refreshToken, UNAUTHORIZED, 'Missing refresh token');

  // call service
  const { accessToken, newRefreshToken } = await refreshUserAccessToken(refreshToken);

  // return response
  if (newRefreshToken) {
    res.cookie('refreshToken', newRefreshToken, getRefreshTokenCookieOptions());
  }

  res.cookie('accessToken', accessToken, getAccessTokenCookieOptions()).status(OK).json({
    message: 'Access Token refreshed',
  });
});

export const verifyEmailHandler = catchError(async (req, res) => {
  const verificationCode = verificationCodeSchema.parse(req.params.code);

  // call service
  await verifyEmail(verificationCode);

  // return response
  res.status(OK).json({
    message: 'Email was successfully verified',
  });
});

export const sendPasswordResetHandler = catchError(async (req, res) => {
  interface ResquestBody {
    email: string;
  }
  const email = emailSchema.parse((req.body as ResquestBody).email);

  // call service
  await sendPasswordResetEmail(email);

  // return response
  res.status(OK).json({
    message: 'Password reset email was successfully sent',
  });
});

export const resetPasswordResetHandler = catchError(async (req, res) => {
  const request = resetPasswordSchema.parse(req.body);

  // call service
  await resetPassword(request);

  // return response
  clearAuthCookies(res).status(OK).json({
    message: 'Password was successfully reset',
  });
});
