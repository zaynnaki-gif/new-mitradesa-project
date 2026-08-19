import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';

export interface CitizenInfo {
  id: bigint;
  pendudukId: bigint;
  status: string;
  expiresAt: Date;
}

export class OtpService {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;
  // private readonly COOLDOWN_MINUTES = 1;

  /**
   * Generate OTP challenge
   */
  async generateOtp(
    nik: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ challenge: string }> {
    // In production, this would:
    // 1. Search Penduduk by NIK
    // 2. Check if phone number is available
    // 3. Generate challenge and OTP
    // 4. Send OTP via notification service

    // For Phase 2, we simulate the flow
    // The actual Penduduk lookup will be implemented when Penduduk module is built

    // Generate challenge
    const challenge = this.generateChallenge();

    // Generate OTP
    const otp = this.generateOtpCode();

    // Create verification record (simulated - will link to Penduduk when available)
    const verification = await prisma.citizenVerification.create({
      data: {
        pendudukId: BigInt(1), // Placeholder - will be linked to Penduduk
        challenge,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    // Create OTP challenge
    const otpHash = await this.hashOtp(otp);
    await prisma.otpChallenge.create({
      data: {
        verificationId: verification.id,
        otpHash,
        challenge: challenge + '-otp',
        expiresAt: new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    // In production, send OTP via WhatsApp/SMS here
    // For development/testing: log to structured logger only if NODE_ENV is not production
    if (process.env.NODE_ENV !== 'production') {
      // Use structured logging without exposing actual OTP
      console.log(JSON.stringify({
        level: 'debug',
        event: 'OTP_GENERATED',
        nikSuffix: nik.slice(-4),
        challenge,
        timestamp: new Date().toISOString(),
      }));
    }

    // Audit log
    await this.auditLog({
      entityType: 'citizen_verification',
      entityId: verification.id,
      action: 'OTP_REQUESTED',
      actorIp: ipAddress,
      actorAgent: userAgent,
      metadata: { nikSuffix: nik.slice(-4) },
    });

    return { challenge };
  }

  /**
   * Verify OTP
   */
  async verifyOtp(
    challenge: string,
    otp: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ sessionToken: string; expiresAt: Date }> {
    // Find verification
    const verification = await prisma.citizenVerification.findUnique({
      where: { challenge },
      include: {
        otpChallenges: {
          where: {
            status: 'ACTIVE',
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!verification) {
      await this.auditLog({
        entityType: 'citizen_verification',
        entityId: BigInt(0),
        action: 'OTP_FAILED',
        metadata: { reason: 'VERIFICATION_NOT_FOUND' },
      });
      throw ApiError.unauthorized('Invalid or expired verification');
    }

    if (verification.status !== 'PENDING') {
      throw ApiError.unauthorized('Verification already used or expired');
    }

    const otpChallenge = verification.otpChallenges[0];

    if (!otpChallenge) {
      await this.auditLog({
        entityType: 'citizen_verification',
        entityId: verification.id,
        action: 'OTP_FAILED',
        metadata: { reason: 'NO_ACTIVE_OTP' },
      });
      throw ApiError.unauthorized('No active OTP found');
    }

    // Check attempts
    if ((otpChallenge.attempts || 0) >= this.MAX_ATTEMPTS) {
      await prisma.otpChallenge.update({
        where: { id: otpChallenge.id },
        data: { status: 'EXPIRED' },
      });

      await this.auditLog({
        entityType: 'citizen_verification',
        entityId: verification.id,
        action: 'OTP_FAILED',
        metadata: { reason: 'MAX_ATTEMPTS_EXCEEDED' },
      });

      throw ApiError.unauthorized('Maximum verification attempts exceeded');
    }

    // Increment attempts
    await prisma.otpChallenge.update({
      where: { id: otpChallenge.id },
      data: { attempts: { increment: 1 } },
    });

    // Verify OTP
    const isValid = await this.compareOtp(otp, otpChallenge.otpHash);

    if (!isValid) {
      await this.auditLog({
        entityType: 'citizen_verification',
        entityId: verification.id,
        action: 'OTP_FAILED',
        metadata: { reason: 'INVALID_OTP' },
      });
      throw ApiError.unauthorized('Invalid OTP');
    }

    // Mark OTP as used
    await prisma.otpChallenge.update({
      where: { id: otpChallenge.id },
      data: { status: 'USED', usedAt: new Date() },
    });

    // Mark verification as verified
    await prisma.citizenVerification.update({
      where: { id: verification.id },
      data: { status: 'VERIFIED', verifiedAt: new Date() },
    });

    // Create session
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.citizenSession.create({
      data: {
        pendudukId: verification.pendudukId,
        token: sessionToken,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Audit
    await this.auditLog({
      entityType: 'citizen_verification',
      entityId: verification.id,
      action: 'OTP_VERIFIED',
      actorId: verification.pendudukId,
    });

    await this.auditLog({
      entityType: 'citizen_session',
      entityId: verification.pendudukId,
      action: 'SESSION_CREATED',
      actorId: verification.pendudukId,
    });

    return { sessionToken, expiresAt };
  }

  /**
   * Verify citizen session
   */
  async verifyCitizenSession(token: string): Promise<CitizenInfo | null> {
    const session = await prisma.citizenSession.findUnique({
      where: { token },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return null;
    }

    return {
      id: session.id,
      pendudukId: session.pendudukId,
      status: 'ACTIVE',
      expiresAt: session.expiresAt,
    };
  }

  /**
   * Revoke citizen session
   */
  async revokeCitizenSession(token: string): Promise<void> {
    const session = await prisma.citizenSession.findUnique({
      where: { token },
    });

    if (session) {
      await prisma.citizenSession.update({
        where: { token },
        data: { revokedAt: new Date() },
      });

      await this.auditLog({
        entityType: 'citizen_session',
        entityId: session.pendudukId,
        action: 'SESSION_REVOKED',
        actorId: session.pendudukId,
      });
    }
  }

  /**
   * Generate challenge ID
   */
  private generateChallenge(): string {
    const crypto = require('crypto');
    return crypto.randomUUID();
  }

  /**
   * Generate OTP code
   */
  private generateOtpCode(): string {
    const crypto = require('crypto');
    let otp = '';
    for (let i = 0; i < this.OTP_LENGTH; i++) {
      otp += crypto.randomInt(0, 10).toString();
    }
    return otp;
  }

  /**
   * Hash OTP
   */
  private async hashOtp(otp: string): Promise<string> {
    // Simple hash for development
    // In production, use bcrypt or similar
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Compare OTP
   */
  private async compareOtp(otp: string, hash: string): Promise<boolean> {
    const crypto = await import('crypto');
    const inputHash = crypto.createHash('sha256').update(otp).digest('hex');
    return inputHash === hash;
  }

  /**
   * Generate session token
   */
  private generateSessionToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Audit log helper
   */
  private async auditLog(data: {
    entityType: string;
    entityId: bigint;
    action: string;
    actorId?: bigint;
    actorType?: string;
    actorIp?: string;
    actorAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          entityType: data.entityType,
          entityId: data.entityId,
          action: data.action as any,
          actorId: data.actorId,
          actorType: (data.actorType || 'USER') as any,
          actorIp: data.actorIp,
          actorAgent: data.actorAgent,
          metadata: data.metadata as any,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }
}

export const otpService = new OtpService();
