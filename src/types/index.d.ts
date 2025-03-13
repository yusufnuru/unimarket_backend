declare global {
  namespace Express {
    interface Request {
      userId: string;
      sessionId: string;
      role: string;
    }
  }
}

export {};