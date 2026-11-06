import { Router, Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { json, error } from '../lib/response';
import type { Product, ProductInput, ProductStatus } from '../lib/types';

const router = Router();

// Helper: map DB row to Product type
function mapProduct(row: any): Product {
  return {
    id: row.id,
    collectionId: row.collection_id,
    name: row.name,
    handle: row.handle,
    description: row.description ?? '',
    vendor: row.vendor ?? '',
    type: row.type ?? '',
    sku: row.sku ?? '',
    barcode: row.barcode,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : null,
    status: row.status as ProductStatus,
    inventoryQuantity: row.inventory_quantity ?? 0,
    inventoryPolicy: row.inventory_policy ?? 'deny',
    featuredImageUrl: row.featured_image_url,
    images: row.images ?? [],
    options: row.options ?? [],
    variants: row.variants ?? [],
    tags: row.tags ?? [],
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    published: row.published ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/products - list products with filtering/pagination
router.get('/products', async (req: Request, res: Response) => {
  try {
    const {
      collectionId,
      status,
      published,
      limit = '50',
      offset = '0',
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    let query = supabase.from('products').select('*', { count: 'exact' });

    if (collectionId) query = query.eq('collection_id', collectionId);
    if (status) query = query.eq('status', status);
    if (published !== undefined) query = query.eq('published', published === 'true');
    if (search) query = query.ilike('name', `%${search}%`);

    query = query.order(sortBy as string, { ascending: sortOrder === 'asc' })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error: dbError, count } = await query;

    if (dbError) return error(res, 500, 'Database error', dbError.message);

    const products = (data ?? []).map(mapProduct);
    return json(res, 200, products, {
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      limit: Number(limit),
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / Number(limit)),
    });
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

// GET /api/products/:id - single product
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const { data, error: dbError } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') return error(res, 404, 'Product not found');
      return error(res, 500, 'Database error', dbError.message);
    }

    return json(res, 200, mapProduct(data));
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

// POST /api/products - create product (admin only)
router.post('/products', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 403, 'Admin access required');
  }
  try {
    const input = req.body as ProductInput;
    if (!input.name || !input.handle) {
      return error(res, 400, 'Name and handle are required');
    }

    const { data, error: dbError } = await supabaseAdmin
      .from('products')
      .insert({
        collection_id: input.collectionId,
        name: input.name,
        handle: input.handle,
        description: input.description ?? '',
        vendor: input.vendor ?? '',
        type: input.type ?? '',
        sku: input.sku ?? '',
        barcode: input.barcode,
        price: input.price,
        compare_at_price: input.compareAtPrice,
        status: input.status ?? 'draft',
        inventory_quantity: input.inventoryQuantity ?? 0,
        inventory_policy: input.inventoryPolicy ?? 'deny',
        featured_image_url: input.featuredImageUrl,
        images: input.images ?? [],
        options: input.options ?? [],
        variants: input.variants ?? [],
        tags: input.tags ?? [],
        seo_title: input.seoTitle,
        seo_description: input.seoDescription,
        published: input.published ?? false,
      })
      .select('*')
      .single();

    if (dbError) return error(res, 500, 'Database error', dbError.message);

    return json(res, 201, mapProduct(data));
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

// PUT /api/products/:id - update product (admin only)
router.put('/products/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 403, 'Admin access required');
  }
  try {
    const input = req.body as Partial<ProductInput>;
    const { data, error: dbError } = await supabaseAdmin
      .from('products')
      .update({
        collection_id: input.collectionId,
        name: input.name,
        handle: input.handle,
        description: input.description,
        vendor: input.vendor,
        type: input.type,
        sku: input.sku,
        barcode: input.barcode,
        price: input.price,
        compare_at_price: input.compareAtPrice,
        status: input.status,
        inventory_quantity: input.inventoryQuantity,
        inventory_policy: input.inventoryPolicy,
        featured_image_url: input.featuredImageUrl,
        images: input.images,
        options: input.options,
        variants: input.variants,
        tags: input.tags,
        seo_title: input.seoTitle,
        seo_description: input.seoDescription,
        published: input.published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') return error(res, 404, 'Product not found');
      return error(res, 500, 'Database error', dbError.message);
    }

    return json(res, 200, mapProduct(data));
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

// PATCH /api/products/:id - partial update (admin only)
router.patch('/products/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 403, 'Admin access required');
  }
  try {
    const input = req.body as Partial<ProductInput>;
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    const allowedFields = [
      'collectionId', 'name', 'handle', 'description', 'vendor', 'type', 'sku',
      'barcode', 'price', 'compareAtPrice', 'status', 'inventoryQuantity',
      'inventoryPolicy', 'featuredImageUrl', 'images', 'options', 'variants',
      'tags', 'seoTitle', 'seoDescription', 'published'
    ];

    for (const key of allowedFields) {
      if (input[key as keyof typeof input] !== undefined) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateData[snakeKey] = input[key as keyof typeof input];
      }
    }

    const { data, error: dbError } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') return error(res, 404, 'Product not found');
      return error(res, 500, 'Database error', dbError.message);
    }

    return json(res, 200, mapProduct(data));
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

// DELETE /api/products/:id - delete product (admin only)
router.delete('/products/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 403, 'Admin access required');
  }
  try {
    const { error: dbError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (dbError) return error(res, 500, 'Database error', dbError.message);

    return json(res, 200, { deleted: true });
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

// POST /api/products/:id/publish - publish/unpublish product (admin only)
router.post('/products/:id/publish', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 403, 'Admin access required');
  }
  try {
    const { published } = req.body;
    const { data, error: dbError } = await supabaseAdmin
      .from('products')
      .update({ published: !!published, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') return error(res, 404, 'Product not found');
      return error(res, 500, 'Database error', dbError.message);
    }

    return json(res, 200, mapProduct(data));
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

export default router;