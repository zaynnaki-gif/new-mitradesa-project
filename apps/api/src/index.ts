import 'dotenv/config';
import { initSentry } from './config/sentry.js';
initSentry();
// Patch BigInt serialization for JSON
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { config } from './config/index.js';
import { app } from './app.js';
import { prisma } from './services/prisma.js';
import { setServerDraining } from './utils/lifecycle.js';
import http from 'http';

// Verify instance identity against database (single-tenant: just check IdentitasDesa exists)
async function verifyInstanceIdentity() {
  // eslint-disable-next-line no-console
  console.info(`[VERIFICATION] Memverifikasi Instance Desa (${config.desaNama})...`);
  try {
    const desa = await prisma.identitasDesa.findFirst();
    
    if (!desa) {
      console.warn(`[VERIFICATION] IdentitasDesa belum dikonfigurasi di database. Silakan isi data identitas desa melalui panel admin.`);
    } else {
      // eslint-disable-next-line no-console
      console.info(`[VERIFICATION] Instance valid: ${desa.namaDesa}`);
    }
  } catch (err) {
    console.error(`[FATAL ERROR] Gagal memverifikasi database:`, err);
  }
}

// Start server
const startServer = async () => {
  const listenPort = process.env.PORT || config.apiPort;
  const server = app.listen(listenPort, () => {
    // eslint-disable-next-line no-console
    console.info(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ${config.appName.toUpperCase().padEnd(51)}║
║   ${`Manajemen Informasi dan Administrasi Desa`.padEnd(51)}║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║   Server:      ${`http://localhost:${listenPort}`.padEnd(40)}║
║   Environment:  ${config.nodeEnv.toUpperCase().padEnd(40)}║
║   Version:      ${config.appVersion.padEnd(40)}║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);

    // Run instance identity check
    void verifyInstanceIdentity();

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
      if (typeof (server as http.Server).closeAllConnections === 'function') {
        (server as http.Server).closeAllConnections();
      }
      process.exit(exitCode || 1);
    }, 10000);
    forceTimer.unref();

    // 2. Stop accepting new connections and close idle keep-alive sockets immediately
    if (typeof (server as http.Server).closeIdleConnections === 'function') {
      (server as http.Server).closeIdleConnections();
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
