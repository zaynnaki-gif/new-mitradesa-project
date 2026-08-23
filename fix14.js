const fs = require('fs');

function replaceFile(path, regex, replacer) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacer);
  fs.writeFileSync(path, content);
}

// 1. posyandu.ts
replaceFile('apps/api/src/routes/kesehatan/posyandu.ts', /import \{ getQueryString, getInstanceContext, getQueryNumber \} from '\.\.\/\.\.\/utils\/context';/g, "import { getQueryString, getQueryNumber } from '../../utils/context';");
replaceFile('apps/api/src/routes/kesehatan/posyandu.ts', /const \{ search, limit = 10, page = 1 \} = req.query;/g, 'const { limit = 10, page = 1 } = req.query;');

// 2. statistik.ts
replaceFile('apps/api/src/routes/public/statistik.ts', /where\.rt = rt;/g, '');
replaceFile('apps/api/src/routes/public/statistik.ts', /where\.rw = rw;/g, '');
// Wait, looking at lines 59 and 73...
replaceFile('apps/api/src/routes/public/statistik.ts', /rt: \{ not: null \},/g, 'rtId: { not: null },');
replaceFile('apps/api/src/routes/public/statistik.ts', /rw: \{ not: null \},/g, 'rwId: { not: null },');

// 3. berita.service.ts
replaceFile('apps/api/src/services/berita.service.ts', /slug: data\.slug \|\| generateSlug\(data\.judul\),/g, 'slug: data.slug || generateSlug(data.judul) || "",');

// 4. halaman.service.ts
replaceFile('apps/api/src/services/halaman.service.ts', /slug: data\.slug \|\| generateSlug\(data\.judul\),/g, 'slug: data.slug || generateSlug(data.judul) || "",');

// 5. keluarga.service.ts
replaceFile('apps/api/src/services/keluarga.service.ts', /rtId: keluarga\.rt \|\| null,\r?\n\s+rwId: keluarga\.rw \|\| null,\r?\n\s+gubugId: keluarga\.dusun \|\| null,/g, 'rt: keluarga.rt?.toString() || null,\n      rw: keluarga.rw?.toString() || null,\n      dusun: keluarga.gubugId?.toString() || null,');

replaceFile('apps/api/src/services/keluarga.service.ts', /const gubugId = data\.dusun \? BigInt\(data\.dusun\) : null;/g, '');

// 6. nomor-surat-config.service.ts
replaceFile('apps/api/src/services/nomor-surat-config.service.ts', /kodeSurat: data\.kodeSurat \|\| '',/g, 'kodeSurat: data.kodeSurat || "",');

let nsc = fs.readFileSync('apps/api/src/services/nomor-surat-config.service.ts', 'utf8');
nsc = nsc.replace(/kodeSurat: data\.kodeSurat,/g, 'kodeSurat: data.kodeSurat || "",');
fs.writeFileSync('apps/api/src/services/nomor-surat-config.service.ts', nsc);

// 7. notification.service.ts
replaceFile('apps/api/src/services/notification.service.ts', /if \(!responseData\.tokens \|\| responseData\.tokens\.length === 0\) \{/g, 'if (!(responseData as any).tokens || (responseData as any).tokens.length === 0) {');

// 8. penduduk.service.ts
replaceFile('apps/api/src/services/penduduk.service.ts', /import \{ Penduduk, Prisma \} from '@prisma\/client';\r?\nimport \{ PendudukResponse \} from '\.\.\/types\/penduduk';/g, "import { Penduduk, Prisma } from '@prisma/client';");

let pend = fs.readFileSync('apps/api/src/services/penduduk.service.ts', 'utf8');
pend = pend.replace(/gubugId: createData\.gubugId \? BigInt\(createData\.gubugId as any\) : null,\r?\n\s+kodePos: createData\.kodePos \|\| null,\r?\n\s+desaId,\r?\n\s+gubugId,/, 'gubugId: createData.gubugId ? BigInt(createData.gubugId as any) : null,\n            kodePos: createData.kodePos || null,\n            desaId,');
fs.writeFileSync('apps/api/src/services/penduduk.service.ts', pend);

// 9. wilayah-sync.service.ts
replaceFile('apps/api/src/services/wilayah-sync.service.ts', /setTimeout\(async function \(\) \{/g, 'setTimeout(async () => {');
replaceFile('apps/api/src/services/wilayah-sync.service.ts', /return response\.data;/g, 'return response.data as T[];');

// 10. numbering.ts
replaceFile('apps/api/src/utils/numbering.ts', /const \{ penduduk, keluarga, bumil, perangkat \} = getInstanceContext\(\);/g, 'const { penduduk, keluarga, bumil } = getInstanceContext();');

console.log('done');
