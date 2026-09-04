/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { prisma } from './prisma.js';
import { config } from '../config/index.js';

/**
 * Service to handle sending WhatsApp notifications via Fonnte or configured WA Gateway API
 */
export class NotificationService {
  private get fonnteApiUrl(): string {
    return config.waApiUrl || 'https://api.fonnte.com/send';
  }
  
  /**
   * Get the WhatsApp API token from central config or fallback environment variable
   */
  private get token(): string {
    return config.waApiKey || process.env.FONNTE_API_TOKEN || '';
  }

  /**
   * Format a phone number to WhatsApp international format without '+'
   * Usually starting with 62 for Indonesia
   */
  private formatPhoneNumber(phone: string): string {
    let formatted = phone.replace(/\D/g, '');
    if (formatted.startsWith('0')) {
      formatted = '62' + formatted.substring(1);
    }
    return formatted;
  }

  /**
   * Send a WhatsApp message using Fonnte with exponential backoff retry policy
   * @param target Phone number(s) comma separated
   * @param message Message to send
   * @param maxRetries Maximum number of attempts (default 3)
   */
  async sendWhatsApp(target: string, message: string, maxRetries = 3): Promise<boolean> {
    if (!this.token) {
      console.warn('FONNTE_API_TOKEN is not set. Skipping WhatsApp notification.');
      return false;
    }

    if (!target) {
      console.warn('No target phone number provided for WhatsApp notification.');
      return false;
    }

    const formattedTarget = this.formatPhoneNumber(target);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(this.fonnteApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': this.token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            target: formattedTarget,
            message: message,
            delay: '2',
          })
        });

        const responseData: any = await response.json();

        if (response.ok && responseData.status) {
          console.info(`[WA Gateway] Notification delivered/queued for ${formattedTarget} on attempt ${attempt}`);
          return true;
        }

        console.warn(`[WA Gateway] Attempt ${attempt}/${maxRetries} rejected for ${formattedTarget}:`, responseData?.reason || responseData?.message || responseData);
      } catch (error) {
        console.warn(`[WA Gateway] Attempt ${attempt}/${maxRetries} failed for ${formattedTarget}:`, error instanceof Error ? error.message : error);
      }

      // Exponential backoff before next attempt (1s, 2s, 4s)
      if (attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, attempt - 1)));
      }
    }

    // Dead-letter log & persistent storage: all retries exhausted
    console.error(`[WA Gateway Dead-Letter] Failed to send WhatsApp notification to ${formattedTarget} after ${maxRetries} attempts. Message snippet: "${message.slice(0, 80)}..."`);
    
    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'wa_dead_letter',
          entityId: BigInt(Math.floor(Date.now() / 1000)),
          action: 'CREATE',
          actorType: 'SYSTEM',
          reason: `Notifikasi WhatsApp gagal terkirim setelah ${maxRetries} kali percobaan`,
          metadata: {
            target: formattedTarget,
            message,
            attempts: maxRetries,
            failedAt: new Date().toISOString(),
            status: 'FAILED',
          },
        },
      });
    } catch (dbErr) {
      console.error('[WA Gateway Dead-Letter] Gagal menyimpan antrian dead-letter:', dbErr);
    }

    return false;
  }

  /**
   * Retrieve all failed notifications from Dead-Letter Queue
   */
  async getFailedNotifications(limit = 50) {
    return prisma.auditLog.findMany({
      where: { entityType: 'wa_dead_letter' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Resend / retry a failed notification from Dead-Letter Queue
   */
  async retryFailedNotification(auditLogId: bigint): Promise<boolean> {
    const entry = await prisma.auditLog.findUnique({
      where: { id: auditLogId },
    });
    if (!entry || entry.entityType !== 'wa_dead_letter') {
      throw new Error('Catatan notifikasi dead-letter tidak ditemukan');
    }

    const meta = entry.metadata as Record<string, any>;
    if (!meta?.target || !meta?.message) {
      throw new Error('Format metadata notifikasi tidak valid');
    }

    const success = await this.sendWhatsApp(meta.target, meta.message, 3);
    if (success) {
      // Audit log is strictly append-only: create a resolution event instead of mutating past records
      await prisma.auditLog.create({
        data: {
          entityType: 'wa_dead_letter_resolved',
          entityId: auditLogId,
          action: 'CREATE',
          actorType: 'SYSTEM',
          reason: 'Notifikasi berhasil dikirim ulang secara manual oleh admin',
          metadata: {
            originalAuditLogId: auditLogId.toString(),
            target: meta.target,
            status: 'RESOLVED_RETRY_SUCCESS',
            resolvedAt: new Date().toISOString(),
          },
        },
      });
    }
    return success;
  }

  /**
   * Pre-defined notification templates for Document Requests
   */
  async notifyRequestStatusChanged(
    target: string,
    requestNumber: string,
    serviceName: string,
    newStatus: string,
    notes?: string
  ): Promise<boolean> {
    const statusText = newStatus === 'APPROVED' ? 'DISETUJUI'
                     : newStatus === 'REJECTED' ? 'DITOLAK'
                     : newStatus === 'COMPLETED' ? 'SELESAI (Dapat Diambil)'
                     : newStatus === 'PROCESSING' ? 'SEDANG DIPROSES'
                     : newStatus;

    let message = `*Informasi Layanan Surat Desa*\n\n`;
    message += `Status pengajuan surat Anda telah diperbarui.\n\n`;
    message += `*No. Registrasi:* ${requestNumber}\n`;
    message += `*Layanan:* ${serviceName}\n`;
    message += `*Status:* ${statusText}\n`;

    if (notes) {
      message += `*Catatan:* ${notes}\n`;
    }

    message += `\nTerima kasih,\n*Pemerintah Desa*`;

    return this.sendWhatsApp(target, message);
  }

  /**
   * Notify when document is ready for download
   */
  async notifyDocumentReady(
    target: string,
    requestNumber: string,
    serviceName: string,
    documentNumber: string,
    downloadUrl?: string
  ): Promise<boolean> {
    let message = `*Dokumen Siap Diunduh!*\n\n`;
    message += `Surat yang Anda minta telah selesai diproses.\n\n`;
    message += `*No. Registrasi:* ${requestNumber}\n`;
    message += `*Layanan:* ${serviceName}\n`;
    message += `*No. Surat:* ${documentNumber}\n`;

    if (downloadUrl) {
      message += `\n📎 *Link Unduh:*\n${downloadUrl}\n`;
    }

    message += `\nSilakan unduh dokumen melalui link di atas atau kunjungi website desa.\n\n`;
    message += `Terima kasih,\n*Pemerintah Desa*`;

    return this.sendWhatsApp(target, message);
  }

  /**
   * Notify when document has been signed (TTE)
   */
  async notifyDocumentSigned(
    target: string,
    documentNumber: string,
    verificationUrl: string
  ): Promise<boolean> {
    let message = `*Dokumen Telah Ditandatangani!*\n\n`;
    message += `Surat dengan nomor *${documentNumber}* telah ditandatangani secara elektronik (TTE).\n\n`;
    message += `✅ *Link Verifikasi:*\n${verificationUrl}\n\n`;
    message += `Dokumen ini dapat diverifikasi keasliannya melalui link di atas.\n\n`;
    message += `Terima kasih,\n*Pemerintah Desa*`;

    return this.sendWhatsApp(target, message);
  }

  /**
   * Handle incoming messages from Fonnte Webhook
   * @param sender The sender's phone number
   * @param text The message content
   */
  async handleIncomingMessage(sender: string, text: string): Promise<void> {
    const commandText = text.trim().toUpperCase();

    // Check if the command starts with STATUS
    if (commandText.startsWith('STATUS')) {
      const parts = text.trim().split(' ');
      if (parts.length < 2) {
        await this.sendWhatsApp(
          sender, 
          `Format salah. Ketik:\n*STATUS [Nomor_Registrasi]*\nContoh: *STATUS 500/001/KDS.SRMB/VIII/2026*`
        );
        return;
      }

      const nomorRegistrasi = parts.slice(1).join(' ').trim();
      
      try {
        const permintaan = await prisma.permintaanLayanan.findFirst({
          where: { nomorPermintaan: nomorRegistrasi },
          include: { layanan: true }
        });

        if (!permintaan) {
          await this.sendWhatsApp(
            sender, 
            `Surat dengan nomor registrasi *${nomorRegistrasi}* tidak ditemukan. Pastikan Anda mengetik nomor dengan benar.`
          );
          return;
        }

        const newStatus = permintaan.status;
        const statusText = newStatus === 'APPROVED' ? 'DISETUJUI (Menunggu Tanda Tangan)' 
                         : newStatus === 'REJECTED' ? 'DITOLAK'
                         : newStatus === 'COMPLETED' ? 'SELESAI (Sudah Ditandatangani / Dapat Diambil)'
                         : newStatus === 'PROCESSING' ? 'SEDANG DIPROSES'
                         : newStatus === 'VERIFICATION' ? 'VERIFIKASI BERKAS'
                         : newStatus === 'SUBMITTED' ? 'MENUNGGU DIPROSES'
                         : newStatus;

        let reply = `*Informasi Layanan Surat Desa*\n\n`;
        reply += `*No. Registrasi:* ${permintaan.nomorPermintaan}\n`;
        reply += `*Layanan:* ${permintaan.layanan?.nama || '-'}\n`;
        reply += `*Status Saat Ini:* ${statusText}\n`;

        if (permintaan.catatan) {
          reply += `*Catatan:* ${permintaan.catatan}\n`;
        }

        await this.sendWhatsApp(sender, reply);
      } catch (error) {
        console.error('Error handling incoming status command:', error);
        await this.sendWhatsApp(sender, 'Maaf, terjadi kesalahan pada server kami saat memeriksa status surat Anda. Silakan coba lagi nanti.');
      }
      return;
    }

    // Check if the command starts with SETUJU
    if (commandText.startsWith('SETUJU')) {
      const parts = text.trim().split(' ');
      if (parts.length < 2) {
        await this.sendWhatsApp(
          sender, 
          `Format salah. Ketik:\n*SETUJU [Nomor_Surat]*\nContoh: *SETUJU 500/001/KDS.SRMB/VIII/2026*`
        );
        return;
      }

      const nomorRegistrasi = parts.slice(1).join(' ').trim();
      
      try {
        const permintaan = await prisma.permintaanLayanan.findFirst({
          where: { nomorPermintaan: nomorRegistrasi },
          include: { layanan: true }
        });

        if (!permintaan) {
          await this.sendWhatsApp(
            sender, 
            `Surat dengan nomor registrasi *${nomorRegistrasi}* tidak ditemukan.`
          );
          return;
        }

        // Only allow approving if it's currently APPROVED or PROCESSING
        if (permintaan.status !== 'APPROVED' && permintaan.status !== 'PROCESSING') {
          await this.sendWhatsApp(
            sender, 
            `Surat dengan nomor registrasi *${nomorRegistrasi}* tidak bisa disetujui (Status saat ini: ${permintaan.status}).`
          );
          return;
        }

        // Update to COMPLETED
        await prisma.permintaanLayanan.update({
          where: { id: permintaan.id },
          data: { status: 'COMPLETED' }
        });

        // Also update InstanDokumen status to SIGNED
        const dokumen = await prisma.instanDokumen.findFirst({
          where: { permintaanId: permintaan.id }
        });

        if (dokumen) {
          await prisma.instanDokumen.update({
            where: { id: dokumen.id },
            data: { 
              status: 'SIGNED',
              signedAt: new Date()
            }
          });
        }

        let reply = `✅ *Dokumen Berhasil Disetujui*\n\n`;
        reply += `*No. Registrasi:* ${permintaan.nomorPermintaan}\n`;
        reply += `*Layanan:* ${permintaan.layanan?.nama || '-'}\n`;
        reply += `Dokumen telah ditandatangani secara elektronik (TTE) dan siap diunduh oleh warga.`;
        
        await this.sendWhatsApp(sender, reply);
      } catch (error) {
        console.error('Error handling SETUJU command:', error);
        await this.sendWhatsApp(sender, 'Maaf, terjadi kesalahan saat memproses persetujuan.');
      }
      return;
    }

    // Default Help Text
    const helpMsg = `Halo! Ini adalah layanan otomatis Pemerintah Desa.\n\nUntuk mengecek status surat Anda, balas dengan format:\n*STATUS [Nomor_Registrasi]*\n\nUntuk menyetujui surat (Kades):\n*SETUJU [Nomor_Registrasi]*`;
    await this.sendWhatsApp(sender, helpMsg);
  }
}

export const notificationService = new NotificationService();

