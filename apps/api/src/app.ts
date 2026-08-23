import express from 'express';
import { config } from './config/index.js';
import { requestLogger, securityHeaders, notFoundHandler, errorHandler, apiRateLimiter } from './middleware/index.js';
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
import arsipSuratRouter from './routes/arsip-surat.js';

const app = express();

// Apply global middleware
app.use(requestLogger);
app.use(securityHeaders);
app.use(apiRateLimiter);

// CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && config.allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return next();
});

// JSON body parser
app.use(express.json());

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
app.use('/api/arsip-surat', arsipSuratRouter);

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
