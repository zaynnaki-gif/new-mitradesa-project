import 'dotenv/config';

// Patch BigInt serialization for JSON
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { requestLogger, securityHeaders, errorHandler, notFoundHandler, apiRateLimiter, authenticateAny, idempotencyMiddleware } from './middleware/index.js';
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
import blankoRoutes from './routes/sistem/blanko.js';
import kodeIsianRoutes from './routes/sistem/kode-isian.js';
import { setServerDraining, isServerDraining } from './utils/lifecycle.js';

const app = express();

// System Lifecycle & Connection Draining State
app.use((req, res, next) => {
  if (isServerDraining() && !req.path.startsWith('/api/health')) {
    res.setHeader('Connection', 'close');
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVER_SHUTTING_DOWN',
        message: 'Server sedang menyelesaikan proses penutupan (graceful shutdown). Silakan coba sesaat lagi.',
      },
    });
    return;
  }
  next();
});

// Apply middleware
app.use(requestLogger);
app.use(securityHeaders);
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true
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
app.use('/api/transparansi', apbdesItemRoutes);
app.use('/api/cms/potensi', cmsPotensiRoutes);
app.use('/api/arsip-surat', arsipSuratRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/posyandu', posyanduRoutes);
app.use('/api/bumil', bumilRoutes);
app.use('/api/kas-umum', kasUmumRoutes);
app.use('/api/mutasi-penduduk', mutasiRoutes);
app.use('/api/bansos', bansosRoutes);
app.use('/api/saran-aduan', saranRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/blanko', blankoRoutes);
app.use('/api/kode-isian', kodeIsianRoutes);

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
// eslint-disable-next-line no-console
async function verifyInstanceIdentity() {
  // eslint-disable-next-line no-console
  console.info(`[VERIFICATION] Memverifikasi Instance Desa (ID: ${config.desaId})...`);
  try {
    const desa = await prisma.desa.findUnique({
      where: { id: config.desaId }
    });
    
    if (!desa) {
      // eslint-disable-next-line no-console
      console.error(`[FATAL ERROR] Instance Desa dengan ID ${config.desaId} tidak ditemukan di database.`);
      process.exit(1);
    }
    // eslint-disable-next-line no-console
    console.info(`[VERIFICATION] Instance valid: ${desa.nama}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[FATAL ERROR] Gagal memverifikasi database:`, err);
    process.exit(1);
  }
}

// Start server
const startServer = async () => {
  await verifyInstanceIdentity();

  const server = app.listen(config.apiPort, () => {
    // eslint-disable-next-line no-console
    console.info(`
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

    // Notify process manager (PM2 / systemd) that server is ready to accept traffic
    if (typeof process.send === 'function') {
      process.send('ready');
    }
  });

  // Graceful shutdown
  let shutdownInProgress = false;

  const shutdown = async (signal: string, exitCode = 0) => {
    if (shutdownInProgress) return;
    shutdownInProgress = true;
    setServerDraining(true);

    // eslint-disable-next-line no-console
    console.info(`\n[${signal}] Initiating graceful shutdown (draining in-flight requests)...`);

    // 1. Force close timer if draining takes too long
    const forceTimer = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error('[SHUTDOWN] Force shutdown timeout reached (10s). Terminating active connections...');
      if (typeof (server as any).closeAllConnections === 'function') {
        (server as any).closeAllConnections();
      }
      process.exit(exitCode || 1);
    }, 10000);
    forceTimer.unref();

    // 2. Stop accepting new connections and close idle keep-alive sockets immediately
    if (typeof (server as any).closeIdleConnections === 'function') {
      (server as any).closeIdleConnections();
    }

    server.close(async (closeErr) => {
      clearTimeout(forceTimer);
      if (closeErr) {
        // eslint-disable-next-line no-console
        console.error('[SHUTDOWN] Error closing HTTP server:', closeErr);
      } else {
        // eslint-disable-next-line no-console
        console.info('[SHUTDOWN] HTTP server closed and all requests drained.');
      }

      try {
        await prisma.$disconnect();
        // eslint-disable-next-line no-console
        console.info('[SHUTDOWN] PostgreSQL database connection pool released.');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[SHUTDOWN] Error releasing database connection:', err);
      }

      process.exit(exitCode);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM', 0));
  process.on('SIGINT', () => void shutdown('SIGINT', 0));
  process.on('SIGHUP', () => void shutdown('SIGHUP', 0));

  process.on('uncaughtException', (error) => {
    // eslint-disable-next-line no-console
    console.error('[FATAL PROCESS ERROR] Uncaught Exception:', error);
    void shutdown('UNCAUGHT_EXCEPTION', 1);
  });

  process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('[FATAL PROCESS ERROR] Unhandled Rejection:', reason);
    void shutdown('UNHANDLED_REJECTION', 1);
  });
};

startServer().catch((startupErr) => {
  // eslint-disable-next-line no-console
  console.error('[FATAL ERROR] Startup sequence failed:', startupErr);
  process.exit(1);
});

export default app;
