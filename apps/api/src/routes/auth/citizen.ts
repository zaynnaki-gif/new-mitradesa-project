import { Router, Request, Response } from 'express';
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

const recoverAccessSchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 digit angka'),
  noKk: z.string().length(16, 'Nomor Kartu Keluarga (KK) harus 16 digit angka'),
  telepon: z.string().min(10, 'Nomor telepon minimal 10 digit').max(15, 'Nomor telepon maksimal 15 digit'),
});

const cancelRecoverySchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 digit angka'),
  cancellationCode: z.string().min(4, 'Kode pembatalan tidak valid'),
});

/**
 * @route   POST /api/auth/citizen/recover-access
 * @desc    Recover citizen access online via NIK + No KK verification & update WhatsApp number with Grace Period
 * @access  Public
 */
router.post(
  '/recover-access',
  otpRequestRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { nik, noKk, telepon } = recoverAccessSchema.parse(req.body);

    const result = await otpService.recoverAccessWithKk(
      nik,
      noKk,
      telepon,
      req.ip,
      req.headers['user-agent']
    );

    const maskedNik = `${nik.substring(0, 6)}******${nik.substring(12)}`;

    return response.success(res, {
      challenge: result.challenge,
      message: `Nomor WhatsApp berhasil diperbarui ke ${result.maskedPhone}. Kode OTP telah dikirimkan. Masa tenggang pembatalan (Grace Period): ${result.gracePeriodMinutes} menit.`,
      maskedNik,
      maskedPhone: result.maskedPhone,
      gracePeriodMinutes: result.gracePeriodMinutes,
      gracePeriodEndsAt: result.gracePeriodEndsAt,
      // Cancellation code disertakan di development untuk kemudahan automated testing / audit
      ...(process.env.NODE_ENV !== 'production' && { cancellationCode: result.cancellationCode }),
    });
  })
);

/**
 * @route   POST /api/auth/citizen/cancel-recovery
 * @desc    Cancel a pending recovery within the grace period (Emergency rollback)
 * @access  Public
 */
router.post(
  '/cancel-recovery',
  otpRequestRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { nik, cancellationCode } = cancelRecoverySchema.parse(req.body);

    const result = await otpService.cancelRecovery(
      nik,
      cancellationCode,
      req.ip,
      req.headers['user-agent']
    );

    return response.success(res, {
      success: result.success,
      message: result.message,
      restoredPhone: result.restoredPhone,
    });
  })
);

/**
 * @route   POST /api/auth/citizen/request-otp
 * @desc    Request OTP for citizen authentication
 * @access  Public
 */
router.post(
  '/request-otp',
  otpRequestRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
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
  asyncHandler(async (req: Request, res: Response) => {
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
  asyncHandler(async (req: Request, res: Response) => {
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
  asyncHandler(async (req: Request, res: Response) => {
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
