import catchError from '../utils/cacheErrors.js';
import {
  createAccount,
  deleteSession,
  loginUser,
  refreshUserAccessToken,
  resetPassword,
  sendPasswordResetEmail,
  verifyEmailAndLogin,
} from './authService.js';
import {
  clearAuthCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthCookies,
} from '../utils/cookies.js';
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './authSchema.js';
import { verifyToken } from '../utils/jwt.js';
import { CREATED, OK, UNAUTHORIZED } from '../constants/http.js';
import appAssert from '../utils/appAssert.js';
import { AppErrorCode } from '../constants/appErrorCode.js';

export const registerHandler = catchError(async (req, res) => {
  const request = registerSchema.parse({
    ...req.body,
  });

  // call service
  const { ...user } = await createAccount(request);

  // return response
  res.status(CREATED).json({
    user,
    message: 'Account registered successfully. Verification link has been sent to your email',
  });
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
  console.log(req.cookies);
  const refreshToken = req.cookies.refreshToken as string | undefined;
  appAssert(refreshToken, UNAUTHORIZED, 'Missing refresh token', AppErrorCode.MissingRefreshToken);

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
  const verificationSchema = verifyEmailSchema.parse({
    verificationCode: req.params.code,
    userAgent: req.headers['user-agent'],
  });

  // call service
  const { accessToken, refreshToken, verifiedUser } = await verifyEmailAndLogin(verificationSchema);

  // return response
  setAuthCookies({ res, accessToken, refreshToken })
    .status(OK)
    .json({
      message: `Email successfully verified for ${verifiedUser.email}`,
    });
});

export const sendPasswordResetHandler = catchError(async (req, res) => {
  interface RequestBody {
    email: string;
  }
  const email = emailSchema.parse((req.body as RequestBody).email);

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

export const getMe = catchError((req, res, next) => {
  res.json({
    userId: req.userId,
    role: req.role, // Ensure this is correctly sent
  });
  next();
});
