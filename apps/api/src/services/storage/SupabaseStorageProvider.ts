/**
 * Supabase Storage Provider
 *
 * Handles file uploads to Supabase Storage buckets.
 * Requires a storage bucket to be created in Supabase dashboard first.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorageProvider, StorageFile, UploadOptions } from './types.js';
import { config } from '../../config/index.js';

export class SupabaseStorageProvider implements IStorageProvider {
  private client: SupabaseClient;
  private bucketName: string;
  private baseUrl: string;

  constructor() {
    const supabaseUrl = config.supabaseUrl;
    const supabaseKey = config.supabaseServiceKey;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Service Key must be configured');
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.bucketName = config.supabaseBucket || 'documents';
    this.baseUrl = `${supabaseUrl}/storage/v1/object/public/${this.bucketName}`;
  }

  async upload(buffer: Buffer, options: UploadOptions = {}): Promise<StorageFile> {
    const {
      folder = '',
      filename,
      contentType = 'application/octet-stream',
      metadata = {},
    } = options;

    // Generate unique key
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const ext = this.getExtension(filename || '.bin');
    const uuid = crypto.randomUUID();
    const key = `${folder}/${year}/${month}/${uuid}${ext}`;

    // Upload to Supabase Storage
    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .upload(key, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload to Supabase Storage: ${error.message}`);
    }

    return {
      key: data.path,
      url: this.getUrl(data.path),
      size: buffer.length,
      mimeType: contentType,
      metadata,
    };
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucketName).remove([key]);

    if (error) {
      throw new Error(`Failed to delete from Supabase Storage: ${error.message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .download(key);

    if (error || !data) {
      return false;
    }

    return true;
  }

  getUrl(key: string): string {
    // For public buckets, use direct URL
    // For private buckets, you would need signed URLs
    return `${this.baseUrl}/${key}`;
  }

  async getMetadata(key: string): Promise<StorageFile | null> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .download(key);

      if (error || !data) {
        return null;
      }

      return {
        key,
        url: this.getUrl(key),
        size: data.size,
        mimeType: data.type || 'application/octet-stream',
      };
    } catch {
      return null;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .createSignedUrl(key, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  private getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === filename.length - 1) {
      return '';
    }
    return filename.slice(lastDot).toLowerCase();
  }
}
