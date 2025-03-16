import { HttpStatusCode } from '@src/constants/http.js';
import { AppErrorCode } from '@src/constants/appErrorCode.js';

class AppError extends Error {
  constructor(
    public statusCode: HttpStatusCode,
    public message: string,
    public errorCode?: AppErrorCode,
  ) {
    super(message);
  }
}

export default AppError;
