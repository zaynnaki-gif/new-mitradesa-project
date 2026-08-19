import DOMPurify from 'dompurify';

/**
 * HTML Sanitization Utility
 * Secure sanitization for CMS content
 */

/**
 * Strip dangerous HTML tags and attributes
 * Uses DOMPurify for production-ready security
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html);
}

/**
 * Sanitize for attribute values only
 */
export function sanitizeAttr(value: string): string {
  if (!value) return '';

  return value
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sanitize for text content
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Check if URL is safe (http/https only)
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize URL for href/src
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  if (isSafeUrl(url)) {
    return url;
  }

  // For relative URLs, make sure they don't start with //
  if (url.startsWith('//')) {
    return '';
  }

  return url;
}
