import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageProvider, StorageFile, UploadOptions } from './types.js';

/**
 * S3-compatible storage provider
 *
 * Supports AWS S3, Cloudflare R2, MinIO, and other S3-compatible services.
 *
 * Environment variables required:
 * - STORAGE_PROVIDER=s3
 * - S3_ENDPOINT (optional, for non-AWS providers like R2)
 * - S3_REGION
 * - S3_BUCKET
 * - S3_ACCESS_KEY_ID
 * - S3_SECRET_ACCESS_KEY
 * - S3_PUBLIC_URL (optional, for custom domains)
 * - S3_SIGNED_URL_EXPIRES (optional, default 3600 seconds)
 */
export class S3StorageProvider implements IStorageProvider {
  private client: S3Client;
  private bucket: string;
  private region: string;
  private endpoint?: string;
  private publicUrl?: string;
  private signedUrlExpires: number;

  constructor() {
    this.bucket = process.env.S3_BUCKET || '';
    this.region = process.env.S3_REGION || 'us-east-1';
    this.endpoint = process.env.S3_ENDPOINT;
    this.publicUrl = process.env.S3_PUBLIC_URL;
    this.signedUrlExpires = parseInt(process.env.S3_SIGNED_URL_EXPIRES || '3600', 10);

    // Validate required configuration
    if (!this.bucket) {
      throw new Error('S3_BUCKET environment variable is required');
    }

    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY environment variables are required');
    }

    // Initialize S3 client with optional custom endpoint (for R2, MinIO, etc.)
    const clientConfig: {
      region: string;
      credentials: { accessKeyId: string; secretAccessKey: string };
      endpoint?: string;
      forcePathStyle?: boolean;
    } = {
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    // For S3-compatible services like R2 and MinIO, we need forcePathStyle
    if (this.endpoint) {
      clientConfig.endpoint = this.endpoint;
      clientConfig.forcePathStyle = true;
    }

    this.client = new S3Client(clientConfig);
  }

  private getKey(key: string): string {
    // Remove leading slash if present
    return key.replace(/^\/+/, '');
  }

  private buildUrl(key: string): string {
    const k = this.getKey(key);
    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, '')}/${k}`;
    }
    if (this.endpoint) {
      return `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${k}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${k}`;
  }

  /**
   * Upload a file to S3
   */
  async upload(buffer: Buffer, options: UploadOptions = {}): Promise<StorageFile> {
    const {
      folder = '',
      filename,
      contentType = 'application/octet-stream',
      metadata = {},
    } = options;

    // Generate key with date-based path for organization
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const ext = path.extname(filename || '.bin').toLowerCase();
    const uuid = crypto.randomUUID();
    const key = this.getKey(`${folder}/${year}/${month}/${uuid}${ext}`);

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata as Record<string, string>,
      });

      await this.client.send(command);

      return {
        key,
        url: this.buildUrl(key),
        size: buffer.length,
        mimeType: contentType,
        metadata,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`S3 upload failed: ${message}`);
    }
  }

  /**
   * Delete a file from S3
   */
  async delete(key: string): Promise<void> {
    const k = this.getKey(key);

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: k,
      });

      await this.client.send(command);
    } catch (error) {
      // S3 delete is idempotent - file not found is OK
      if ((error as { name?: string }).name === 'NoSuchKey') {
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`S3 delete failed: ${message}`);
    }
  }

  /**
   * Check if a file exists in S3
   */
  async exists(key: string): Promise<boolean> {
    const k = this.getKey(key);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: k,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      // NotFound or NoSuchKey means file doesn't exist
      if ((error as { name?: string }).name === 'NoSuchKey') {
        return false;
      }
      // Other errors should propagate
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`S3 exists check failed: ${message}`);
    }
  }

  /**
   * Get the public URL for a file
   * For private buckets, this returns a signed URL
   */
  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    const k = this.getKey(key);
    const expires = expiresIn || this.signedUrlExpires;

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: k,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn: expires });
      return url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`S3 signed URL generation failed: ${message}`);
    }
  }

  getUrl(key: string): string {
    return this.buildUrl(key);
  }

  /**
   * Get metadata for a file in S3
   */
  async getMetadata(key: string): Promise<StorageFile | null> {
    const k = this.getKey(key);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: k,
      });

      const response = await this.client.send(command);

      return {
        key: k,
        url: this.buildUrl(k),
        size: response.ContentLength || 0,
        mimeType: response.ContentType || 'application/octet-stream',
        metadata: response.Metadata || {},
      };
    } catch (error) {
      // NotFound means file doesn't exist
      if ((error as { name?: string }).name === 'NoSuchKey') {
        return null;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`S3 getMetadata failed: ${message}`);
    }
  }
}
