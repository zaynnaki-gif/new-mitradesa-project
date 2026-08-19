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

// Rate limiter for citizen OTP request
export const otpRequestRateLimiter = isTest ? rateLimit({
  windowMs: 60 * 1000,
  max: 10000,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many OTP requests. Please wait before trying again.' } },
  standardHeaders: true,
  legacyHeaders: false,
}) : rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 OTP requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many OTP requests. Please wait before trying again.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for OTP verification
export const otpVerifyRateLimiter = isTest ? rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many verification attempts. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
}) : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 verification attempts per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many verification attempts. Please try again later.',
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
