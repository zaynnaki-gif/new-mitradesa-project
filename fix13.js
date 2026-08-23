const fs = require('fs');

function replaceFile(path, regex, replacer) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacer);
  fs.writeFileSync(path, content);
}

// 1. posyandu.ts unused vars
replaceFile('apps/api/src/routes/kesehatan/posyandu.ts', /import \{ (.*?)getInstanceContext(.*?)\} from '..\/..\/utils\/context';/g, (match, p1, p2) => `import { ${p1}${p2} } from '../../utils/context';`);
replaceFile('apps/api/src/routes/kesehatan/posyandu.ts', /const \{ search, limit = 10, page = 1 \} = req.query;/g, 'const { limit = 10, page = 1 } = req.query;');

// 2. statistik.ts
replaceFile('apps/api/src/routes/public/statistik.ts', /where\.rt = rt;/g, '');
replaceFile('apps/api/src/routes/public/statistik.ts', /where\.rw = rw;/g, '');

// 3. berita.service.ts
replaceFile('apps/api/src/services/berita.service.ts', /slug: data\.slug \|\| generateSlug\(data\.judul\),/g, 'slug: data.slug || generateSlug(data.judul) || "",');

// 4. halaman.service.ts
replaceFile('apps/api/src/services/halaman.service.ts', /slug: data\.slug \|\| generateSlug\(data\.judul\),/g, 'slug: data.slug || generateSlug(data.judul) || "",');

// 5. keluarga.service.ts
replaceFile('apps/api/src/services/keluarga.service.ts', /rtId: k\.rtId\.toString\(\),/g, 'rt: k.rtId ? k.rtId.toString() : null,');
replaceFile('apps/api/src/services/keluarga.service.ts', /const gubugId = data\.dusun \? BigInt\(data\.dusun\) : null;/g, '');

// 6. nomor-surat-config.service.ts
replaceFile('apps/api/src/services/nomor-surat-config.service.ts', /kodeSurat: data\.kodeSurat \|\| '',/g, 'kodeSurat: data.kodeSurat || "",');
// wait, line 45: let's check
let nsc = fs.readFileSync('apps/api/src/services/nomor-surat-config.service.ts', 'utf8');
nsc = nsc.replace(/kodeSurat: data\.kodeSurat,/g, 'kodeSurat: data.kodeSurat || "",');
fs.writeFileSync('apps/api/src/services/nomor-surat-config.service.ts', nsc);

// 7. notification.service.ts
replaceFile('apps/api/src/services/notification.service.ts', /if \(!responseData\.tokens \|\| responseData\.tokens\.length === 0\) \{/g, 'if (!(responseData as any).tokens || (responseData as any).tokens.length === 0) {');

// 8. penduduk.service.ts
replaceFile('apps/api/src/services/penduduk.service.ts', /import \{ Penduduk, Prisma \} from '@prisma\/client';\r?\nimport \{ PendudukResponse \} from '..\/types\/penduduk';/g, "import { Penduduk, Prisma } from '@prisma/client';");
replaceFile('apps/api/src/services/penduduk.service.ts', /gubugId: createData\.gubugId \? BigInt\(createData\.gubugId as any\) : null,\r?\n\s+kodePos: createData\.kodePos \|\| null,\r?\n\s+desaId,/, 'kodePos: createData.kodePos || null,\n            desaId,');

// 9. wilayah-sync.service.ts
replaceFile('apps/api/src/services/wilayah-sync.service.ts', /setTimeout\(async function \(\) \{/g, 'setTimeout(async () => {');
replaceFile('apps/api/src/services/wilayah-sync.service.ts', /return response\.data;/g, 'return response.data as T[];');

// 10. numbering.ts
replaceFile('apps/api/src/utils/numbering.ts', /const \{ penduduk, keluarga, bumil, perangkat \} = getInstanceContext\(\);/g, 'const { penduduk, keluarga, bumil } = getInstanceContext();');

console.log('done');
