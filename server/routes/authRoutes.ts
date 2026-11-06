import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register - register new user via Supabase Auth
router.post('/auth/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  res.status(201).json({ success: true, data });
});

// POST /api/auth/login
router.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  res.json({ success: true, data });
});

// GET /api/auth/me - get current authenticated user
router.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  res.json({ success: true, data: req.user });
});

// POST /api/auth/logout
router.post('/auth/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  await supabase.auth.signOut();
  res.json({ success: true });
});

export default router;
