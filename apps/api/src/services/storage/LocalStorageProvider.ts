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
    const safeKey = key.replace(/\.\./g, '');
    const resolvedPath = path.resolve(this.uploadDir, safeKey);
    const resolvedUploadDir = path.resolve(this.uploadDir);
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      throw new Error("Invalid file path");
    }
    return resolvedPath;
  }

  private getPublicUrl(key: string): string {
    return `${this.baseUrl}/uploads/${key}`;
  }

  async upload(buffer: Buffer, options: UploadOptions = {}): Promise<StorageFile> {
    const {
      folder = '',
      filename,
      contentType = 'application/octet-stream',
      metadata = {},
    } = options;

    // Generate key
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const ext = path.extname(filename || '.bin').toLowerCase();
    const uuid = crypto.randomUUID();
    const key = path.join(folder, String(year), month, `${uuid}${ext}`);

    // Create directory if it doesn't exist
    const dirPath = path.join(this.uploadDir, folder, String(year), String(month));
    await fs.mkdir(dirPath, { recursive: true });

    // Write file
    const filePath = this.getFilePath(key);
    await fs.writeFile(filePath, buffer);

    return {
      key,
      url: this.getPublicUrl(key),
      size: buffer.length,
      mimeType: contentType,
      metadata,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    try {
      await fs.unlink(filePath);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
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
