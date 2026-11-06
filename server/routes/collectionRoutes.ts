import { Router, Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { json, error } from '../lib/response';
import type { Collection, CollectionInput } from '../lib/types';

const router = Router();

// Helper: map DB row to Collection type
function mapCollection(row: any): Collection {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    description: row.description ?? null,
    imageUrl: row.image_url ?? null,
    sortOrder: row.sort_order ?? 0,
    published: row.published ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/collections - list collections
router.get('/collections', async (req: Request, res: Response) => {
  try {
    const { limit = '50', offset = '0', search, sortBy = 'created_at', sortOrder = 'desc' } =
      req.query;

    let query = supabase.from('collections').select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query
      .order(sortBy as string, { ascending: sortOrder === 'asc' })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error: dbError, count } = await query;

    if (dbError) return error(res, 500, 'Database error', dbError.message);

    const collections = (data ?? []).map(mapCollection);
    return json(res, 200, collections, {
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      limit: Number(limit),
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / Number(limit)),
    });
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

// GET /api/collections/:id - single collection
router.get('/collections/:id', async (req: Request, res: Response) => {
  try {
    const { data, error: dbError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') return error(res, 404, 'Collection not found');
      return error(res, 500, 'Database error', dbError.message);
    }

    return json(res, 200, mapCollection(data));
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

// GET /api/collections/:id/products - products in collection
router.get('/collections/:id/products', async (req: Request, res: Response) => {
  try {
    const { published } = req.query;
    let query = supabase.from('products').select('*', { count: 'exact' }).eq('collection_id', req.params.id);

    if (published !== undefined) {
      query = query.eq('published', published === 'true');
    }

    const { data, error: dbError, count } = await query;
    if (dbError) return error(res, 500, 'Database error', dbError.message);

    return json(res, 200, (data ?? []));
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

// POST /api/collections - create collection (admin only)
router.post('/collections', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 403, 'Admin access required');
  }
  try {
    const { name, handle, description, imageUrl, sortOrder, published } =
      req.body as CollectionInput;

    if (!name || !handle) {
      return error(res, 400, 'Name and handle are required');
    }

    const { data, error: dbError } = await supabaseAdmin
      .from('collections')
      .insert({
        name,
        handle,
        description: description ?? null,
        image_url: imageUrl ?? null,
        sort_order: sortOrder ?? 0,
        published: published ?? false,
      })
      .select('*')
      .single();

    if (dbError) return error(res, 500, 'Database error', dbError.message);

    return json(res, 201, mapCollection(data));
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

// PUT /api/collections/:id - update collection (admin only)
router.put('/collections/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 403, 'Admin access required');
  }
  try {
    const { name, handle, description, imageUrl, sortOrder, published } =
      req.body as CollectionInput;

    const { data, error: dbError } = await supabaseAdmin
      .from('collections')
      .update({
        name,
        handle,
        description: description ?? null,
        image_url: imageUrl ?? null,
        sort_order: sortOrder ?? 0,
        published: published ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') return error(res, 404, 'Collection not found');
      return error(res, 500, 'Database error', dbError.message);
    }

    return json(res, 200, mapCollection(data));
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

// DELETE /api/collections/:id - delete collection (admin only)
router.delete('/collections/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 403, 'Admin access required');
  }
  try {
    const { error: dbError } = await supabaseAdmin
      .from('collections')
      .delete()
      .eq('id', req.params.id);

    if (dbError) return error(res, 500, 'Database error', dbError.message);

    return json(res, 200, { deleted: true });
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

export default router;