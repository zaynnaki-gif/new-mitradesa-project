/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { keluargaService } from './src/services/keluarga.service.js';

const prisma = new PrismaClient();

async function testPecahKeluarga() {
  console.log('--- TEST PECAH KELUARGA ---');
  try {
    // 0. Cleanup
    await prisma.anggotaKeluarga.deleteMany({});
    await prisma.keluarga.deleteMany({});
    await prisma.penduduk.deleteMany({});
    await prisma.rt.deleteMany({});
    await prisma.rw.deleteMany({});
    await prisma.gubug.deleteMany({});

    // 1. Create a dummy Rt and Rw
    const gubug = await prisma.gubug.create({ data: { kode: 'GBG01', nama: 'Gubug 01' } });
    const rw = await prisma.rw.create({ data: { nama: 'RW 01', kode: 'RW01', gubugId: gubug.id } });
    const rt = await prisma.rt.create({ data: { kode: 'RT01', rwId: rw.id } });

    // 2. Create Penduduk 1 (Kepala Keluarga Lama)
    const p1 = await prisma.penduduk.create({
      data: {
        nik: '1111111111111111',
        namaLengkap: 'Bapak Lama',
        tempatLahir: 'Jakarta',
        tanggalLahir: new Date('1980-01-01'),
        jenisKelamin: 'L',
        agama: 'Islam',
        pendidikan: 'SMA',
        pekerjaan: 'Wiraswasta',
        statusPerkawinan: 'Kawin',
        wargaNegara: 'WNI',
        alamat: 'Alamat Lama',
        rtId: rt.id,
        rwId: rw.id,
        isAktif: true,
      }
    });

    // 3. Create Penduduk 2 (Anggota yang akan pecah KK)
    const p2 = await prisma.penduduk.create({
      data: {
        nik: '2222222222222222',
        namaLengkap: 'Anak Lama',
        tempatLahir: 'Jakarta',
        tanggalLahir: new Date('2000-01-01'),
        jenisKelamin: 'L',
        agama: 'Islam',
        pendidikan: 'SMA',
        pekerjaan: 'Mahasiswa',
        statusPerkawinan: 'Belum_Kawin',
        wargaNegara: 'WNI',
        alamat: 'Alamat Lama',
        rtId: rt.id,
        rwId: rw.id,
        isAktif: true,
      }
    });

    // 4. Create Keluarga Lama
    const kkLama = await prisma.keluarga.create({
      data: {
        noKk: '9999999999999999',
        kepalaId: p1.id,
        alamat: 'Alamat Lama',
        rtId: rt.id,
        rwId: rw.id,
        kodePos: '12345',
        anggota: {
          create: [
            { pendudukId: p1.id, hubungan: 'Kepala_Keluarga' },
            { pendudukId: p2.id, hubungan: 'Anak' },
          ]
        }
      },
      include: { anggota: true }
    });
    console.log(`[INFO] Keluarga lama dibuat: ID=${kkLama.id}, NoKK=${kkLama.noKk}, Total Anggota=${kkLama.anggota.length}`);

    // 5. Test Pecah Keluarga
    console.log(`[ACTION] Memecah KK untuk anggota NIK=${p2.nik}`);
    const kkBaru = await keluargaService.pecahKeluarga(
      kkLama.id,
      {
        anggotaIds: [p2.id],
        kepalaBaruId: p2.id,
        noKkBaru: '8888888888888888',
        alamatBaru: 'Alamat Baru',
        rtId: rt.id,
        rwId: rw.id,
        kodePosBaru: '54321',
      }
    );
    console.log(`[SUCCESS] Pecah KK berhasil! Keluarga baru: ID=${kkBaru.id}, NoKK=${kkBaru.noKk}`);

    // Cleanup
    console.log('[CLEANUP] Menghapus data test...');
    await prisma.anggotaKeluarga.deleteMany({ where: { keluargaId: { in: [kkLama.id, kkBaru.id] } } });
    await prisma.keluarga.deleteMany({ where: { id: { in: [kkLama.id, kkBaru.id] } } });
    await prisma.penduduk.deleteMany({ where: { id: { in: [p1.id, p2.id] } } });
    await prisma.rt.delete({ where: { id: rt.id } });
    await prisma.rw.delete({ where: { id: rw.id } });
    await prisma.gubug.delete({ where: { id: gubug.id } });
    console.log('[CLEANUP] Selesai.');

  } catch (error: any) {
    console.log('[ERROR]', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPecahKeluarga();
