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

interface PendingRecovery {
  nik: string;
  pendudukId: bigint;
  oldPhone: string | null;
  newPhone: string;
  cancellationCode: string;
  initiatedAt: Date;
  gracePeriodEndsAt: Date;
  oldPhoneNotified: boolean;
  status: 'ACTIVE' | 'PENDING_OFFICER_APPROVAL' | 'CANCELLED';
}

export class OtpService {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;
  private readonly RECOVERY_GRACE_MINUTES = 120; // 2 jam jeda pembatalan (Grace Period)
  // private readonly COOLDOWN_MINUTES = 1;

  // Daftar layanan berisiko tinggi / dokumen prinsip hukum & keluarga (Offline Wajib Tatap Muka)
  private static readonly HIGH_RISK_SERVICE_CODES = [
    // Status Hukum Keluarga Permanen
    'S-34',   // Permohonan Cerai
    'S-35',   // Keterangan Pengantar Rujuk atau Cerai
    'S-32',   // Keterangan Wali Hakim
    '451.0',  // Surat Keterangan Nikah (N-1)
    'S-23',   // Keterangan Nikah
    'S-30',   // Keterangan Pergi Kawin
    'S-33',   // Permohonan Duplikat Surat Nikah
    'S-39',   // Keterangan Izin Orang Tua Suami Istri
    'S-50',   // Keterangan Untuk Nikah Warga Non Muslim

    // Pertanahan & Perdata Berat
    'S-40',   // Pernyataan Penguasaan Fisik Bidang Tanah SPORADIK
    'S-47',   // Surat Kuasa
    'S-49',   // Keterangan Kepemilikan Tanah
    'S-05',   // Keterangan Jual Beli
    '845',    // Keterangan Harga Tanah
  ];

  // In-memory registry untuk recovery dalam masa tenggang grace period
  private static pendingRecoveries = new Map<string, PendingRecovery>();

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
   * Recover citizen access online via NIK + No KK verification with Grace Period & High-Risk blocking
   */
  async recoverAccessWithKk(
    nik: string,
    noKk: string,
    newTelepon: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    challenge: string;
    maskedPhone: string;
    cancellationCode: string;
    gracePeriodMinutes: number;
    gracePeriodEndsAt: string;
  }> {
    const { desaId } = getInstanceContext();

    // 1. Search Penduduk by NIK in current village instance
    const penduduk = await prisma.penduduk.findFirst({
      where: {
        nik,
        desaId,
        isAktif: true,
      },
      include: {
        keluargaAsKepala: true,
        anggotaKeluarga: {
          include: {
            keluarga: true,
          },
        },
      },
    });

    if (!penduduk) {
      throw ApiError.notFound('NIK tidak terdaftar sebagai warga aktif di desa ini');
    }

    // 2. DETEKSI BERISIKO TINGGI: Jika NIK terasosiasi dengan layanan sensitif (cerai/rujuk/wali/tanah/kuasa)
    const highRiskRequest = await prisma.permintaanLayanan.findFirst({
      where: {
        pendudukId: penduduk.id,
        desaId,
        layanan: {
          kode: { in: OtpService.HIGH_RISK_SERVICE_CODES },
        },
        OR: [
          { status: { in: ['DRAFT', 'SUBMITTED', 'VERIFICATION', 'PROCESSING'] } },
          { createdAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (highRiskRequest) {
      const highRiskLayanan = await prisma.layanan.findUnique({
        where: { id: highRiskRequest.layananId },
        select: { kode: true, nama: true },
      });

      const serviceName = highRiskLayanan?.nama || 'Dokumen Sensitif/Prinsip';
      const serviceCode = highRiskLayanan?.kode || 'HIGH_RISK';

      await this.auditLog({
        entityType: 'penduduk',
        entityId: penduduk.id,
        action: 'OTP_FAILED',
        actorId: penduduk.id,
        actorIp: ipAddress,
        actorAgent: userAgent,
        metadata: {
          event: 'RECOVERY_BLOCKED_HIGH_RISK',
          nik: penduduk.nik,
          serviceCode,
          serviceName,
          reason: 'Citizen has active or recent (180 days) high-risk service requests',
        },
      });

      throw ApiError.forbidden(
        `Pemulihan online ditolak: Akun Anda memiliki riwayat pengajuan layanan berisiko tinggi/sensitif (${serviceName}). Demi mencegah pengambilalihan akun sepihak dalam sengketa, pemulihan WAJIB diverifikasi langsung oleh petugas di kantor desa.`
      );
    }

    // 3. Validate KK matching (either as Kepala Keluarga or as Anggota Keluarga)
    const matchesKepala = penduduk.keluargaAsKepala?.noKk === noKk;
    const matchesAnggota = penduduk.anggotaKeluarga?.some(
      (ak) => ak.keluarga?.noKk === noKk && ak.isAktif !== false
    );

    if (!matchesKepala && !matchesAnggota) {
      const kkExists = await prisma.keluarga.findFirst({
        where: {
          noKk,
          desaId,
          deletedAt: null,
          OR: [
            { kepalaId: penduduk.id },
            { anggota: { some: { pendudukId: penduduk.id, isAktif: true } } },
          ],
        },
      });

      if (!kkExists) {
        throw ApiError.badRequest('Nomor Kartu Keluarga (KK) tidak sesuai dengan data NIK terdaftar');
      }
    }

    // 4. Format and validate phone number
    const sanitizedPhone = newTelepon.trim().replace(/[^0-9+]/g, '');
    if (!/^(\+?62|08)[0-9]{8,13}$/.test(sanitizedPhone)) {
      throw ApiError.badRequest('Format nomor WhatsApp tidak valid. Gunakan format 08xx atau 628xx (10-15 digit)');
    }

    const oldPhone = penduduk.telepon;
    const cancellationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const gracePeriodEndsAt = new Date(Date.now() + this.RECOVERY_GRACE_MINUTES * 60 * 1000);
    const initiatedAt = new Date();

    // 5. Cek dan kirim notifikasi wajib ke kontak lama (jika nomor lama ada & berbeda)
    let oldPhoneNotified = true;
    if (oldPhone && oldPhone !== sanitizedPhone) {
      const maskedNew = `${sanitizedPhone.slice(0, 4)}****${sanitizedPhone.slice(-4)}`;
      const maskedNik = `${nik.substring(0, 6)}******${nik.substring(12)}`;
      const timeStr = new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: 'Asia/Jakarta',
      }).format(new Date());

      const alertMsg =
        `*⚠️ PERINGATAN KEAMANAN MITRADESA*\n\n` +
        `Nomor WhatsApp untuk akun warga NIK *${maskedNik}* baru saja dialihkan ke nomor baru (*${maskedNew}*) pada *${timeStr}* WIB.\n\n` +
        `Jika Anda TIDAK pernah mengajukan perubahan ini (kemungkinan pembajakan akun oleh pihak lain), Anda memiliki waktu *${this.RECOVERY_GRACE_MINUTES} menit* (Grace Period) untuk membatalkan perubahan ini.\n\n` +
        `Kode Pembatalan Darurat Anda: *${cancellationCode}*\n\n` +
        `Gunakan formulir pembatalan darurat atau segera hubungi petugas kantor desa.`;

      try {
        const sendSuccess = await notificationService.sendWhatsApp(oldPhone, alertMsg);
        if (!sendSuccess) {
          oldPhoneNotified = false;
        }
      } catch (waErr) {
        console.warn('[Security Alert] Gagal kirim WA ke nomor lama:', waErr);
        oldPhoneNotified = false;
      }
    }

    // 6. FALLBACK KEAMANAN JIKA NOMOR LAMA TIDAK TERJANGKAU (Mati/Hangus):
    // Jika ada nomor lama tapi notifikasi peringatan GAGAL terkirim, sistem TIDAK langsung
    // mengaktifkan nomor baru. Akun ditahan & dimasukkan ke antrean "Menunggu Persetujuan Petugas Desa"
    if (oldPhone && !oldPhoneNotified) {
      await this.auditLog({
        entityType: 'citizen_recovery',
        entityId: penduduk.id,
        action: 'PENDUDUK_UPDATED',
        actorId: penduduk.id,
        actorIp: ipAddress,
        actorAgent: userAgent,
        beforeData: { oldPhone, nik: penduduk.nik },
        afterData: { proposedPhone: sanitizedPhone, status: 'PENDING_OFFICER_APPROVAL' },
        metadata: {
          event: 'RECOVERY_HELD_NOTIFICATION_FAILED',
          nik: penduduk.nik,
          oldPhone,
          proposedPhone: sanitizedPhone,
          reason: 'Nomor WhatsApp lama tidak dapat dihubungi/mati. Pemulihan ditahan menunggu verifikasi fisik/persetujuan petugas desa.',
        },
      });

      throw ApiError.forbidden(
        'Pemberitahuan keamanan ke nomor WhatsApp lama tidak dapat dikirim (nomor tidak aktif/terputus). Demi mencegah pengambilalihan akun sepihak, nomor baru Anda DITAHAN dan permohonan telah dialihkan ke antrean Verifikasi Petugas Kantor Desa. Silakan hubungi kantor desa untuk konfirmasi pengaktifan.'
      );
    }

    // 7. Simpan registry Grace Period
    OtpService.pendingRecoveries.set(penduduk.nik, {
      nik: penduduk.nik,
      pendudukId: penduduk.id,
      oldPhone,
      newPhone: sanitizedPhone,
      cancellationCode,
      initiatedAt,
      gracePeriodEndsAt,
      oldPhoneNotified,
      status: 'ACTIVE',
    });

    // 8. Update nomor telepon di tabel Penduduk
    await prisma.penduduk.update({
      where: { id: penduduk.id },
      data: { telepon: sanitizedPhone },
    });

    // 9. Generate OTP challenge to the newly registered number
    const otpResult = await this.generateOtp(nik, ipAddress, userAgent);

    // 10. Audit log lengkap mencatat nomor lama, nomor baru, dan grace period
    await this.auditLog({
      entityType: 'citizen_recovery',
      entityId: penduduk.id,
      action: 'PENDUDUK_UPDATED',
      actorId: penduduk.id,
      actorIp: ipAddress,
      actorAgent: userAgent,
      beforeData: {
        oldPhone,
        nik: penduduk.nik,
        email: penduduk.email || null,
      },
      afterData: {
        newPhone: sanitizedPhone,
        cancellationCode,
        gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
      },
      metadata: {
        event: 'CITIZEN_RECOVERY_INITIATED',
        nik: penduduk.nik,
        nikSuffix: nik.slice(-4),
        noKkSuffix: noKk.slice(-4),
        oldPhone: oldPhone || null,
        newPhone: sanitizedPhone,
        cancellationCode,
        gracePeriodMinutes: this.RECOVERY_GRACE_MINUTES,
        gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
        initiatedAt: initiatedAt.toISOString(),
      },
    });

    const maskedPhone = `${sanitizedPhone.slice(0, 4)}****${sanitizedPhone.slice(-4)}`;

    return {
      challenge: otpResult.challenge,
      maskedPhone,
      cancellationCode,
      gracePeriodMinutes: this.RECOVERY_GRACE_MINUTES,
      gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
    };
  }

  /**
   * Cancel a pending recovery within the grace period
   */
  async cancelRecovery(
    nik: string,
    cancellationCode: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; restoredPhone: string | null; message: string }> {
    const { desaId } = getInstanceContext();

    const penduduk = await prisma.penduduk.findFirst({
      where: { nik, desaId, isAktif: true },
    });

    if (!penduduk) {
      throw ApiError.notFound('Data warga dengan NIK tersebut tidak ditemukan');
    }

    let recovery = OtpService.pendingRecoveries.get(nik);

    if (!recovery) {
      // Fallback: check recent audit log if server was restarted
      const recentAudit = await prisma.auditLog.findFirst({
        where: {
          entityType: 'citizen_recovery',
          actorId: penduduk.id,
          action: 'PENDUDUK_UPDATED',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (recentAudit && recentAudit.metadata) {
        const meta = recentAudit.metadata as any;
        if (meta.gracePeriodEndsAt && new Date(meta.gracePeriodEndsAt) > new Date()) {
          recovery = {
            nik,
            pendudukId: penduduk.id,
            oldPhone: meta.oldPhone,
            newPhone: meta.newPhone,
            cancellationCode: meta.cancellationCode,
            initiatedAt: new Date(meta.initiatedAt),
            gracePeriodEndsAt: new Date(meta.gracePeriodEndsAt),
            oldPhoneNotified: meta.oldPhoneNotified ?? true,
            status: meta.status || 'ACTIVE',
          };
        }
      }
    }

    if (!recovery) {
      throw ApiError.badRequest('Tidak ada permohonan pemulihan aktif yang dapat dibatalkan untuk NIK ini');
    }

    if (new Date() > recovery.gracePeriodEndsAt) {
      OtpService.pendingRecoveries.delete(nik);
      throw ApiError.badRequest('Jeda pembatalan (grace period) telah kedaluwarsa. Silakan lapor ke kantor desa untuk bantuan manual.');
    }

    if (recovery.cancellationCode.toUpperCase() !== cancellationCode.trim().toUpperCase()) {
      await this.auditLog({
        entityType: 'citizen_recovery',
        entityId: penduduk.id,
        action: 'OTP_FAILED',
        actorId: penduduk.id,
        actorIp: ipAddress,
        actorAgent: userAgent,
        metadata: {
          event: 'RECOVERY_CANCELLATION_FAILED_WRONG_CODE',
          nik,
          enteredCode: cancellationCode,
        },
      });
      throw ApiError.badRequest('Kode pembatalan darurat tidak valid');
    }

    // 1. Rollback phone number to oldPhone
    await prisma.penduduk.update({
      where: { id: penduduk.id },
      data: { telepon: recovery.oldPhone },
    });

    // 2. Revoke any citizen sessions created after recovery was initiated
    await prisma.citizenSession.updateMany({
      where: {
        pendudukId: penduduk.id,
        createdAt: { gte: recovery.initiatedAt },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // 3. Remove from pending recoveries
    OtpService.pendingRecoveries.delete(nik);

    // 4. Audit log
    await this.auditLog({
      entityType: 'citizen_recovery',
      entityId: penduduk.id,
      action: 'PENDUDUK_UPDATED',
      actorId: penduduk.id,
      actorIp: ipAddress,
      actorAgent: userAgent,
      beforeData: { phone: recovery.newPhone },
      afterData: { phone: recovery.oldPhone },
      metadata: {
        event: 'RECOVERY_CANCELLED_SUCCESS',
        nik: penduduk.nik,
        restoredPhone: recovery.oldPhone,
        revokedNewPhone: recovery.newPhone,
      },
    });

    // 5. Notify both old and new phones
    if (recovery.oldPhone) {
      notificationService.sendWhatsApp(
        recovery.oldPhone,
        `*✅ PEMBATALAN PEMULIHAN BERHASIL*\n\nPermintaan perubahan nomor WhatsApp akun Anda telah DIBATALKAN. Nomor WhatsApp Anda telah dipulihkan kembali ke nomor ini dan seluruh sesi baru telah dinonaktifkan.`
      ).catch(() => {});
    }

    if (recovery.newPhone) {
      notificationService.sendWhatsApp(
        recovery.newPhone,
        `*⚠️ PEMBERITAHUAN*\n\nPemulihan akun NIK ${nik.substring(0, 6)}******${nik.substring(12)} pada nomor ini telah DIBATALKAN oleh pemilik akun resmi. Akses login telah dicabut.`
      ).catch(() => {});
    }

    return {
      success: true,
      restoredPhone: recovery.oldPhone,
      message: 'Pemulihan akses berhasil dibatalkan. Nomor telepon akun telah dikembalikan dan seluruh sesi aktif dicabut.',
    };
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
    beforeData?: Prisma.InputJsonValue;
    afterData?: Prisma.InputJsonValue;
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
          beforeData: data.beforeData ?? undefined,
          afterData: data.afterData ?? undefined,
          metadata: data.metadata ?? undefined,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }
}

export const otpService = new OtpService();

