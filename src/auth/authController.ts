import catchError from '../utils/cacheErrors';
import { createAccount, deleteSession, loginUser, refreshUserAccessToken, resetPassword, sendPasswordResetEmail, verifyEmail } from './authService';
import { clearAuthCookies, getAccessTokenCookieOptions, getRefreshTokenCookieOptions, setAuthCookies } from '../utils/cookies';
import { registerSchema, loginSchema, verificationCodeSchema, emailSchema} from './authSchema';
import { verifyToken } from '../utils/jwt';
import { CREATED, OK, UNAUTHORIZED } from '../constants';
import appAssert from '../utils/appAssert';
import { resetPasswordSchema } from './authSchema/resetPassword';


export const registerHandler = catchError(async (req, res) => {
  const request = registerSchema.parse({
    ...req.body,
    userAgent: req.headers['user-agent'],
  });

  // call service
  const { user, accessToken, refreshToken } = await createAccount(request);

  // return response
  setAuthCookies({res, accessToken, refreshToken}).status(CREATED).json({user});
});


export const loginHandler = catchError(async (req, res) => {
  const request = loginSchema.parse({
    ...req.body,
    userAgent: req.headers['user-agent'],
  });

  // call service
  const {refreshToken, accessToken} = await loginUser(request);

  // return response
  setAuthCookies({res, accessToken, refreshToken}).status(OK).json({
    message: 'Login successful',
  });
});

export const logoutHandler = catchError(async (req, res) => {
  
  const accessToken = req.cookies.accessToken;
  const {payload} = verifyToken(accessToken);

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
  appAssert(refreshToken, UNAUTHORIZED,'Missing refresh token');

  // call service
  const {accessToken, newRefreshToken} = await refreshUserAccessToken(refreshToken);

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
  const email = emailSchema.parse(req.body.email);

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