import fs from 'fs/promises';
import path from 'path';
import { IStorageProvider, StorageFile, UploadOptions } from './types.js';
import { config } from '../../config/index.js';

/**
 * Local filesystem storage provider
 *
 * Stores files in a local directory structure:
 * uploads/{year}/{month}/{uuid}.{ext}
 */
export class LocalStorageProvider implements IStorageProvider {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = config.uploadDir || './uploads';
    this.baseUrl = config.apiUrl || 'http://localhost:3001';
  }

  private getFilePath(key: string): string {
    const safeKey = key.replace(/\.\./g, '').replace(/\\/g, '/');
    const parts = safeKey.split('/').filter(Boolean);
    const resolvedPath = path.resolve(this.uploadDir, ...parts);
    const resolvedUploadDir = path.resolve(this.uploadDir);
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      throw new Error("Invalid file path");
    }
    return resolvedPath;
  }

  private getPublicUrl(key: string): string {
    const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
    return `${this.baseUrl}/uploads/${normalizedKey}`;
  }

  async upload(buffer: Buffer, options: UploadOptions = {}): Promise<StorageFile> {
    const {
      folder = '',
      filename,
      contentType = 'application/octet-stream',
      metadata = {},
    } = options;

    // Generate POSIX key
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const ext = path.extname(filename || '.bin').toLowerCase();
    const uuid = crypto.randomUUID();
    
    const posixFolder = folder.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    const key = posixFolder 
      ? `${posixFolder}/${year}/${month}/${uuid}${ext}`
      : `${year}/${month}/${uuid}${ext}`;

    // Create directory if it doesn't exist
    const filePath = this.getFilePath(key);
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true });

    // Atomic write via temporary file to prevent race conditions and half-written files
    const tmpFilePath = `${filePath}.tmp.${crypto.randomUUID()}`;
    try {
      await fs.writeFile(tmpFilePath, buffer);
      await fs.rename(tmpFilePath, filePath);
    } catch (writeErr) {
      await fs.unlink(tmpFilePath).catch(() => {});
      throw writeErr;
    }

    return {
      key,
      url: this.getPublicUrl(key),
      size: buffer.length,
      mimeType: contentType,
      metadata,
    };
  }

  /**
   * Cleans up any stale temporary (.tmp.*) files left by crashed processes
   */
  async cleanupStaleTempFiles(maxAgeMs = 60 * 60 * 1000): Promise<number> {
    let deletedCount = 0;
    try {
      const scanDir = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.isFile() && entry.name.includes('.tmp.')) {
            try {
              const stat = await fs.stat(fullPath);
              if (Date.now() - stat.mtimeMs > maxAgeMs) {
                await fs.unlink(fullPath);
                deletedCount++;
              }
            } catch {
              // Ignore file locked or deleted concurrently
            }
          }
        }
      };
      await scanDir(this.uploadDir);
    } catch (err) {
      console.warn('Failed to cleanup stale temp files:', err);
    }
    return deletedCount;
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    try {
      await fs.unlink(filePath);
    } catch (error: unknown) {
      if ((error as Error & { code?: string }).code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, consider it deleted
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.getFilePath(key));
      return true;
    } catch {
      return false;
    }
  }

  getUrl(key: string): string {
    return this.getPublicUrl(key);
  }

  async getMetadata(key: string): Promise<StorageFile | null> {
    const filePath = this.getFilePath(key);
    try {
      const stats = await fs.stat(filePath);
      return {
        key,
        url: this.getPublicUrl(key),
        size: stats.size,
        mimeType: 'application/octet-stream', // Can't detect without magic bytes
      };
    } catch {
      return null;
    }
  }
}
