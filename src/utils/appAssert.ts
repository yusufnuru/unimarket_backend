import assert from 'node:assert';
import { HttpStatusCode } from '../constants';
import AppError from './AppError';

type AppAssert = (
  condition: unknown,
  httpStatusCode: HttpStatusCode,
  message: string,
 ) => asserts condition;
/**
 * Asserts a condition and throws an AppError if the condition is falsy.
 */
const appAssert: AppAssert = (
  condition, 
  httpStatusCode, 
  message ) => assert(condition, new AppError (httpStatusCode, message ));

export default appAssert;