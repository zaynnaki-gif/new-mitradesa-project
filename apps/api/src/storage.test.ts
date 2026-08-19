/**
 * Storage Provider Tests
 *
 * Tests for LocalStorageProvider and S3StorageProvider.
 * Uses actual storage operations to verify functionality.
 */

import fs from 'fs/promises';
import path from 'path';
import { LocalStorageProvider } from './services/storage/LocalStorageProvider';
import { S3StorageProvider } from './services/storage/S3StorageProvider';
import { IStorageProvider, StorageFile, validateMimeType, validateExtension } from './services/storage/types';

// Test constants
const TEST_FILE_CONTENT = 'Hello, this is a test file for storage validation!';
const TEST_BUFFER = Buffer.from(TEST_FILE_CONTENT, 'utf-8');

describe('Storage Validation Helpers', () => {
  describe('validateMimeType', () => {
    it('should accept valid image MIME types', () => {
      expect(validateMimeType('image/jpeg')).toBe(true);
      expect(validateMimeType('image/png')).toBe(true);
      expect(validateMimeType('image/gif')).toBe(true);
      expect(validateMimeType('image/webp')).toBe(true);
      expect(validateMimeType('image/svg+xml')).toBe(true);
    });

    it('should accept valid document MIME types', () => {
      expect(validateMimeType('application/pdf')).toBe(true);
      expect(validateMimeType('application/msword')).toBe(true);
      expect(validateMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
      expect(validateMimeType('text/plain')).toBe(true);
    });

    it('should reject dangerous MIME types', () => {
      expect(validateMimeType('application/javascript')).toBe(false);
      expect(validateMimeType('text/html')).toBe(false);
      expect(validateMimeType('application/x-php')).toBe(false);
      expect(validateMimeType('application/x-executable')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(validateMimeType('IMAGE/JPEG')).toBe(true);
      expect(validateMimeType('Image/PNG')).toBe(true);
    });
  });

  describe('validateExtension', () => {
    it('should accept valid extensions', () => {
      expect(validateExtension('image.jpg')).toBe(true);
      expect(validateExtension('image.jpeg')).toBe(true);
      expect(validateExtension('image.png')).toBe(true);
      expect(validateExtension('image.gif')).toBe(true);
      expect(validateExtension('image.webp')).toBe(true);
      expect(validateExtension('image.svg')).toBe(true);
      expect(validateExtension('document.pdf')).toBe(true);
    });

    it('should reject dangerous extensions', () => {
      expect(validateExtension('script.js')).toBe(false);
      expect(validateExtension('shell.php')).toBe(false);
      expect(validateExtension('exploit.html')).toBe(false);
      expect(validateExtension('executable.exe')).toBe(false);
      expect(validateExtension('bypass.jsp')).toBe(false);
    });

    it('should reject double extensions', () => {
      expect(validateExtension('image.jpg.exe')).toBe(false);
      expect(validateExtension('document.pdf.js')).toBe(false);
      expect(validateExtension('photo.png.php')).toBe(false);
    });

    it('should reject path traversal attempts', () => {
      expect(validateExtension('../etc/passwd')).toBe(false);
      expect(validateExtension('..\\windows\\system32')).toBe(false);
      expect(validateExtension('file/../../../etc/passwd')).toBe(false);
    });

    it('should reject files without extensions', () => {
      expect(validateExtension('noextension')).toBe(false);
    });
  });
});

describe('LocalStorageProvider', () => {
  let storage: LocalStorageProvider;
  const uploadDir = path.join(__dirname, '../../test-uploads');

  beforeAll(async () => {
    storage = new LocalStorageProvider();
    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup test uploads
    try {
      await fs.rm(uploadDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('upload', () => {
    it('should upload a file and return StorageFile', async () => {
      const result = await storage.upload(TEST_BUFFER, {
        filename: 'test.txt',
        contentType: 'text/plain',
      });

      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('mimeType');
      expect(result.size).toBe(TEST_BUFFER.length);
      expect(result.mimeType).toBe('text/plain');
    });

    it('should generate unique keys', async () => {
      const result1 = await storage.upload(TEST_BUFFER, { filename: 'test1.txt' });
      const result2 = await storage.upload(TEST_BUFFER, { filename: 'test2.txt' });

      expect(result1.key).not.toBe(result2.key);
    });

    it('should organize files by date', async () => {
      const result = await storage.upload(TEST_BUFFER, { filename: 'dated.txt' });

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');

      // Normalize path separator for cross-platform compatibility
      const normalizedKey = result.key.replace(/[\\/]/g, '/');
      expect(normalizedKey).toContain(`${year}/${month}/`);
    });

    it('should handle different content types', async () => {
      const imageBuffer = Buffer.from('fake image data');
      const result = await storage.upload(imageBuffer, {
        filename: 'test.png',
        contentType: 'image/png',
      });

      expect(result.mimeType).toBe('image/png');
    });
  });

  describe('exists', () => {
    it('should return true for existing files', async () => {
      const result = await storage.upload(TEST_BUFFER, { filename: 'exists.txt' });
      const exists = await storage.exists(result.key);

      expect(exists).toBe(true);
    });

    it('should return false for non-existing files', async () => {
      const exists = await storage.exists('non-existent-key-12345.txt');

      expect(exists).toBe(false);
    });
  });

  describe('getUrl', () => {
    it('should return a valid URL', async () => {
      const result = await storage.upload(TEST_BUFFER, { filename: 'url-test.txt' });
      const url = storage.getUrl(result.key);

      expect(url).toContain('/uploads/');
      expect(url).toContain(result.key);
    });
  });

  describe('getMetadata', () => {
    it('should return file metadata', async () => {
      const result = await storage.upload(TEST_BUFFER, {
        filename: 'metadata.txt',
        contentType: 'text/plain',
      });

      const metadata = await storage.getMetadata(result.key);

      expect(metadata).not.toBeNull();
      expect(metadata?.key).toBe(result.key);
      expect(metadata?.size).toBe(TEST_BUFFER.length);
    });

    it('should return null for non-existing files', async () => {
      const metadata = await storage.getMetadata('non-existent-key-12345.txt');

      expect(metadata).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing files', async () => {
      const result = await storage.upload(TEST_BUFFER, { filename: 'to-delete.txt' });
      expect(await storage.exists(result.key)).toBe(true);

      await storage.delete(result.key);
      expect(await storage.exists(result.key)).toBe(false);
    });

    it('should not throw for non-existing files', async () => {
      await expect(
        storage.delete('non-existent-key-12345.txt')
      ).resolves.not.toThrow();
    });
  });
});

describe('S3StorageProvider', () => {
  // Note: These tests require actual S3 credentials in environment
  // Skip if credentials are not available
  const hasS3Credentials =
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY;

  const skipIfNoCredentials = hasS3Credentials ? describe : describe.skip;

  skipIfNoCredentials('S3StorageProvider (requires credentials)', () => {
    let storage: S3StorageProvider;
    const uploadedKeys: string[] = [];

    beforeAll(() => {
      storage = new S3StorageProvider();
    });

    afterAll(async () => {
      // Cleanup uploaded test files
      for (const key of uploadedKeys) {
        try {
          await storage.delete(key);
        } catch {
          // Ignore cleanup errors
        }
      }
    });

    describe('upload', () => {
      it('should upload a file to S3', async () => {
        const result = await storage.upload(TEST_BUFFER, {
          filename: 's3-test.txt',
          contentType: 'text/plain',
        });

        expect(result).toHaveProperty('key');
        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('size');
        expect(result.size).toBe(TEST_BUFFER.length);

        uploadedKeys.push(result.key);
      });

      it('should handle different file types', async () => {
        const imageBuffer = Buffer.from('fake png data');
        const result = await storage.upload(imageBuffer, {
          filename: 'test.png',
          contentType: 'image/png',
        });

        expect(result.mimeType).toBe('image/png');
        uploadedKeys.push(result.key);
      });
    });

    describe('exists', () => {
      it('should return true for existing objects', async () => {
        const result = await storage.upload(TEST_BUFFER, {
          filename: 'exists.txt',
        });
        uploadedKeys.push(result.key);

        const exists = await storage.exists(result.key);
        expect(exists).toBe(true);
      });

      it('should return false for non-existing objects', async () => {
        const exists = await storage.exists('non-existent-object-key-12345.txt');
        expect(exists).toBe(false);
      });
    });

    describe('delete', () => {
      it('should delete existing objects', async () => {
        const result = await storage.upload(TEST_BUFFER, {
          filename: 'to-delete.txt',
        });

        await storage.delete(result.key);

        const exists = await storage.exists(result.key);
        expect(exists).toBe(false);
        // Don't add to cleanup list since it's deleted
      });

      it('should not throw for non-existing objects', async () => {
        await expect(
          storage.delete('non-existent-object-key-12345.txt')
        ).resolves.not.toThrow();
      });
    });

    describe('getSignedUrl', () => {
      it('should generate a signed URL', async () => {
        const result = await storage.upload(TEST_BUFFER, {
          filename: 'signed.txt',
        });
        uploadedKeys.push(result.key);

        const signedUrl = await storage.getSignedUrl(result.key, 3600);

        expect(signedUrl).toContain('X-Amz-Signature');
        expect(signedUrl).toContain(result.key);
      });
    });
  });
});

describe('Storage Interface Compliance', () => {
  let storage: LocalStorageProvider;

  beforeAll(() => {
    storage = new LocalStorageProvider();
  });

  it('should implement IStorageProvider interface', () => {
    const methods: (keyof IStorageProvider)[] = [
      'upload',
      'delete',
      'exists',
      'getUrl',
      'getMetadata',
    ];

    for (const method of methods) {
      expect(typeof storage[method]).toBe('function');
    }
  });

  it('should return proper StorageFile structure', async () => {
    const result = await storage.upload(TEST_BUFFER, {
      filename: 'structure-test.txt',
      contentType: 'text/plain',
    });

    const requiredFields: (keyof StorageFile)[] = ['key', 'url', 'size', 'mimeType'];

    for (const field of requiredFields) {
      expect(result).toHaveProperty(field);
      expect(result[field]).toBeDefined();
    }
  });

  it('should handle upload options correctly', async () => {
    const customMetadata = { uploadedBy: 'test', purpose: 'validation' };

    const result = await storage.upload(TEST_BUFFER, {
      filename: 'options-test.jpg',
      contentType: 'image/jpeg',
      folder: 'test-uploads',
      metadata: customMetadata,
    });

    // Normalize path separator for cross-platform compatibility
    const normalizedKey = result.key.replace(/[\\/]/g, '/');
    expect(normalizedKey).toContain('test-uploads/');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.metadata).toEqual(customMetadata);
  });
});
