import { and, eq, gt } from 'drizzle-orm';
import { db } from '@config/db.js';
import { Profiles } from '@schema/Profiles.js';
import { Sessions } from '@schema/Sessions.js';
import { Users } from '@schema/Users.js';
import { VerificationCodes } from '@schema/VerificationCodes.js';
import { compareValue, hashValue } from '@utils/argon2.js';
import {
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
} from '@src/constants/http.js';
import { VerificationCodeType } from '@src/constants/verificationCodeType.js';
import { APP_ORIGIN } from '@constants/env.js';
import {
  fiveMinutesAgo,
  ONE_DAY_MS,
  oneHourFromNow,
  oneYearFromNow,
  thirtyDaysFromNow,
} from '@utils/date.js';
import appAssert from '@utils/appAssert.js';
import {
  RefreshTokenPayload,
  refreshTokenSignOptions,
  signToken,
  verifyToken,
} from '@utils/jwt.js';
import { Email, LoginUserDto, RegisterUserDto, VerificationCode } from '@auth/authSchema.js';
import { getPasswordResetTemplate, getVerifyEmailTemplate } from '@utils/emailTemplate.js';
import { sendMail } from '@utils/sendMail.js';

export const createAccount = async (dto: RegisterUserDto) => {
  // verify existing user doesn't exist
  const existingUser = await db.query.Users.findFirst({ where: eq(Users.email, dto.email) });
  appAssert(!existingUser, CONFLICT, 'Email already exists');
  // create user
  const newUser = await db.transaction(async (tx) => {
    const password = await hashValue(dto.password);

    const [user] = await tx
      .insert(Users)
      .values({
        email: dto.email,
        password,
      })
      .returning({
        id: Users.id,
        email: Users.email,
      });

    if (!user) {
      throw new Error('User creation failed');
    }

    const [profile] = await tx
      .insert(Profiles)
      .values({
        fullName: `${dto.firstName} ${dto.lastName}`,
        phoneNumber: dto.phoneNumber,
        userId: user.id,
        role: dto.role,
      })
      .returning({
        id: Profiles.id,
        userId: Profiles.userId,
        role: Profiles.role,
      });

    return {
      user,
      profile,
    };
  });

  const { user, profile } = newUser;
  const userId = user.id;
  const role = profile.role;

  // create verification code
  const [verificationCode] = await db
    .insert(VerificationCodes)
    .values({
      userId,
      type: VerificationCodeType.EMAIL_VERIFICATION,
      expiresAt: oneYearFromNow().toISOString(),
    })
    .returning();

  const url = `${APP_ORIGIN}/email/verify/${verificationCode.id}`;
  // send verification code
  const { data, error } = await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });

  appAssert(data?.id, INTERNAL_SERVER_ERROR, `${error?.name}: ${error?.message}`);

  // create session
  const [session] = await db
    .insert(Sessions)
    .values({
      userId,
      userAgent: dto.userAgent,
    })
    .returning({ id: Sessions.id });

  const sessionId = session.id;

  // sign access token & refresh toke
  const accessToken = signToken({ userId, sessionId, role });

  const refreshToken = signToken({ sessionId, role }, refreshTokenSignOptions);

  // return user and tokens
  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (dto: LoginUserDto) => {
  // GET USER BY EMAIL
  const user = await db.query.Users.findFirst({
    where: eq(Users.email, dto.email),
    with: { profile: { columns: { role: true } } },
  });
  appAssert(user, UNAUTHORIZED, 'Invalid email or password');

  // VALIDATE PASSWORD
  const isValid = await compareValue(dto.password, user.password);
  appAssert(isValid, UNAUTHORIZED, 'Invalid email or password');

  const userId = user.id;
  const role = user.profile.role;
  // CREATE SESSION
  const [session] = await db
    .insert(Sessions)
    .values({
      userId,
      userAgent: dto.userAgent,
    })
    .returning({ id: Sessions.id });

  const sessionId = session.id;

  // SIGN TOKENS
  const accessToken = signToken({ userId, sessionId, role });

  const refreshToken = signToken({ sessionId, role }, refreshTokenSignOptions);

  // RETURN USER AND TOKENS
  return {
    accessToken,
    refreshToken,
  };
};

export const deleteSession = async (sessionId: string) => {
  await db.delete(Sessions).where(eq(Sessions.id, sessionId));
};

export const refreshUserAccessToken = async (refreshToken: string) => {
  const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });
  appAssert(payload, UNAUTHORIZED, 'Invalid refresh token');

  const session = await db.query.Sessions.findFirst({
    where: eq(Sessions.id, payload.sessionId),
  });
  const now = Date.now();
  appAssert(
    session && new Date(session.expiresAt).getTime() > now,
    UNAUTHORIZED,
    'Session expired',
  );

  // refresh the session if it expires in the next 24 hours
  const sessionNeedsRefresh = new Date(session.expiresAt).getTime() - now < ONE_DAY_MS;

  if (sessionNeedsRefresh) {
    await db
      .update(Sessions)
      .set({
        expiresAt: thirtyDaysFromNow().toISOString(),
      })
      .where(eq(Sessions.id, session.id));
  }

  const user = await db.query.Users.findFirst({
    where: eq(Users.id, session.userId),
    with: {
      profile: {
        columns: {
          role: true,
        },
      },
    },
    columns: {
      id: true,
    },
  });

  appAssert(user, UNAUTHORIZED, 'Invalid session');

  const userId = user.id;
  const role = user.profile.role;
  const sessionId = session.id;

  const newRefreshToken = sessionNeedsRefresh
    ? signToken({ sessionId, role }, refreshTokenSignOptions)
    : undefined;

  const accessToken = signToken({ userId, sessionId, role });

  return {
    accessToken,
    newRefreshToken,
  };
};

export const verifyEmail = async (code: VerificationCode) => {
  // get the verification code
  const validVerificationCode = await db.query.VerificationCodes.findFirst({
    where: (VerificationCodes, { eq, and, gt }) =>
      and(
        eq(VerificationCodes.id, code),
        eq(VerificationCodes.type, VerificationCodeType.EMAIL_VERIFICATION),
        gt(VerificationCodes.expiresAt, new Date().toISOString()),
      ),
  });

  appAssert(validVerificationCode, NOT_FOUND, 'Invalid OR expired verification code');

  // update user to verified true
  const updatedUser = await db
    .update(Users)
    .set({ verified: true })
    .where(eq(Users.id, validVerificationCode.userId))
    .returning({
      id: Users.id,
      email: Users.email,
      verified: Users.verified,
    });

  appAssert(updatedUser, INTERNAL_SERVER_ERROR, 'User verification failed');

  // delete verification code
  await db.delete(VerificationCodes).where(eq(VerificationCodes.id, code));

  // return user
  return updatedUser;
};

export const sendPasswordResetEmail = async (email: Email) => {
  // get the user by email
  const user = await db.query.Users.findFirst({
    where: (Users, { eq }) => eq(Users.email, email),
  });
  appAssert(user, NOT_FOUND, 'User not found');
  // check email rate limit
  const fiveMinAgo = fiveMinutesAgo().toISOString();
  const count = await db.$count(
    VerificationCodes,
    and(
      eq(VerificationCodes.userId, user.id),
      eq(VerificationCodes.type, VerificationCodeType.PASSWORD_RESET),
      gt(VerificationCodes.createdAt, fiveMinAgo),
    ),
  );

  appAssert(count <= 1, TOO_MANY_REQUESTS, 'Too many requests, please try again later');

  // create verification code
  const expiresAt = oneHourFromNow().toISOString();
  const [verificationCode] = await db
    .insert(VerificationCodes)
    .values({
      userId: user.id,
      type: VerificationCodeType.PASSWORD_RESET,
      expiresAt,
    })
    .returning();
  // send verification email
  const url = `${APP_ORIGIN}/password/reset/
    ${verificationCode.id}&exp=${new Date(expiresAt).getTime()}`;

  const { data, error } = await sendMail({
    to: user.email,
    ...getPasswordResetTemplate(url),
  });

  appAssert(data?.id, INTERNAL_SERVER_ERROR, `${error?.name}: ${error?.message}`);

  // return success
  return {
    url,
    emailId: data.id,
  };
};

type ResetPasswordParams = {
  password: string;
  verificationCode: string;
};

export const resetPassword = async (request: ResetPasswordParams) => {
  // get the verification code
  const validCode = await db.query.VerificationCodes.findFirst({
    where: (VerificationCodes, { eq, and, gt }) =>
      and(
        eq(VerificationCodes.id, request.verificationCode),
        eq(VerificationCodes.type, VerificationCodeType.PASSWORD_RESET),
        gt(VerificationCodes.expiresAt, new Date().toISOString()),
      ),
  });

  appAssert(validCode, NOT_FOUND, 'Invalid OR expired verification code');

  // update user password
  const [updatedUser] = await db
    .update(Users)
    .set({
      password: await hashValue(request.password),
    })
    .where(eq(Users.id, validCode.userId))
    .returning({
      id: Users.id,
      email: Users.email,
    });

  appAssert(updatedUser, INTERNAL_SERVER_ERROR, 'Password reset failed');

  // delete verification code
  await db.delete(VerificationCodes).where(eq(VerificationCodes.id, request.verificationCode));

  // delete all user sessions
  await db.delete(Sessions).where(eq(Sessions.userId, updatedUser.id));
  // return success
  return updatedUser;
};
