const fs = require('fs');

function replaceWithRegex(filePath, regex, replacement) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    }
}

// 4. posyandu.ts
replaceWithRegex(
    'apps/api/src/routes/kesehatan/posyandu.ts',
    /import \{ getInstanceContext \} from '\.\.\/\.\.\/middleware\/auth';\n/,
    ''
);
replaceWithRegex(
    'apps/api/src/routes/kesehatan/posyandu.ts',
    /const \{ search, page \} = req\.query;/,
    'const { page } = req.query;'
);
replaceWithRegex(
    'apps/api/src/routes/kesehatan/posyandu.ts',
    /const \{ desaId \} = getInstanceContext\(\);\n/,
    ''
);

// 5. berita.service.ts
replaceWithRegex(
    'apps/api/src/services/berita.service.ts',
    /imageUrl: input\.imageUrl,/g,
    'imageUrl: input.imageUrl || "",'
);

// 6. halaman.service.ts
replaceWithRegex(
    'apps/api/src/services/halaman.service.ts',
    /imageUrl: input\.imageUrl,/g,
    'imageUrl: input.imageUrl || "",'
);

// 7. nomor-surat-config.service.ts
replaceWithRegex(
    'apps/api/src/services/nomor-surat-config.service.ts',
    /format: input\.format,/g,
    'format: input.format || "",'
);

// 8. notification.service.ts
replaceWithRegex(
    'apps/api/src/services/notification.service.ts',
    /responseData\.error/g,
    '(responseData as any).error'
);

// 10. wilayah-sync.service.ts
replaceWithRegex(
    'apps/api/src/services/wilayah-sync.service.ts',
    /async fetchApi<T>\(endpoint: string, options: RequestInit = \{\}\)/,
    'async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T>'
);
replaceWithRegex(
    'apps/api/src/services/wilayah-sync.service.ts',
    /const res = await this\.fetchApi/g,
    'const res = await (this as any).fetchApi'
);

// 11. numbering.ts
replaceWithRegex(
    'apps/api/src/utils/numbering.ts',
    /const perangkat = await prisma\.perangkat\.findFirst/,
    '// const perangkat = await prisma.perangkat.findFirst'
);
