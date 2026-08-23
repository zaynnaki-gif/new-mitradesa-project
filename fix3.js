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
    } else {
        console.log(`No changes made to ${filePath}`);
    }
}

// 1. dashboard.ts
replaceInFile('apps/api/src/routes/dashboard.ts', [
    { from: 'item.realisasi', to: 'item.realization' }
]);

// 4. posyandu.ts
replaceInFile('apps/api/src/routes/kesehatan/posyandu.ts', [
    { from: "import { getInstanceContext } from '../../middleware/auth';", to: "" },
    { from: "const { search, page }", to: "const { page }" },
    { from: "const { desaId } = getInstanceContext();", to: "" }
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

// 10. wilayah-sync.service.ts
replaceInFile('apps/api/src/services/wilayah-sync.service.ts', [
    { from: 'async fetchApi<T>(endpoint: string, options: RequestInit = {})', to: 'async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T>' },
    { from: 'const res = await this.fetchApi', to: 'const res = await fetchApi' },
    { from: 'return res.json();', to: 'return (await res.json()) as T;' },
    { from: 'const response = await fetch(`${this.baseUrl}${endpoint}`', to: 'const fetchApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => { const response = await fetch(`${this.baseUrl}${endpoint}`' }
]);

// 11. numbering.ts
replaceInFile('apps/api/src/utils/numbering.ts', [
    { from: 'const perangkat = await prisma.perangkat.findFirst', to: '// const perangkat = await prisma.perangkat.findFirst' }
]);
