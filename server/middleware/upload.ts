import multer from 'multer';
import { supabase } from '../lib/supabase';
import { Request, Response, NextFunction } from 'express';
import { error } from '../lib/response';

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET ?? 'product-images';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const uploadSingle = upload.single('image');

export async function uploadToSupabaseMiddleware(
  req: Request & { file?: Express.Multer.File },
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) {
      return error(res, 400, 'No file uploaded');
    }

    const fileName = `products/${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;

    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      return error(res, 500, 'Upload failed', uploadError.message);
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    res.json({
      success: true,
      data: {
        url: publicData.publicUrl,
        path: data.path,
        bucket: BUCKET_NAME,
      },
    });
  } catch (err) {
    next(err);
  }
}
