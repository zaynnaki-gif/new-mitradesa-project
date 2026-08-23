const fs = require('fs');

const filePath = 'src/services/penduduk.service.ts';
let content = fs.readFileSync(filePath, 'utf-8');

const importMethod = `
  /**
   * Import penduduk from CSV data (Upsert by NIK)
   */
  async importFromCsv(
    csvContent: string,
    _actorId?: bigint,
    _actorIp?: string,
    _actorAgent?: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const lines = csvContent.split('\\n').filter(line => line.trim());
    if (lines.length < 2) {
      return { success: 0, failed: 0, errors: ['File CSV kosong atau tidak valid'] };
    }

    const { desaId } = getInstanceContext();

    const normalizeHeader = (h: string) => h.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    const headerMapping: Record<string, string> = {
      'NIK': 'nik',
      'NAMALENGKAP': 'namaLengkap',
      'NAMA': 'namaLengkap',
      'TEMPATLAHIR': 'tempatLahir',
      'TANGGALLAHIR': 'tanggalLahir',
      'JENISKELAMIN': 'jenisKelamin',
      'JK': 'jenisKelamin',
      'AGAMA': 'agama',
      'GOLDARAH': 'golDarah',
      'GOLONGANDARAH': 'golDarah',
      'STATUSPERKAWINAN': 'statusPerkawinan',
      'HUBUNGANKELUARGA': 'hubunganKeluarga',
      'PENDIDIKAN': 'pendidikan',
      'PEKERJAAN': 'pekerjaan',
      'ALAMAT': 'alamat',
      'DUSUN': 'dusun',
      'RT': 'rt',
      'RW': 'rw',
      'TELEPON': 'telepon',
      'NOHP': 'telepon',
      'ISAKTIF': 'isAktif',
      'AKTIF': 'isAktif',
      'SUKU': 'suku',
      'NAMAAYAH': 'namaAyahLengkap',
      'NAMAIBU': 'namaIbuLengkap',
      'BPJSKESEHATAN': 'bpjsKesehatan',
      'NOBPJS': 'bpjsKesehatan',
    };

    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let inQuotes = false;
      let currentVal = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            currentVal += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(currentVal);
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      result.push(currentVal);
      return result.map(v => v.trim());
    };

    const rawHeaders = parseCsvLine(lines[0]);
    const normalizedHeaders = rawHeaders.map(normalizeHeader);
    const colMap: Record<string, number> = {};

    normalizedHeaders.forEach((h, index) => {
      const mapped = headerMapping[h];
      if (mapped) colMap[mapped] = index;
    });

    if (colMap['nik'] === undefined || colMap['namaLengkap'] === undefined) {
      return {
        success: 0,
        failed: 0,
        errors: ['File CSV harus memiliki kolom NIK dan NAMA_LENGKAP'],
      };
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i]);
      if (row.length < 2) continue; // Skip empty rows

      const nik = row[colMap['nik']];
      const nama = row[colMap['namaLengkap']];

      if (!nik || !nama) {
        failedCount++;
        errors.push(\`Baris \${i + 1}: NIK dan NAMA LENGKAP wajib diisi\`);
        continue;
      }

      try {
        const payload: any = {
          desaId,
          nik,
          namaLengkap: nama,
          tempatLahir: colMap['tempatLahir'] !== undefined ? row[colMap['tempatLahir']] || '' : '',
          tanggalLahir: colMap['tanggalLahir'] !== undefined ? new Date(row[colMap['tanggalLahir']] || '1970-01-01') : new Date('1970-01-01'),
          jenisKelamin: colMap['jenisKelamin'] !== undefined ? (row[colMap['jenisKelamin']]?.toUpperCase() === 'P' ? 'P' : 'L') : 'L',
          agama: colMap['agama'] !== undefined ? row[colMap['agama']] || null : null,
          golDarah: colMap['golDarah'] !== undefined ? row[colMap['golDarah']] || null : null,
          statusPerkawinan: colMap['statusPerkawinan'] !== undefined ? row[colMap['statusPerkawinan']] || 'BELUM KAWIN' : 'BELUM KAWIN',
          hubunganKeluarga: colMap['hubunganKeluarga'] !== undefined ? row[colMap['hubunganKeluarga']] || 'KEPALA KELUARGA' : 'KEPALA KELUARGA',
          dusun: colMap['dusun'] !== undefined ? row[colMap['dusun']] || null : null,
          rt: colMap['rt'] !== undefined ? row[colMap['rt']] || null : null,
          rw: colMap['rw'] !== undefined ? row[colMap['rw']] || null : null,
          telepon: colMap['telepon'] !== undefined ? row[colMap['telepon']] || null : null,
          pendidikan: colMap['pendidikan'] !== undefined ? row[colMap['pendidikan']] || null : null,
          pekerjaan: colMap['pekerjaan'] !== undefined ? row[colMap['pekerjaan']] || null : null,
          suku: colMap['suku'] !== undefined ? row[colMap['suku']] || null : null,
          namaAyahLengkap: colMap['namaAyahLengkap'] !== undefined ? row[colMap['namaAyahLengkap']] || null : null,
          namaIbuLengkap: colMap['namaIbuLengkap'] !== undefined ? row[colMap['namaIbuLengkap']] || null : null,
          bpjsKesehatan: colMap['bpjsKesehatan'] !== undefined ? row[colMap['bpjsKesehatan']] || null : null,
        };
        
        const existing = await prisma.penduduk.findFirst({
          where: { nik, desaId, deletedAt: null }
        });

        if (existing) {
          await prisma.penduduk.update({
            where: { id: existing.id },
            data: payload
          });
        } else {
          await prisma.penduduk.create({
            data: payload
          });
        }
        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push(\`Baris \${i + 1}: \${err.message}\`);
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      errors
    };
  }
`;

// Insert the method before the last brace
const lastBraceIndex = content.lastIndexOf('}');
content = content.substring(0, lastBraceIndex) + importMethod + content.substring(lastBraceIndex);

fs.writeFileSync(filePath, content);
console.log('Added importFromCsv to PendudukService');
