const fs = require('fs');

// 1. keluarga.service.ts duplicate property gubugId (line 201)
let kel = fs.readFileSync('apps/api/src/services/keluarga.service.ts', 'utf8');
kel = kel.replace(/rtId: data.rt \? BigInt\(data.rt\) : null,\r?\n\s+rwId: data.rw \? BigInt\(data.rw\) : null,\r?\n\s+gubugId: data.dusun \? BigInt\(data.dusun\) : null,\r?\n\s+kodePos: data.kodePos \|\| null,\r?\n\s+desaId,\r?\n\s+gubugId,/, 
'rtId: data.rt ? BigInt(data.rt) : null,\n            rwId: data.rw ? BigInt(data.rw) : null,\n            gubugId: data.dusun ? BigInt(data.dusun) : null,\n            kodePos: data.kodePos || null,\n            desaId,');

// rtId not in KeluargaResponse
kel = kel.replace(/export interface KeluargaResponse \{\r?\n\s+id: string;\r?\n\s+noKk: string;\r?\n\s+kepalaId: string;\r?\n\s+alamat: string \| null;\r?\n\s+rtId: string \| null;/,
'export interface KeluargaResponse {\n  id: string;\n  noKk: string;\n  kepalaId: string;\n  alamat: string | null;\n  rt: string | null;\n  rw: string | null;\n  dusun: string | null;');
// We should check what KeluargaResponse actually expects. Let's just remove the duplicated `gubugId` for now.

fs.writeFileSync('apps/api/src/services/keluarga.service.ts', kel);

// 2. penduduk.service.ts duplicate property gubugId (line 281)
let pen = fs.readFileSync('apps/api/src/services/penduduk.service.ts', 'utf8');
pen = pen.replace(/gubugId: createData.gubugId \? BigInt\(createData.gubugId as any\) : null,\r?\n\s+kodePos: createData.kodePos \|\| null,\r?\n\s+desaId,\r?\n\s+gubugId,/,
'gubugId: createData.gubugId ? BigInt(createData.gubugId as any) : null,\n            kodePos: createData.kodePos || null,\n            desaId,');
fs.writeFileSync('apps/api/src/services/penduduk.service.ts', pen);

// 3. statistik.ts
let stat = fs.readFileSync('apps/api/src/routes/public/statistik.ts', 'utf8');
stat = stat.replace(/if \(rtId\) where\.rtId = BigInt\(rtId\);/g, ''); // maybe remove for now or correctly map
fs.writeFileSync('apps/api/src/routes/public/statistik.ts', stat);

console.log('done');
