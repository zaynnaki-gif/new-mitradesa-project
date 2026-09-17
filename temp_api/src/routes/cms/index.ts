import { Router } from 'express';
import kategoriRoutes from './kategori.js';
import beritaRoutes from './berita.js';
import halamanRoutes from './halaman.js';
import mediaRoutes from './media.js';

const router = Router();

// Mount CMS routes
router.use('/kategori', kategoriRoutes);
router.use('/berita', beritaRoutes);
router.use('/halaman', halamanRoutes);
router.use('/media', mediaRoutes);

export default router;
