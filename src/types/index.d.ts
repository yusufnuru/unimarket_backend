declare global {
  namespace Express {
    interface Request {
      cookies: {
        accessToken?: string;
        [key: string]: string;
      };
      userId: string;
      sessionId: string;
      role: string;
    }

    interface Socket {
      userId: string;
      sessionId: string;
      role: string;
    }
  }
}

export {};
