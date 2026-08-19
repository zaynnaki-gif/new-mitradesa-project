import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, response, ApiError } from '../../utils/response.js';
import { otpService } from '../../services/index.js';
import {
  authenticateCitizen,
  otpRequestRateLimiter,
  otpVerifyRateLimiter,
} from '../../middleware/index.js';

const router = Router();

// Validation schemas
const requestOtpSchema = z.object({
  nik: z.string().length(16, 'NIK must be 16 digits'),
});

const verifyOtpSchema = z.object({
  challenge: z.string().min(1),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

/**
 * @route   POST /api/auth/citizen/request-otp
 * @desc    Request OTP for citizen authentication
 * @access  Public
 */
router.post(
  '/request-otp',
  otpRequestRateLimiter,
  asyncHandler(async (req, res) => {
    const { nik } = requestOtpSchema.parse(req.body);

    // In production, this would:
    // 1. Look up Penduduk by NIK
    // 2. Verify phone number availability
    // 3. Send OTP via notification service

    // For Phase 2, we simulate the flow
    const result = await otpService.generateOtp(
      nik,
      req.ip,
      req.headers['user-agent']
    );

    // Mask NIK in response for security
    const maskedNik = `${nik.substring(0, 6)}******${nik.substring(12)}`;

    return response.success(res, {
      challenge: result.challenge,
      message: 'OTP sent successfully',
      // In production, don't include the masked NIK in response
      // This is just for development reference
      maskedNik,
    });
  })
);

/**
 * @route   POST /api/auth/citizen/verify-otp
 * @desc    Verify OTP and get citizen session
 * @access  Public
 */
router.post(
  '/verify-otp',
  otpVerifyRateLimiter,
  asyncHandler(async (req, res) => {
    const { challenge, otp } = verifyOtpSchema.parse(req.body);

    const result = await otpService.verifyOtp(
      challenge,
      otp,
      req.ip,
      req.headers['user-agent']
    );

    return response.success(res, {
      token: result.sessionToken,
      tokenType: 'Bearer',
      expiresIn: 86400, // 24 hours in seconds
      expiresAt: result.expiresAt.toISOString(),
    });
  })
);

/**
 * @route   POST /api/auth/citizen/logout
 * @desc    Logout (revoke citizen session)
 * @access  Private (Citizen)
 */
router.post(
  '/logout',
  authenticateCitizen(),
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await otpService.revokeCitizenSession(token);
    }

    return response.success(res, { message: 'Logged out successfully' });
  })
);

/**
 * @route   GET /api/auth/citizen/me
 * @desc    Get current citizen session info
 * @access  Private (Citizen)
 */
router.get(
  '/me',
  authenticateCitizen(),
  asyncHandler(async (req, res) => {
    if (!req.user || !req.user.pendudukId) {
      throw ApiError.unauthorized('Not authenticated');
    }

    // In production, this would fetch additional Penduduk data
    return response.success(res, {
      pendudukId: req.user.pendudukId.toString(),
      type: 'citizen',
      permissions: req.user.permissions,
    });
  })
);

export default router;
