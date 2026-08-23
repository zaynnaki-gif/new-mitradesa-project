import { prisma } from './prisma.js';

/**
 * Service to handle sending WhatsApp notifications via Fonnte API
 */
export class NotificationService {
  private readonly fonnteApiUrl = 'https://api.fonnte.com/send';
  
  /**
   * Get the Fonnte API token from environment variables
   */
  private get token(): string {
    return process.env.FONNTE_API_TOKEN || '';
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
   * Send a WhatsApp message using Fonnte
   * @param target Phone number(s) comma separated
   * @param message Message to send
   */
  async sendWhatsApp(target: string, message: string): Promise<boolean> {
    if (!this.token) {
      console.warn('FONNTE_API_TOKEN is not set. Skipping WhatsApp notification.');
      return false;
    }

    if (!target) {
      console.warn('No target phone number provided for WhatsApp notification.');
      return false;
    }

    const formattedTarget = this.formatPhoneNumber(target);
    
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
          delay: '2', // Optional delay to prevent rate limit issues
        })
      });

      const responseData: any = await response.json();

      if (!response.ok || !responseData.status) {
        console.error('Failed to send WhatsApp message via Fonnte:', responseData);
        return false;
      }

      console.info(`WhatsApp notification queued via Fonnte for ${formattedTarget}`);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message via Fonnte:', error);
      return false;
    }
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
