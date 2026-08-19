import { IStorageProvider } from './types.js';
import { LocalStorageProvider } from './LocalStorageProvider.js';
import { S3StorageProvider } from './S3StorageProvider.js';

let storageProvider: IStorageProvider | null = null;

/**
 * Get the configured storage provider based on STORAGE_PROVIDER environment variable.
 *
 * Supported providers:
 * - 'local' (default): Local filesystem storage
 * - 's3': AWS S3 or S3-compatible storage (Cloudflare R2, MinIO, etc.)
 */
export function getStorageProvider(): IStorageProvider {
  if (storageProvider) {
    return storageProvider;
  }

  const backend = process.env.STORAGE_PROVIDER || 'local';

  switch (backend) {
    case 's3':
      try {
        storageProvider = new S3StorageProvider();
      } catch (error) {
        console.warn('S3 storage provider failed to initialize, falling back to local:', error);
        storageProvider = new LocalStorageProvider();
      }
      break;
    case 'local':
    default:
      storageProvider = new LocalStorageProvider();
      break;
  }

  return storageProvider;
}

/**
 * Reset the storage provider (useful for testing)
 */
export function resetStorageProvider(): void {
  storageProvider = null;
}
