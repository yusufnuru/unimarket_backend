import { and, desc, eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import catchError from '../utils/cacheErrors.js';
import { Users } from '../schema/Users.js';
import { NOT_FOUND, OK } from '../constants/http.js';
import { Sessions } from '../schema/Sessions.js';
import { z } from 'zod';
import appAssert from '../utils/appAssert.js';

export const getUserHandler = catchError(async (req, res, next) => {
  const user = await db.query.Users.findFirst({
    where: eq(Users.id, req.userId),
    columns: {
      password: false,
    },
  });

  res.status(OK).json({ user });
  next();
});

export const getSessionHandler = catchError(async (req, res) => {
  const session = await db.query.Sessions.findMany({
    where: (Sessions, { eq, and, gt }) =>
      and(eq(Sessions.userId, req.userId), gt(Sessions.expiresAt, new Date().toISOString())),
    columns: {
      userId: false,
      expiresAt: false,
    },
    orderBy: [desc(Sessions.createdAt)],
  });

  res.status(OK).json(
    session.map((session) => ({
      ...session,
      ...(session.id === req.sessionId && {
        isCurrent: true,
      }),
    })),
  );
});

export const deleteSessionHandler = catchError(async (req, res) => {
  const sessionId = z.string().parse(req.params.id);

  const [deleted] = await db
    .delete(Sessions)
    .where(and(eq(Sessions.id, sessionId), eq(Sessions.userId, req.userId)))
    .returning();

  appAssert(deleted, NOT_FOUND, 'Session not found');

  res.status(OK).json({ message: 'Session removed' });
});
