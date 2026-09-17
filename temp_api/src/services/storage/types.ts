/**
 * Storage Provider Interface
 *
 * Provides abstraction for file storage backends:
 * - Local filesystem (development)
 * - S3-compatible (production)
 * - etc.
 */

export interface StorageFile {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  metadata?: Record<string, unknown>;
}

export interface UploadOptions {
  folder?: string;
  filename?: string;
  contentType?: string;
  metadata?: Record<string, unknown>;
}

export interface IStorageProvider {
  /**
   * Upload a file and return its URL
   */
  upload(buffer: Buffer, options?: UploadOptions): Promise<StorageFile>;

  /**
   * Delete a file by its key
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get the public URL for a file
   */
  getUrl(key: string): string;

  /**
   * Get file metadata
   */
  getMetadata(key: string): Promise<StorageFile | null>;

  /**
   * Get a signed URL for private files (S3-specific)
   * Throws if not supported
   */
  getSignedUrl?(key: string, expiresIn?: number): Promise<string>;
}

// File validation helpers
export const ALLOWED_MIME_TYPES = {
  IMAGE: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  VIDEO: [
    'video/mp4',
    'video/webm',
    'video/ogg',
  ],
  AUDIO: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp3',
  ],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

export const ALL_ALLOWED_MIME_TYPES: readonly string[] = [
  ...ALLOWED_MIME_TYPES.IMAGE,
  ...ALLOWED_MIME_TYPES.VIDEO,
  ...ALLOWED_MIME_TYPES.AUDIO,
  ...ALLOWED_MIME_TYPES.DOCUMENT,
];

export const ALLOWED_EXTENSIONS = {
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  VIDEO: ['.mp4', '.webm', '.ogg'],
  AUDIO: ['.mp3', '.wav', '.ogg'],
  DOCUMENT: ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx'],
} as const;

// Dangerous extensions that should never be allowed
export const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.sh', '.cmd', '.ps1', '.vbs', '.php', '.phtml', '.asp',
  '.aspx', '.jsp', '.cgi', '.pl', '.htaccess', '.htpasswd',
  '.js', '.html', '.htm', '.dll', '.so', '.dylib',
  // Double extensions to catch upload bypass attempts
  '.jpg.exe', '.png.exe', '.gif.exe', '.pdf.exe',
];

export function validateMimeType(mimeType: string): boolean {
  const lower = mimeType.toLowerCase();
  return ALL_ALLOWED_MIME_TYPES.some(m => m.toLowerCase() === lower);
}

export function validateExtension(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();

  // Check for path traversal
  if (lowerFilename.includes('..') || lowerFilename.includes('/') || lowerFilename.includes('\\')) {
    return false;
  }

  // Extract extension(s) - check for double extensions like .jpg.exe
  const lastDotIndex = lowerFilename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return false; // No extension
  }

  const lastExt = lowerFilename.slice(lastDotIndex);

  // Check if last extension is dangerous
  if (DANGEROUS_EXTENSIONS.some(ext => lastExt === ext || lastExt.endsWith(ext))) {
    return false;
  }

  // Also check for double extensions where the actual extension is dangerous
  // e.g., "file.jpg.exe" should be blocked
  const secondDotIndex = lowerFilename.lastIndexOf('.', lastDotIndex - 1);
  if (secondDotIndex !== -1) {
    const secondExt = lowerFilename.slice(secondDotIndex);
    if (DANGEROUS_EXTENSIONS.some(ext => secondExt === ext || secondExt.endsWith(ext))) {
      return false;
    }
  }

  // Check if extension is in allowed list
  const allAllowed: string[] = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
    '.mp4', '.webm', '.ogg',
    '.mp3', '.wav',
    '.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx',
  ];
  return allAllowed.includes(lastExt);
}

export function sanitizeFilename(filename: string): string {
  // Remove path components
  const name = filename.replace(/^.*[\\/]/, '');
  // Remove dangerous characters
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function getFileType(mimeType: string): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' {
  const lower = mimeType.toLowerCase();
  if (['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'].includes(lower)) return 'IMAGE';
  if (['video/mp4', 'video/webm', 'video/ogg'].includes(lower)) return 'VIDEO';
  if (['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'].includes(lower)) return 'AUDIO';
  return 'DOCUMENT';
}
