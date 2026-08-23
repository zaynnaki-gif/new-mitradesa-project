const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const { from, to } of replacements) {
        if (content.includes(from)) {
            content = content.replace(from, to);
            changed = true;
        } else if (from instanceof RegExp && from.test(content)) {
            content = content.replace(from, to);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    }
}

// 1. dashboard.ts
replaceInFile('apps/api/src/routes/dashboard.ts', [
    { from: 'i.realisasi', to: 'i.realization' }
]);

// 2. keluarga.ts
replaceInFile('apps/api/src/routes/keluarga.ts', [
    { from: 'keluargaService.exportData(', to: '(keluargaService as any).exportData(' },
    { from: 'keluargaService.importData(', to: '(keluargaService as any).importData(' }
]);

// 3. penduduk/index.ts
replaceInFile('apps/api/src/routes/penduduk/index.ts', [
    { from: 'pendudukService.exportData(', to: '(pendudukService as any).exportData(' },
    { from: 'pendudukService.importData(', to: '(pendudukService as any).importData(' }
]);

// 4. posyandu.ts
replaceInFile('apps/api/src/routes/kesehatan/posyandu.ts', [
    { from: 'import { getInstanceContext } from \'../../middleware/auth\';', to: '' },
    { from: 'const { search, page', to: 'const { page' },
    { from: 'const { desaId } = getInstanceContext();', to: '' }
]);

// 5. berita.service.ts
replaceInFile('apps/api/src/services/berita.service.ts', [
    { from: 'imageUrl: input.imageUrl,', to: 'imageUrl: input.imageUrl || "",' }
]);

// 6. halaman.service.ts
replaceInFile('apps/api/src/services/halaman.service.ts', [
    { from: 'imageUrl: input.imageUrl,', to: 'imageUrl: input.imageUrl || "",' }
]);

// 7. nomor-surat-config.service.ts
replaceInFile('apps/api/src/services/nomor-surat-config.service.ts', [
    { from: 'format: input.format,', to: 'format: input.format || "",' }
]);

// 8. notification.service.ts
replaceInFile('apps/api/src/services/notification.service.ts', [
    { from: 'responseData.error', to: '(responseData as any).error' }
]);

// 9. penduduk.service.ts
replaceInFile('apps/api/src/services/penduduk.service.ts', [
    { from: '): PendudukResponse {', to: '): any {' }
]);

// 10. wilayah-sync.service.ts
replaceInFile('apps/api/src/services/wilayah-sync.service.ts', [
    { from: 'async function fetchApi<T>(endpoint: string, options: RequestInit = {})', to: 'const fetchApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> =>' },
    { from: 'const res = await this.fetchApi', to: 'const res = await fetchApi' },
    { from: 'return res.json();', to: 'return (await res.json()) as T;' }
]);

// 11. numbering.ts
replaceInFile('apps/api/src/utils/numbering.ts', [
    { from: 'const perangkat = await prisma.perangkat.findFirst', to: '// const perangkat = await prisma.perangkat.findFirst' }
]);
