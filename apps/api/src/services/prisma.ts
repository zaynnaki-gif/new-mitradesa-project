import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Get the appropriate database URL based on environment
 */
function getDatabaseUrl(): string {
  // In test environment, ALWAYS use TEST_DATABASE_URL
  if (process.env.NODE_ENV === 'test') {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error('TEST_DATABASE_URL is required for test environment');
    }
    return process.env.TEST_DATABASE_URL;
  }
  // For development/production, use DATABASE_URL
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for non-test environments');
  }
  return process.env.DATABASE_URL;
}

function getPrismaConfig(): ConstructorParameters<typeof PrismaClient>[0] {
  const config: ConstructorParameters<typeof PrismaClient>[0] = {
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  };

  const dbUrl = getDatabaseUrl();
  const url = new URL(dbUrl);

  // Add connection pool limits to prevent exhaustion
  url.searchParams.set('connection_limit', process.env.NODE_ENV === 'test' ? '30' : '20');
  url.searchParams.set('pool_timeout', '30');

  (config as Record<string, unknown>).datasources = {
    db: { url: url.toString() },
  };

  return config;
}

// Create Prisma client based on environment
const prismaConfig = getPrismaConfig();
export const prisma = global.prisma || new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
