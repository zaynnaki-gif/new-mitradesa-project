import express from 'express';
import { config } from './config/index.js';
import path from 'node:path';
import cors from 'cors';
import { requestLogger, securityHeaders, notFoundHandler, errorHandler, apiRateLimiter, authenticateAny, idempotencyMiddleware } from './middleware/index.js';
import healthRouter from './routes/health.js';
import dashboardRouter from './routes/dashboard.js';
import authRouter from './routes/auth/index.js';
import auditRouter from './routes/audit.js';
import identitasRouter from './routes/identitas-desa.js';
import pendudukRouter from './routes/penduduk/index.js';
import keluargaRouter from './routes/keluarga.js';
import wilayahRouter from './routes/wilayah.js';
import perangkatDesaRouter from './routes/perangkat-desa.js';
import referenceRouter from './routes/reference.js';
import kategoriRoutes from './routes/cms/kategori.js';
import beritaRoutes from './routes/cms/berita.js';
import halamanRoutes from './routes/cms/halaman.js';
import mediaRoutes from './routes/cms/media.js';
import serviceRoutes from './routes/service/index.js';
import publicRoutes from './routes/public/layanan.js';
import galeriRoutes from './routes/public/galeri.js';
import verifikasiRoutes from './routes/public/verifikasi.js';
import webhookRoutes from './routes/public/webhook.js';
import citizenRoutes from './routes/citizen/request.js';
import cmsAgendaRoutes from './routes/cms/agenda.js';
import cmsUmkmRoutes from './routes/cms/umkm.js';
import cmsTransparansiRoutes from './routes/cms/transparansi.js';
import apbdesItemRoutes from './routes/cms/apbdes-item.js';
import cmsPotensiRoutes from './routes/cms/potensi.js';
import arsipSuratRouter from './routes/arsip-surat.js';
import accountRoutes from './routes/sistem/accounts.js';
import configRoutes from './routes/sistem/config.js';
import blankoRoutes from './routes/sistem/blanko.js';
import kodeIsianRoutes from './routes/sistem/kode-isian.js';
import lembagaRoutes from './routes/lembaga.js';
import kasUmumRoutes from './routes/kas-umum.js';
import bumilRoutes from './routes/kesehatan/bumil.js';
import posyanduRoutes from './routes/kesehatan/posyandu.js';
import bansosRoutes from './routes/pemerintahan/bansos.js';
import saranRoutes from './routes/pemerintahan/saran.js';
import mutasiRoutes from './routes/penduduk/mutasi.js';

const app = express();

// Apply global middleware
app.use(requestLogger);
app.use(securityHeaders);
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(idempotencyMiddleware);
app.use(apiRateLimiter);

// Serve public static assets (images, logos, public media)
app.use('/uploads/public', express.static(path.resolve(config.uploadDir, 'public')));
app.use('/uploads/media', express.static(path.resolve(config.uploadDir, 'media')));

// Protect private/document assets with authentication
app.use('/uploads/documents', authenticateAny(), express.static(path.resolve(config.uploadDir, 'documents')));
app.use('/uploads/private', authenticateAny(), express.static(path.resolve(config.uploadDir, 'private')));

// Guard for legacy / general /uploads: protect private directories and require authentication for documents
app.use(
  '/uploads',
  (req, res, next) => {
    const cleanPath = req.path.replace(/\\/g, '/').toLowerCase();

    // Block any attempt to access /documents or /private via the root /uploads path
    if (cleanPath.startsWith('/documents') || cleanPath.startsWith('/private')) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Akses ke direktori dokumen privat ditolak' },
      });
      return;
    }

    // Require authentication for document formats
    const isDocument = /\.(pdf|docx?|xlsx?)$/i.test(cleanPath);
    if (isDocument) {
      void authenticateAny()(req, res, (err) => {
        if (err) {
          next(err);
          return;
        }
        // User successfully authenticated, proceed to express.static handler
        next();
      });
      return;
    }

    next();
  },
  express.static(path.resolve(config.uploadDir), { dotfiles: 'ignore', index: false })
);

// Health check routes (no auth required)
app.use('/api/health', healthRouter);

// Dashboard routes (auth required)
app.use('/api/dashboard', dashboardRouter);

// Auth routes (some require auth)
app.use('/api/auth', authRouter);

// Protected routes (auth required)
app.use('/api/audit-log', auditRouter);
app.use('/api/identitas', identitasRouter);
app.use('/api/penduduk', pendudukRouter);
app.use('/api/keluarga', keluargaRouter);
app.use('/api/wilayah', wilayahRouter);
app.use('/api/perangkat-desa', perangkatDesaRouter);
app.use('/api/reference', referenceRouter);
app.use('/api/kategori', kategoriRoutes);
app.use('/api/berita', beritaRoutes);
app.use('/api/halaman', halamanRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/agenda', cmsAgendaRoutes);
app.use('/api/umkm', cmsUmkmRoutes);
app.use('/api/transparansi', cmsTransparansiRoutes);
app.use('/api/transparansi', apbdesItemRoutes);
app.use('/api/cms/potensi', cmsPotensiRoutes);
app.use('/api/arsip-surat', arsipSuratRouter);
app.use('/api/accounts', accountRoutes);
app.use('/api/config', configRoutes);
app.use('/api/blanko', blankoRoutes);
app.use('/api/kode-isian', kodeIsianRoutes);
app.use('/api/lembaga', lembagaRoutes);
app.use('/api/kas-umum', kasUmumRoutes);

// Health / Kesehatan routes (with alias support for web client)
app.use('/api/bumil', bumilRoutes);
app.use('/api/kesehatan/bumil', bumilRoutes);
app.use('/api/posyandu', posyanduRoutes);
app.use('/api/kesehatan/posyandu', posyanduRoutes);

// Pemerintahan / Bansos / Saran (with alias support)
app.use('/api/bansos', bansosRoutes);
app.use('/api/pemerintahan/bansos', bansosRoutes);
app.use('/api/saran-aduan', saranRoutes);
app.use('/api/pemerintahan/saran', saranRoutes);

// Penduduk Mutasi (with alias support)
app.use('/api/mutasi-penduduk', mutasiRoutes);
app.use('/api/penduduk/mutasi', mutasiRoutes);

// Service Document Engine routes
app.use('/api', serviceRoutes);

// Public citizen routes (no auth required)
app.use('/api/public/layanan', publicRoutes);
app.use('/api/public/galeri', galeriRoutes);
app.use('/api/public/verify', verifikasiRoutes);
app.use('/api/public/webhook', webhookRoutes);
app.use('/api/citizen', citizenRoutes);

// API root
app.get('/api', (_req, res) => {
  res.json({
    success: true,
    data: {
      service: config.appName,
      version: config.appVersion,
      environment: config.nodeEnv,
      documentation: '/api/docs',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
