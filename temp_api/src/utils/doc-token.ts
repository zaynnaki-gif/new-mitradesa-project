import crypto from 'crypto';
import { config } from '../config/index.js';

export interface DocumentAccessTokenPayload {
  docKey: string;
  expiresAt: number; // Unix timestamp in ms
  purpose: 'download' | 'preview';
  scope: 'single_document';
}

/**
 * Generate a short-lived (e.g. 5-15 mins) HMAC-SHA256 signed token specifically
 * scoped to a single document path.
 * Format: base64url(payload).hmac_signature
 */
export function generateDocumentAccessToken(
  docKey: string,
  ttlMinutes = 15,
  purpose: 'download' | 'preview' = 'download'
): string {
  const normalizedKey = docKey.replace(/\\/g, '/').replace(/^\/+/, '');
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;

  const payload: DocumentAccessTokenPayload = {
    docKey: normalizedKey,
    expiresAt,
    purpose,
    scope: 'single_document',
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr, 'utf8').toString('base64url');

  const secret = config.jwtSecret || 'mitradesa_doc_secret_salt_2026';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Validate that a given document access token is valid, unexpired,
 * and cryptographically matches the exact requested document key.
 */
export function verifyDocumentAccessToken(
  token: string,
  requestedDocKey: string
): { valid: boolean; error?: string; payload?: DocumentAccessTokenPayload } {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Format token dokumen tidak valid' };
    }

    const [payloadB64, signature] = parts;
    const secret = config.jwtSecret || 'mitradesa_doc_secret_salt_2026';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSignature, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, error: 'Tanda tangan token dokumen tidak sah' };
    }

    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload: DocumentAccessTokenPayload = JSON.parse(payloadStr);

    // Check expiration
    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: 'Masa berlaku token dokumen telah kadaluarsa' };
    }

    // Check document key scoping
    const normalizedRequested = requestedDocKey.replace(/\\/g, '/').replace(/^\/+/, '');
    const normalizedTokenKey = payload.docKey.replace(/\\/g, '/').replace(/^\/+/, '');

    if (normalizedRequested !== normalizedTokenKey) {
      return { valid: false, error: 'Token tidak memiliki izin untuk dokumen ini (scoping mismatch)' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: 'Gagal memproses token dokumen' };
  }
}
