import crypto from 'crypto';
import { AuditAction, ActorType, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import { ApiError } from '../utils/response.js';
import { notificationService } from './notification.service.js';
import { getInstanceContext } from '../config/instance.js';

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
    // 1. Search Penduduk by NIK in current village instance
    const { desaId } = getInstanceContext();
    const penduduk = await prisma.penduduk.findFirst({
      where: {
        nik,
        desaId,
        isAktif: true,
      },
    });

    if (!penduduk) {
      throw ApiError.notFound('NIK tidak terdaftar sebagai warga aktif di desa ini');
    }

    // 2. Generate challenge and OTP
    const challenge = this.generateChallenge();
    const otp = this.generateOtpCode();

    // 3. Create verification record linked to actual Penduduk
    const verification = await prisma.citizenVerification.create({
      data: {
        pendudukId: penduduk.id,
        challenge,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    // 4. Create OTP challenge
    const otpHash = await this.hashOtp(otp);
    await prisma.otpChallenge.create({
      data: {
        verificationId: verification.id,
        otpHash,
        challenge: challenge + '-otp',
        expiresAt: new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    // 5. Send OTP via WhatsApp if phone number exists
    if (penduduk.telepon) {
      try {
        await notificationService.sendWhatsApp(
          penduduk.telepon,
          `*Kode OTP Layanan Mandiri Desa*\n\nKode verifikasi Anda: *${otp}*\n\nKode berlaku selama ${this.OTP_EXPIRY_MINUTES} menit. JANGAN berikan kode ini kepada siapapun demi keamanan data kependudukan Anda.`
        );
      } catch (waError) {
        console.error('Gagal mengirim pesan WhatsApp OTP:', waError);
      }
    }

    // In development/testing environment, log OTP for convenience
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[DEV OTP] NIK: ${nik} | OTP: ${otp} | Challenge: ${challenge}`);
    }

    // 6. Audit log
    await this.auditLog({
      entityType: 'citizen_verification',
      entityId: verification.id,
      action: 'OTP_REQUESTED',
      actorId: penduduk.id,
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

    // Increment attempts atomically and get updated record
    const updatedChallenge = await prisma.otpChallenge.update({
      where: { id: otpChallenge.id },
      data: { attempts: { increment: 1 } },
    });

    // Check attempts after incrementing to prevent race conditions
    if ((updatedChallenge.attempts || 0) > this.MAX_ATTEMPTS) {
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

    // Create session
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Execute state changes in a single transaction
    await prisma.$transaction(async (tx) => {
      // Mark OTP as used
      await tx.otpChallenge.update({
        where: { id: otpChallenge.id },
        data: { status: 'USED', usedAt: new Date() },
      });

      // Mark verification as verified
      await tx.citizenVerification.update({
        where: { id: verification.id },
        data: { status: 'VERIFIED', verifiedAt: new Date() },
      });

      // Create session
      await tx.citizenSession.create({
        data: {
          pendudukId: verification.pendudukId,
          token: sessionToken,
          expiresAt,
          ipAddress,
          userAgent,
        },
      });
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
    return crypto.randomUUID();
  }

  /**
   * Generate OTP code
   */
  private generateOtpCode(): string {
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
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Compare OTP with timing attack protection
   */
  private async compareOtp(otp: string, hash: string): Promise<boolean> {
    const inputHash = crypto.createHash('sha256').update(otp).digest('hex');
    const bufA = Buffer.from(inputHash, 'utf8');
    const bufB = Buffer.from(hash, 'utf8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Generate session token
   */
  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Audit log helper
   */
  private async auditLog(data: {
    entityType: string;
    entityId: bigint;
    action: AuditAction;
    actorId?: bigint;
    actorType?: ActorType;
    actorIp?: string;
    actorAgent?: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          entityType: data.entityType,
          entityId: data.entityId,
          action: data.action,
          actorId: data.actorId,
          actorType: data.actorType || 'USER',
          actorIp: data.actorIp,
          actorAgent: data.actorAgent,
          metadata: data.metadata ?? undefined,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }
}

export const otpService = new OtpService();

