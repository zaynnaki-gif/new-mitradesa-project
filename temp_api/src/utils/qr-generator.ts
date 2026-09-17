/**
 * QR Code Generator Helper
 *
 * Generates QR code images for document verification.
 */

import QRCode from 'qrcode';

/**
 * Generate QR code as base64 PNG
 */
export async function generateQrCodeBase64(data: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as Buffer (PNG)
 */
export async function generateQrCodeBuffer(data: string): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return buffer;
  } catch (error) {
    console.error('Failed to generate QR code buffer:', error);
    throw new Error('Failed to generate QR code buffer');
  }
}

/**
 * Build verification URL
 */
export function buildVerificationUrl(
  baseUrl: string,
  verificationToken: string
): string {
  return `${baseUrl}/verify/${verificationToken}`;
}

/**
 * Generate verification data for QR code
 */
export function generateVerificationData(
  nomorDokumen: string,
  verificationToken: string,
  judul: string
): string {
  // Compact format for QR code
  return JSON.stringify({
    no: nomorDokumen,
    token: verificationToken,
    judul: judul.substring(0, 50),
    t: Date.now(),
  });
}
