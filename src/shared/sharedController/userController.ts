import { eq } from 'drizzle-orm';
import { db } from '@config/db.js';
import catchError from '@utils/cacheErrors.js';
import { Users } from '@schema/Users.js';
import { OK } from '@src/constants/http.js';

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
