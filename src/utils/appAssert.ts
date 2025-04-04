import assert from 'node:assert';
import { HttpStatusCode } from '../constants/http.js';
import { AppErrorCode } from '../constants/appErrorCode.js';
import AppError from './AppError.js';

type AppAssert = (
  condition: unknown,
  httpStatusCode: HttpStatusCode,
  message: string,
  appErrorCode?: AppErrorCode,
) => asserts condition;
/**
 * Asserts a condition and throws an AppError if the condition is falsy.
 */
const appAssert: AppAssert = (condition, httpStatusCode, message, appErrorCode) =>
  assert(condition, new AppError(httpStatusCode, message, appErrorCode));

export default appAssert;
