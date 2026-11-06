import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { error } from '../lib/response';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: any) {
      return error(res, 400, 'Validation failed', err.issues ?? err.message);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (err: any) {
      return error(res, 400, 'Invalid query parameters', err.issues ?? err.message);
    }
  };
}
