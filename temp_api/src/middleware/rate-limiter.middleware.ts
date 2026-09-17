import type { Request } from 'express';
import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

// Rate limiter for internal login
export const loginRateLimiter = isTest ? rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Higher limit for tests to avoid rate limit interference
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts.' } },
  standardHeaders: true,
  legacyHeaders: false,
}) : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for citizen OTP request (per NIK / phone number + IP fallback)
export const otpRequestRateLimiter = isTest ? rateLimit({
  windowMs: 60 * 1000,
  max: 10000,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many OTP requests. Please wait before trying again.' } },
  standardHeaders: true,
  legacyHeaders: false,
}) : rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // 5 per menit di produksi, 100 di development
  keyGenerator: (req: Request) => {
    const nik = typeof req.body?.nik === 'string' ? req.body.nik.trim() : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const id = nik || phone;
    return id ? `otp:req:${id}` : (req.ip || 'unknown');
  },
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak permintaan OTP untuk identitas ini. Silakan tunggu 1 menit.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for OTP verification (per challenge token + IP fallback)
export const otpVerifyRateLimiter = isTest ? rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many verification attempts. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
}) : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 verification attempts per window
  keyGenerator: (req: Request) => {
    const challenge = typeof req.body?.challenge === 'string' ? req.body.challenge.trim() : '';
    return challenge ? `otp:verify:${challenge}` : (req.ip || 'unknown');
  },
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak percobaan verifikasi OTP. Silakan coba lagi nanti.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
export const apiRateLimiter = isTest ? rateLimit({
  windowMs: 60 * 1000,
  max: 10000,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } },
  standardHeaders: true,
  legacyHeaders: false,
}) : rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});


// Rate limiter for citizen service requests
// More restrictive to prevent spam
export const citizenRequestRateLimiter = isTest ? rateLimit({
  windowMs: 60 * 1000,
  max: 10000,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Terlalu banyak permintaan. Silakan tunggu sebentar.' } },
  standardHeaders: true,
  legacyHeaders: false,
}) : rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute per IP
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak permintaan. Silakan tunggu sebentar.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for public suggestions/complaints to prevent flood/spam
export const publicSaranRateLimiter = isTest ? rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10000,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Terlalu banyak pengiriman saran. Silakan tunggu beberapa menit.' } },
  standardHeaders: true,
  legacyHeaders: false,
}) : rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 complaints per 10 minutes per IP
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak pengiriman saran atau aduan dari perangkat ini. Silakan tunggu 10 menit.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for issuing offline citizen access (prevents unauthorized mass token creation)
export const offlineAccessRateLimiter = isTest ? rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Batas penerbitan akses offline tercapai.' } },
  standardHeaders: true,
  legacyHeaders: false,
}) : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 creations per 15 minutes per staff
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Batas penerbitan akses offline sementara tercapai (maksimal 10 sesi per 15 menit). Silakan coba lagi nanti.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for signatory set/change PIN attempts
export const setPinRateLimiter = isTest ? rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Terlalu banyak percobaan set PIN.' } },
  standardHeaders: true,
  legacyHeaders: false,
}) : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak percobaan perubahan PIN penandatangan. Akun dibatasi selama 15 menit.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

