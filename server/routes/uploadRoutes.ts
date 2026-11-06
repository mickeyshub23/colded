import { Router, Request, Response, NextFunction } from 'express';
import { uploadSingle, uploadToSupabaseMiddleware } from '../middleware/upload';

const router = Router();

// POST /api/upload/image - upload a single image to Supabase Storage
router.post('/upload/image', (req: Request, res: Response, next: NextFunction) => {
  uploadSingle(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    uploadToSupabaseMiddleware(req, res, next);
  });
});

// POST /api/upload/images - upload multiple images
router.post('/upload/images', async (req: Request, res: Response) => {
  const files = (req as any).files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files uploaded' });
  }

  const { supabase } = await import('../lib/supabase');
  const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET ?? 'product-images';

  const results: { url: string; path: string }[] = [];
  for (const file of files) {
    const fileName = `products/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (uploadError) {
      return res.status(500).json({ success: false, error: uploadError.message });
    }
    const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
    results.push({ url: publicData.publicUrl, path: data.path });
  }

  res.json({ success: true, data: results });
});

export default router;