import express from 'express';
import { config } from './config/index.js';
import { configureSecurityMiddleware } from './middleware/security.js';
import { notFoundHandler, errorHandler } from './middleware/index.js';

// Route Handlers
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
import lembagaRouter from './routes/lembaga.js';
import kasUmumRoutes from './routes/kas-umum.js';
import kategoriRoutes from './routes/cms/kategori.js';
import beritaRoutes from './routes/cms/berita.js';
import halamanRoutes from './routes/cms/halaman.js';
import mediaRoutes from './routes/cms/media.js';
import serviceRoutes from './routes/service/index.js';
import publicRoutes from './routes/public/layanan.js';
import umkmRoutes from './routes/public/umkm.js';
import transparansiRoutes from './routes/public/transparansi.js';
import agendaRoutes from './routes/public/agenda.js';
import galeriRoutes from './routes/public/galeri.js';
import publicBeritaRoutes from './routes/public/berita.js';
import publicHalamanRoutes from './routes/public/halaman.js';
import publicStatistikRoutes from './routes/public/statistik.js';
import publicPotensiRoutes from './routes/public/potensi.js';
import verifikasiRoutes from './routes/public/verifikasi.js';
import webhookRoutes from './routes/public/webhook.js';
import citizenRoutes from './routes/citizen/request.js';
import cmsAgendaRoutes from './routes/cms/agenda.js';
import cmsUmkmRoutes from './routes/cms/umkm.js';
import cmsTransparansiRoutes from './routes/cms/transparansi.js';
import apbdesItemRoutes from './routes/cms/apbdes-item.js';
import cmsPotensiRoutes from './routes/cms/potensi.js';
import arsipSuratRoutes from './routes/arsip-surat.js';
import accountsRoutes from './routes/sistem/accounts.js';
import configRoutes from './routes/sistem/config.js';
import blankoRoutes from './routes/sistem/blanko.js';
import kodeIsianRoutes from './routes/sistem/kode-isian.js';
import bumilRoutes from './routes/kesehatan/bumil.js';
import posyanduRoutes from './routes/kesehatan/posyandu.js';
import bansosRoutes from './routes/pemerintahan/bansos.js';
import saranRoutes from './routes/pemerintahan/saran.js';
import mutasiRoutes from './routes/penduduk/mutasi.js';

export function createApp(): express.Express {
  const app = express();

  // 1. Mount centralized security, lifecycle draining, rate limiting, and static protection
  configureSecurityMiddleware(app);

  // 2. Health check (public, unauthenticated)
  app.use('/api/health', healthRouter);

  // 3. Auth routes
  app.use('/api/auth', authRouter);

  // 4. Core administrative & master routes
  app.use('/api/audit-log', auditRouter);
  app.use('/api/identitas', identitasRouter);
  app.use('/api/penduduk', pendudukRouter);
  app.use('/api/keluarga', keluargaRouter);
  app.use('/api/lembaga', lembagaRouter);
  app.use('/api/wilayah', wilayahRouter);
  app.use('/api/perangkat-desa', perangkatDesaRouter);
  app.use('/api/reference', referenceRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/accounts', accountsRoutes);
  app.use('/api/config', configRoutes);
  app.use('/api/blanko', blankoRoutes);
  app.use('/api/kode-isian', kodeIsianRoutes);
  app.use('/api/arsip-surat', arsipSuratRoutes);
  app.use('/api/kas-umum', kasUmumRoutes);

  // 5. CMS routes
  app.use('/api/kategori', kategoriRoutes);
  app.use('/api/berita', beritaRoutes);
  app.use('/api/halaman', halamanRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/agenda', cmsAgendaRoutes);
  app.use('/api/umkm', cmsUmkmRoutes);
  app.use('/api/transparansi', cmsTransparansiRoutes);
  app.use('/api/transparansi', apbdesItemRoutes);
  app.use('/api/cms/potensi', cmsPotensiRoutes);

  // 6. Canonical routes with legacy aliases (both point to the identical router instance)
  // Kesehatan: Canonical is /api/kesehatan/*, legacy alias is /api/*
  app.use('/api/kesehatan/bumil', bumilRoutes);
  app.use('/api/bumil', bumilRoutes);

  app.use('/api/kesehatan/posyandu', posyanduRoutes);
  app.use('/api/posyandu', posyanduRoutes);

  // Pemerintahan: Canonical is /api/pemerintahan/*, legacy alias is /api/*
  app.use('/api/pemerintahan/bansos', bansosRoutes);
  app.use('/api/bansos', bansosRoutes);

  app.use('/api/pemerintahan/saran', saranRoutes);
  app.use('/api/saran-aduan', saranRoutes);

  // Penduduk Mutasi: Canonical is /api/penduduk/mutasi, legacy alias is /api/mutasi-penduduk
  app.use('/api/penduduk/mutasi', mutasiRoutes);
  app.use('/api/mutasi-penduduk', mutasiRoutes);

  // 7. Service Document Engine routes
  app.use('/api', serviceRoutes);

  // 8. Public citizen routes (no auth required)
  app.use('/api/public/layanan', publicRoutes);
  app.use('/api/public/umkm', umkmRoutes);
  app.use('/api/public/transparansi', transparansiRoutes);
  app.use('/api/public/agenda', agendaRoutes);
  app.use('/api/public/potensi', publicPotensiRoutes);
  app.use('/api/public/galeri', galeriRoutes);
  app.use('/api/public/berita', publicBeritaRoutes);
  app.use('/api/public/halaman', publicHalamanRoutes);
  app.use('/api/public/statistik', publicStatistikRoutes);
  app.use('/api/public/verify', verifikasiRoutes);
  app.use('/api/public/verifikasi', verifikasiRoutes);
  app.use('/api/public/webhook', webhookRoutes);
  app.use('/api/citizen', citizenRoutes);

  // 9. API root
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

  // 10. Error & 404 handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
