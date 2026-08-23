const fs = require('fs');

function replaceWithRegex(filePath, regex, replacement) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    } else {
        console.log(`Pattern not found in ${filePath}`);
    }
}

// 1. update api statistik.ts
replaceWithRegex(
    'apps/api/src/routes/public/statistik.ts',
    /const data = \{/,
    `// Count surat masuk
    const totalSuratMasuk = await prisma.suratMasuk.count({
      where: { deletedAt: null },
    });

    // Count surat keluar (PermintaanLayanan approved/completed)
    const totalSuratKeluar = await prisma.permintaanLayanan.count({
      where: { 
        status: { in: ['SELESAI', 'DISETUJUI'] },
      },
    });

    const data = {
      surat: {
        masuk: totalSuratMasuk,
        keluar: totalSuratKeluar,
      },`
);

// 2. update useStatistikDesa.ts
replaceWithRegex(
    'apps/web/src/hooks/useStatistikDesa.ts',
    /keluarga: number;\n  wilayah: \{/,
    `keluarga: number;
  surat: {
    masuk: number;
    keluar: number;
  };
  wilayah: {`
);

// 3. update HomePage.tsx
replaceWithRegex(
    'apps/web/src/pages/HomePage.tsx',
    /\{[\s]*value: statistik\?\.wilayah\?\.rt \|\| 0,[\s]*label: 'RT',[\s]*\},/g,
    `{
        value: statistik?.wilayah?.rt || 0,
        label: 'RT',
      },
      {
        value: statistik?.surat?.masuk || 0,
        label: 'Surat Masuk',
      },
      {
        value: statistik?.surat?.keluar || 0,
        label: 'Surat Keluar',
      },`
);
