import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV', 'DESA_ID', 'DESA_KODE', 'DESA_NAMA'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`[FATAL ERROR] Required environment variable ${envVar} is missing.`);
    process.exit(1);
  }
}

// Hard Guard: PUBLIC_WEB_URL validation in production
if (process.env.NODE_ENV === 'production') {
  const publicUrl = process.env.PUBLIC_WEB_URL;
  if (!publicUrl || !publicUrl.trim()) {
    console.error('[FATAL CONFIG ERROR] PUBLIC_WEB_URL must be defined in production (e.g. https://serunimumbul.com)!');
    throw new Error('FATAL CONFIG ERROR: PUBLIC_WEB_URL must be set in production!');
  }
  if (publicUrl.includes('localhost') || publicUrl.includes('127.0.0.1')) {
    console.error(`[FATAL CONFIG ERROR] PUBLIC_WEB_URL cannot contain localhost or 127.0.0.1 in production! Received: ${publicUrl}`);
    throw new Error(`FATAL CONFIG ERROR: PUBLIC_WEB_URL cannot contain localhost or 127.0.0.1 in production! Received: ${publicUrl}`);
  }
}

export const config = {
  // Node environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  isDevelopment: process.env.NODE_ENV === 'development',

  // Server
  apiPort: parseInt(process.env.API_PORT || '3001', 10),
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  publicWebUrl: process.env.PUBLIC_WEB_URL || (process.env.NODE_ENV === 'production' ? '' : (process.env.WEB_URL || 'http://localhost:3000')),

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // JWT
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // CORS
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim()),

  // WhatsApp
  waApiUrl: process.env.WA_API_URL || '',
  waApiKey: process.env.WA_API_KEY || '',

  // Storage
  storageBackend: process.env.STORAGE_BACKEND || 'local',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB

  // Supabase Storage
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  supabaseBucket: process.env.SUPABASE_BUCKET || 'documents',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // App info
  appName: process.env.APP_NAME || 'MITRADESA',
  appVersion: '0.1.0',

  // Instance Identity
  desaId: BigInt(process.env.DESA_ID as string),
  desaKode: process.env.DESA_KODE as string,
  desaNama: process.env.DESA_NAMA as string
} as const;

export type Config = typeof config;
