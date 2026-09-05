import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Get the appropriate database URL based on environment
 */
function getDatabaseUrl(): string {
  if (process.env.NODE_ENV === 'test') {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error('TEST_DATABASE_URL is required for test environment');
    }
    return process.env.TEST_DATABASE_URL;
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for non-test environments');
  }
  return process.env.DATABASE_URL;
}

function getPrismaConfig(): ConstructorParameters<typeof PrismaClient>[0] {
  const dbUrl = new URL(getDatabaseUrl());

  // Connection tuning for resilience:
  // - connection_limit: limits concurrent connections
  // - pool_timeout: time to wait for a connection from the pool
  // - socket_timeout: time to wait for I/O
  // - connect_timeout: time to wait for initial connection
  dbUrl.searchParams.set('connection_limit', process.env.NODE_ENV === 'test' ? '15' : '8');
  dbUrl.searchParams.set('pool_timeout', '30');
  dbUrl.searchParams.set('socket_timeout', '60');
  dbUrl.searchParams.set('connect_timeout', '10');
  // Enable TCP keepalives to prevent idle connection dropping by load balancers/proxies
  dbUrl.searchParams.set('tcpKeepAlive', 'true');

  return {
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: { url: dbUrl.toString() },
    },
  };
}

const prismaConfig = getPrismaConfig();
const client = global.prisma || new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== 'production') {
  global.prisma = client;
}

export const prisma = client;

/**
 * Production keepalive ping — prevents Supabase PgBouncer from closing idle
 * connections after 5 minutes of inactivity.
 *
 * Without this, a quiet server will show:
 *   GET /api/health → 200 OK  (no DB query)
 *   POST /api/auth/login → 500 Internal Error (Prisma hangs forever waiting for
 *     a connection that the pool can never provide because all conns are stale)
 *
 * On ping failure we exit with code 1 so Hostinger's lsnode immediately restarts
 * the process with a fresh, healthy connection pool.
 */
if (process.env.NODE_ENV === 'production') {
  const PING_INTERVAL_MS = 55_000; // 55 seconds — well within Supabase's 5m idle timeout

  const keepAlivePing = async (): Promise<void> => {
    try {
      await client.$queryRaw`SELECT 1 AS ping`;
    } catch (err) {
      console.error(
        '[PRISMA KEEPALIVE] DB ping failed — connection pool broken. Exiting for clean restart:',
        err
      );
      process.exit(1);
    }
  };

  // Warm-up: establish connection immediately on startup
  void keepAlivePing();

  // Schedule recurring keepalive
  const timer = setInterval(() => void keepAlivePing(), PING_INTERVAL_MS);
  // Don't prevent graceful shutdown
  if (timer.unref) timer.unref();
}
