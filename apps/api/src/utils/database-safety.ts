/**
 * Database Safety Guard
 *
 * Prevents destructive test operations from running against production/development databases.
 * This module must be imported before any database operations in test files.
 */

// Database names/hosts that indicate production or development
const PROTECTED_DATABASES = [
  'postgres',           // Common production name
  'mitradesa',         // Production database
  'supabase',          // Supabase hosted
  'production',
  'prod',
];

const PROTECTED_HOSTS = [
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'db.supabase.co',
  'localhost',
  '127.0.0.1',
];

/**
 * Validate that the database is safe for test operations
 */
export function validateTestDatabase(): { safe: boolean; reason?: string } {
  const nodeEnv = process.env.NODE_ENV;

  // If not in test environment, we shouldn't be running test code at all
  if (nodeEnv !== 'test') {
    return {
      safe: false,
      reason: `NODE_ENV is "${nodeEnv}", expected "test". Refusing to run test operations.`,
    };
  }

  // In test mode, require TEST_DATABASE_URL explicitly
  // This prevents accidental use of production DATABASE_URL
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  const defaultDatabaseUrl = process.env.DATABASE_URL;

  if (!testDatabaseUrl) {
    if (defaultDatabaseUrl) {
      return {
        safe: false,
        reason: `TEST_DATABASE_URL is not set, but DATABASE_URL is pointing to: ${getDatabaseHostInfo(defaultDatabaseUrl).host}

CRITICAL SAFETY VIOLATION:
Tests must use a dedicated test database, not DATABASE_URL.

SOLUTION:
1. Set TEST_DATABASE_URL to a dedicated test database
2. Do NOT use production/development DATABASE_URL for tests
3. Example: TEST_DATABASE_URL="postgresql://user:pass@host:5432/mitradesa_test"`,
      };
    }
    return {
      safe: false,
      reason: 'Neither TEST_DATABASE_URL nor DATABASE_URL found in environment',
    };
  }

  // Parse the TEST_DATABASE_URL
  let host: string;
  let database: string;

  try {
    const url = new URL(testDatabaseUrl);
    host = url.hostname;
    database = url.pathname.replace(/^\//, '');
  } catch {
    return {
      safe: false,
      reason: 'TEST_DATABASE_URL has invalid format',
    };
  }

  // Check if host is protected
  const isProtectedHost = PROTECTED_HOSTS.some(
    (protectedHost) =>
      host === protectedHost || host.endsWith(`.${protectedHost}`)
  );

  // Check if database name is protected
  const isProtectedDatabase = PROTECTED_DATABASES.some(
    (protectedDb) => database.toLowerCase() === protectedDb.toLowerCase()
  );

  // If connecting to protected host AND protected database in test mode, it's a VIOLATION
  if (isProtectedHost && isProtectedDatabase) {
    return {
      safe: false,
      reason: `CRITICAL: Test database is a PRODUCTION database!
Host: ${host}
Database: ${database}
NODE_ENV: ${nodeEnv}

This is a SAFETY VIOLATION. Tests must NEVER run against production databases.

SOLUTION:
1. Create a dedicated test database (e.g., "mitradesa_test")
2. Set TEST_DATABASE_URL to the test database
3. Verify the database is isolated from production`,
    };
  }

  // Additional check: if it's a Supabase URL and "postgres" database, it's likely production
  if (testDatabaseUrl.includes('supabase') && database === 'postgres') {
    return {
      safe: false,
      reason: `TEST_DATABASE_URL appears to be the PRODUCTION "postgres" database on Supabase.

The "postgres" database on Supabase is typically the production database.

SOLUTION:
Create a dedicated test database:
1. Go to Supabase Dashboard > Database
2. Create a new database (e.g., "mitradesa_test")
3. Set TEST_DATABASE_URL to the new database`,
    };
  }

  // Check for test-specific database naming
  const isTestDatabase =
    database.toLowerCase().includes('test') ||
    database.toLowerCase().includes('testing') ||
    database.toLowerCase().includes('_test') ||
    database.toLowerCase().includes('-test');

  if (!isTestDatabase) {
    return {
      safe: false,
      reason: `Database "${database}" does not appear to be a dedicated test database.

Test databases should have names like:
- mitradesa_test
- mitradesa_testing
- test_mitradesa

SOLUTION:
1. Create a dedicated test database with a test-specific name
2. Set TEST_DATABASE_URL to the new database`,
    };
  }

  return { safe: true };
}

function getDatabaseHostInfo(url: string): { host: string; database: string } {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.host,
      database: parsed.pathname.replace(/^\//, '') || 'unknown',
    };
  } catch {
    return { host: 'unknown', database: 'unknown' };
  }
}

/**
 * Assert that the test database is safe to use
 * Throws an error if not safe
 */
export function assertTestDatabase(): void {
  const result = validateTestDatabase();

  if (!result.safe) {
    throw new Error(
      `DATABASE SAFETY FAILURE:\n\n${result.reason}`
    );
  }
}

/**
 * Create a test-safe PrismaClient with limited connections
 */
export function createTestPrismaClient(): unknown {
  // First validate we're in a safe environment
  assertTestDatabase();

  const databaseUrl = process.env.TEST_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('TEST_DATABASE_URL is not set');
  }

  // Parse URL to add test-safe connection settings
  const url = new URL(databaseUrl);
  url.searchParams.set('connection_limit', '30');
  url.searchParams.set('pool_timeout', '30');
  url.searchParams.set('connect_timeout', '10');

  // Dynamic import to avoid circular dependency
  return { url: url.toString() };
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return !!(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.JENKINS_HOME ||
    process.env.TRAVIS
  );
}
