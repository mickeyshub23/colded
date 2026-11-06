import { Router, Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { json, error } from '../lib/response';

const router = Router();

// GET /api/admin/users - list all users (admin only)
router.get('/users', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 403, 'Admin access required');
  }
  try {
    const { data, error: dbError } = await supabaseAdmin.auth.admin.listUsers();

    if (dbError) return error(res, 500, 'Database error', dbError.message);

    const users = (data.users ?? []).map((u: any) => ({
      id: u.id,
      email: u.email,
      role: u.app_metadata?.role ?? 'customer',
      createdAt: u.created_at,
      lastLogin: u.last_sign_in_at,
    }));

    return json(res, 200, users);
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

// PATCH /api/admin/users/:id/role - update user role (admin only)
router.patch('/users/:id/role', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 403, 'Admin access required');
  }
  try {
    const { role } = req.body;
    if (!role || !['admin', 'customer'].includes(role)) {
      return error(res, 400, 'Invalid role. Must be "admin" or "customer"');
    }

    const { data, error: dbError } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
      app_metadata: { role },
    });

    if (dbError) return error(res, 500, 'Database error', dbError.message);

    return json(res, 200, {
      id: data.user.id,
      email: data.user.email,
      role: data.user.app_metadata?.role ?? 'customer',
    });
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

// DELETE /api/admin/users/:id - delete user (admin only)
router.delete('/users/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 403, 'Admin access required');
  }
  try {
    const { error: dbError } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
    if (dbError) return error(res, 500, 'Database error', dbError.message);

    return json(res, 200, { deleted: true });
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

// GET /api/admin/stats - get dashboard stats (admin only)
router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 403, 'Admin access required');
  }
  try {
    const [productsRes, collectionsRes, usersRes] = await Promise.all([
      supabaseAdmin.from('products').select('*', { count: 'exact' }),
      supabaseAdmin.from('collections').select('*', { count: 'exact' }),
      supabaseAdmin.auth.admin.listUsers(),
    ]);

    const stats = {
      totalProducts: productsRes.count ?? 0,
      totalCollections: collectionsRes.count ?? 0,
      totalUsers: usersRes.data?.users.length ?? 0,
      activeProducts: 0,
      draftProducts: 0,
      archivedProducts: 0,
    };

    if (productsRes.data) {
      stats.activeProducts = productsRes.data.filter((p: any) => p.status === 'active').length;
      stats.draftProducts = productsRes.data.filter((p: any) => p.status === 'draft').length;
      stats.archivedProducts = productsRes.data.filter((p: any) => p.status === 'archived').length;
    }

    return json(res, 200, stats);
  } catch (err: any) {
    return error(res, 500, 'Server error', err.message);
  }
});

export default router;