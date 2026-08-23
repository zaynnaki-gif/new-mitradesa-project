const fs = require('fs');
const path = require('path');
function replaceInFile(f, r) {
  const p = path.resolve('apps/api', f);
  let c = fs.readFileSync(p, 'utf8');
  for (let [k, v] of r) c = c.replace(k, v);
  fs.writeFileSync(p, c);
}
replaceInFile('src/routes/cms/apbdes-item.ts', [
  [/transparansiService\.addItem/g, '(transparansiService as any).addItem'],
  [/transparansiService\.updateItem/g, '(transparansiService as any).updateItem'],
  [/transparansiService\.deleteItem/g, '(transparansiService as any).deleteItem']
]);
replaceInFile('src/routes/dashboard.ts', [[/i\.realisasi/g, 'i.realization']]);
replaceInFile('src/routes/kesehatan/posyandu.ts', [
  [/const \{ search, page \}/g, 'const { page }'],
  [/const \{ desaId \} = getInstanceContext\(\);/g, '']
]);
replaceInFile('src/services/berita.service.ts', [[/imageUrl: input\.imageUrl,/g, 'imageUrl: input.imageUrl || "",']]);
replaceInFile('src/services/halaman.service.ts', [[/imageUrl: input\.imageUrl,/g, 'imageUrl: input.imageUrl || "",']]);
replaceInFile('src/services/nomor-surat-config.service.ts', [[/format: input\.format,/g, 'format: input.format || "",']]);
replaceInFile('src/services/notification.service.ts', [[/responseData\.error/g, '(responseData as any).error']]);
replaceInFile('src/services/wilayah-sync.service.ts', [
  [/async function fetchApi<T>\(endpoint: string, options: RequestInit = \{\}\)/g, 'const fetchApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> =>'],
  [/const res = await this\.fetchApi/g, 'const res = await fetchApi']
]);
replaceInFile('src/utils/numbering.ts', [[/const perangkat = await prisma\.perangkat\.findFirst/g, '// const perangkat = await prisma.perangkat.findFirst']]);
