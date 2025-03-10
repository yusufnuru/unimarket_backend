import { NextFunction, Request, Response } from 'express';

type expressController = (req: Request, res: Response, next: NextFunction) => Promise<void>;


const catchError = (controller: expressController): expressController => 
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };

export default catchError;