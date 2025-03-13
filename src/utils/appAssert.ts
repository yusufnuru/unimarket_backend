import assert from 'node:assert';
import { HttpStatusCode, AppErrorCode } from '../constants';
import AppError from './AppError';

type AppAssert = (
  condition: unknown,
  httpStatusCode: HttpStatusCode,
  message: string,
  appErrorCode?: AppErrorCode,
 ) => asserts condition;
/**
 * Asserts a condition and throws an AppError if the condition is falsy.
 */
const appAssert: AppAssert = (
  condition, 
  httpStatusCode, 
  message, 
  appErrorCode,
) => assert(condition, new AppError (httpStatusCode, message, appErrorCode));

export default appAssert;