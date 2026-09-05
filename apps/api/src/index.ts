import 'dotenv/config';

// Patch BigInt serialization for JSON
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { config } from './config/index.js';
import { app } from './app.js';
import { prisma } from './services/prisma.js';
import { setServerDraining } from './utils/lifecycle.js';

// Verify Desa ID against database before starting
// eslint-disable-next-line no-console
async function verifyInstanceIdentity() {
  // eslint-disable-next-line no-console
  console.info(`[VERIFICATION] Memverifikasi Instance Desa (ID: ${config.desaId})...`);
  try {
    const desa = await prisma.desa.findUnique({
      where: { id: config.desaId },
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
