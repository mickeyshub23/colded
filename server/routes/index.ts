import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import collectionRoutes from './collectionRoutes';
import adminRoutes from './adminRoutes';
import uploadRoutes from './uploadRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/collections', collectionRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);

export default router;