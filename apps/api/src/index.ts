import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { requestLogger, securityHeaders, errorHandler, notFoundHandler, apiRateLimiter } from './middleware/index.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth/index.js';
import auditRouter from './routes/audit.js';
import identitasRouter from './routes/identitas-desa.js';
import pendudukRouter from './routes/penduduk/index.js';
import keluargaRouter from './routes/keluarga.js';
import wilayahRouter from './routes/wilayah.js';
import lembagaRouter from './routes/lembaga.js';
import perangkatDesaRouter from './routes/perangkat-desa.js';
import referenceRouter from './routes/reference.js';
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
import citizenRoutes from './routes/citizen/request.js';
import cmsAgendaRoutes from './routes/cms/agenda.js';
import cmsUmkmRoutes from './routes/cms/umkm.js';
import cmsTransparansiRoutes from './routes/cms/transparansi.js';
import cmsPotensiRoutes from './routes/cms/potensi.js';
import publicPotensiRoutes from './routes/public/potensi.js';
import arsipSuratRoutes from './routes/arsip-surat.js';
import dashboardRoutes from './routes/dashboard.js';
import posyanduRoutes from './routes/kesehatan/posyandu.js';
import kasUmumRoutes from './routes/kas-umum.js';
import bumilRoutes from './routes/kesehatan/bumil.js';
import apbdesItemRoutes from './routes/cms/apbdes-item.js';
import mutasiRoutes from './routes/penduduk/mutasi.js';
import bansosRoutes from './routes/pemerintahan/bansos.js';
import saranRoutes from './routes/pemerintahan/saran.js';
import accountsRoutes from './routes/sistem/accounts.js';
import configRoutes from './routes/sistem/config.js';

const app = express();

// Apply middleware
app.use(requestLogger);
app.use(securityHeaders);
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(apiRateLimiter);

// Health check route
app.use('/api/health', healthRouter);

// Auth routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/audit-log', auditRouter);
app.use('/api/identitas', identitasRouter);
app.use('/api/penduduk', pendudukRouter);
app.use('/api/keluarga', keluargaRouter);
app.use('/api/lembaga', lembagaRouter);
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
app.use('/api/arsip-surat', arsipSuratRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/posyandu', posyanduRoutes);
app.use('/api/bumil', bumilRoutes);
app.use('/api/cms/agenda', cmsAgendaRoutes);
app.use('/api/cms/umkm', cmsUmkmRoutes);
app.use('/api/cms/transparansi', cmsTransparansiRoutes);
app.use('/api/cms/transparansi', apbdesItemRoutes);
app.use('/api/cms/potensi', cmsPotensiRoutes);
app.use('/api/kas-umum', kasUmumRoutes);
app.use('/api/mutasi-penduduk', mutasiRoutes);
app.use('/api/bansos', bansosRoutes);
app.use('/api/saran-aduan', saranRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/config', configRoutes);

// Service Document Engine routes
app.use('/api', serviceRoutes);

// Public citizen routes (no auth required)
app.use('/api/public/layanan', publicRoutes);
app.use('/api/public/umkm', umkmRoutes);
app.use('/api/public/transparansi', transparansiRoutes);
app.use('/api/public/agenda', agendaRoutes);
app.use('/api/public/potensi', publicPotensiRoutes);
app.use('/api/public/galeri', galeriRoutes);
app.use('/api/public/berita', publicBeritaRoutes);
app.use('/api/public/halaman', publicHalamanRoutes);
app.use('/api/public/statistik', publicStatistikRoutes);
app.use('/api/citizen', citizenRoutes);

// API root
app.get('/api', (_req, res) => {
  res.json({
    success: true,
    data: {
      service: config.appName,
      version: config.appVersion,
      environment: config.nodeEnv
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Import Prisma client for DB verification
import { prisma } from './services/prisma.js';

// Verify Desa ID against database before starting
async function verifyInstanceIdentity() {
  console.log(`[VERIFICATION] Memverifikasi Instance Desa (ID: ${config.desaId})...`);
  try {
    const desa = await prisma.desa.findUnique({
      where: { id: config.desaId }
    });
    
    if (!desa) {
      console.error(`[FATAL ERROR] Instance Desa dengan ID ${config.desaId} tidak ditemukan di database.`);
      process.exit(1);
    }
    console.log(`[VERIFICATION] Instance valid: ${desa.nama}`);
  } catch (err) {
    console.error(`[FATAL ERROR] Gagal memverifikasi database:`, err);
    process.exit(1);
  }
}

// Start server
const startServer = async () => {
  await verifyInstanceIdentity();

  const server = app.listen(config.apiPort, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ${config.appName.toUpperCase().padEnd(51)}║
║   ${`Manajemen Informasi dan Administrasi Desa`.padEnd(51)}║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║   Server:      ${`http://localhost:${config.apiPort}`.padEnd(40)}║
║   Environment:  ${config.nodeEnv.toUpperCase().padEnd(40)}║
║   Version:      ${config.appVersion.padEnd(40)}║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
  });

  // Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n[${signal}] Shutting down gracefully...`);
  server.close(async () => {
    console.log('[SHUTDOWN] HTTP server closed');
    try {
      await prisma.$disconnect();
      console.log('[SHUTDOWN] Database connection closed');
    } catch (err) {
      console.error('[SHUTDOWN] Error closing database connection:', err);
    }
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('[SHUTDOWN] Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();

export default app;
