const fs = require('fs');

function replaceFile(path, regex, replacer) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacer);
  fs.writeFileSync(path, content);
}

// 1. posyandu.ts unused vars
replaceFile('apps/api/src/routes/kesehatan/posyandu.ts', /import \{ getQueryString, getInstanceContext, getQueryNumber \} from '\.\.\/\.\.\/utils\/context';/g, "import { getQueryString, getQueryNumber } from '../../utils/context';");
replaceFile('apps/api/src/routes/kesehatan/posyandu.ts', /const \{ search, limit = 10, page = 1 \} = req\.query;/g, 'const { limit = 10, page = 1 } = req.query;');
// just in case they were formatted differently:
replaceFile('apps/api/src/routes/kesehatan/posyandu.ts', /import \{\s*getQueryString,\s*getInstanceContext,\s*getQueryNumber\s*\} from '\.\.\/\.\.\/utils\/context';/g, "import { getQueryString, getQueryNumber } from '../../utils/context';");

// 3. berita.service.ts
replaceFile('apps/api/src/services/berita.service.ts', /slug: data\.slug \|\| generateSlug\(data\.judul\),/g, 'slug: data.slug || generateSlug(data.judul) || "",');
replaceFile('apps/api/src/services/berita.service.ts', /slug: data\.slug \|\| generateSlug\(data\.judul\) \|\| "",/g, 'slug: data.slug || generateSlug(data.judul) || "",'); // clean up if partially applied

// 4. halaman.service.ts
replaceFile('apps/api/src/services/halaman.service.ts', /slug: data\.slug \|\| generateSlug\(data\.judul\),/g, 'slug: data.slug || generateSlug(data.judul) || "",');

// 5. keluarga.service.ts
replaceFile('apps/api/src/services/keluarga.service.ts', /const gubugId = data\.dusun \? BigInt\(data\.dusun\) : null;\r?\n/g, '');

// 6. nomor-surat-config.service.ts
let nsc = fs.readFileSync('apps/api/src/services/nomor-surat-config.service.ts', 'utf8');
nsc = nsc.replace(/kodeSurat: data\.kodeSurat,\r?\n/g, 'kodeSurat: data.kodeSurat || "",\n');
fs.writeFileSync('apps/api/src/services/nomor-surat-config.service.ts', nsc);

// 7. notification.service.ts
replaceFile('apps/api/src/services/notification.service.ts', /if \(!responseData\.tokens \|\| responseData\.tokens\.length === 0\) \{/g, 'if (!(responseData as any).tokens || (responseData as any).tokens.length === 0) {');

// 8. penduduk.service.ts
replaceFile('apps/api/src/services/penduduk.service.ts', /import \{\s*PendudukResponse\s*\} from '\.\.\/types\/penduduk';/g, '');
replaceFile('apps/api/src/services/penduduk.service.ts', /gubugId,\s*kodePos: createData\.kodePos \|\| null,\s*desaId,\s*gubugId,/g, 'kodePos: createData.kodePos || null,\n            desaId,\n            gubugId,');

// 9. wilayah-sync.service.ts
replaceFile('apps/api/src/services/wilayah-sync.service.ts', /setTimeout\(async function \(\) \{/g, 'setTimeout(async () => {');
replaceFile('apps/api/src/services/wilayah-sync.service.ts', /return response\.data;/g, 'return response.data as T[];');

// 10. numbering.ts
replaceFile('apps/api/src/utils/numbering.ts', /const \{\s*penduduk,\s*keluarga,\s*bumil,\s*perangkat\s*\} = getInstanceContext\(\);/g, 'const { penduduk, keluarga, bumil } = getInstanceContext();');

console.log('done');
