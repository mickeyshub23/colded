import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function json<T>(
  res: Response,
  status: number,
  data: T,
  meta?: PaginationMeta
) {
  const body: Record<string, unknown> = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function error(
  res: Response,
  status: number,
  message: string,
  details?: unknown
) {
  const body: Record<string, unknown> = { success: false, error: message };
  if (details !== undefined) body.details = details;
  return res.status(status).json(body);
}
