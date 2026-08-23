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
    /const totalSuratMasuk = await prisma\.suratMasuk\.count\(\{\n      where: \{ deletedAt: null \},\n    \}\);/,
    `const totalSuratMasuk = await prisma.suratMasuk.count();`
);

replaceWithRegex(
    'apps/api/src/routes/public/statistik.ts',
    /status: \{ in: \['SELESAI', 'DISETUJUI'\] \},/,
    `status: { in: ['COMPLETED', 'APPROVED'] },`
);
