import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { error } from '../lib/response';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    aud?: string;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 401, 'Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);
    const { data, error: supabaseError } = await supabase.auth.getUser(token);

    if (supabaseError || !data.user) {
      return error(res, 401, 'Invalid or expired token');
    }

    req.user = {
      id: data.user.id,
      email: data.user.email ?? '',
      role: data.user.app_metadata?.role ?? 'customer',
      aud: data.user.aud,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return error(res, 401, 'Authentication required');
  }
  if (req.user.role !== 'admin') {
    return error(res, 403, 'Admin access required');
  }
  next();
}
