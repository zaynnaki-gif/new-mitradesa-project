/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PII (Personally Identifiable Information) Utilities
 *
 * Provides functions to mask sensitive data before returning in responses
 */

/**
 * Mask NIK - show first 6 and last 2 digits
 * Example: 3271051234567890 -> 327xxx...xx90
 */
export function maskNik(nik: string): string {
  if (!nik || nik.length < 8) {
    return '***';
  }
  const first = nik.substring(0, 6);
  const last = nik.substring(nik.length - 2);
  return `${first}xxxxxxxx${last}`;
}

/**
 * Mask email - show first 2 chars and domain
 * Example: john.doe@example.com -> jo***@example.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '***';
  }
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2 ? `${local.substring(0, 2)}***` : '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number - show first 3 and last 4 digits
 * Example: 081234567890 -> 081***7890
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) {
    return '***';
  }
  const first = phone.substring(0, 3);
  const last = phone.substring(phone.length - 4);
  return `${first}***${last}`;
}

/**
 * Mask address (optional - shows only general area)
 */
export function maskAddress(address: string | null | undefined, showChars = 20): string {
  if (!address) {
    return null as any;
  }
  if (address.length <= showChars) {
    return address;
  }
  return `${address.substring(0, showChars)}...`;
}

/**
 * Generic mask function for any sensitive string
 * Shows first and last portion
 */
export function maskString(
  value: string | null | undefined,
  showFirst = 4,
  showLast = 2
): string {
  if (!value) {
    return '***';
  }
  if (value.length <= showFirst + showLast + 3) {
    return '*'.repeat(value.length);
  }
  const first = value.substring(0, showFirst);
  const last = value.substring(value.length - showLast);
  return `${first}...${last}`;
}

