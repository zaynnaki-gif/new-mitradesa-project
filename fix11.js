const fs = require('fs');

// 1. keluarga.service.ts
let kel = fs.readFileSync('apps/api/src/services/keluarga.service.ts', 'utf8');

// lines 196:
kel = kel.replace(
    /alamat: data.alamat \|\| null,\r?\n\s*rtId: data.rt \|\| null,\r?\n\s*rwId: data.rw \|\| null,\r?\n\s*gubugId: data.dusun \|\| null,/,
    'alamat: data.alamat || null,\n            rtId: data.rt ? BigInt(data.rt) : null,\n            rwId: data.rw ? BigInt(data.rw) : null,\n            gubugId: data.dusun ? BigInt(data.dusun) : null,'
);

// exportToCsv
kel = kel.replace(/keluarga\.dusun \|\| ''/g, "keluarga.gubugId ? String(keluarga.gubugId) : ''");
kel = kel.replace(/keluarga\.rw \|\| ''/g, "keluarga.rwId ? String(keluarga.rwId) : ''");
kel = kel.replace(/keluarga\.rt \|\| ''/g, "keluarga.rtId ? String(keluarga.rtId) : ''");

// importFromCsv
kel = kel.replace(/gubugId: kepalaRow\.row\['Dusun'\] \|\| null,/g, "gubugId: kepalaRow.row['Dusun'] ? BigInt(kepalaRow.row['Dusun']) : null,");
kel = kel.replace(/rwId: kepalaRow\.row\['RW'\] \|\| null,/g, "rwId: kepalaRow.row['RW'] ? BigInt(kepalaRow.row['RW']) : null,");
kel = kel.replace(/rtId: kepalaRow\.row\['RT'\] \|\| null,/g, "rtId: kepalaRow.row['RT'] ? BigInt(kepalaRow.row['RT']) : null,");

fs.writeFileSync('apps/api/src/services/keluarga.service.ts', kel);

// 2. bumil.ts (we see multiple errors in patch route too)
let bumil = fs.readFileSync('apps/api/src/routes/kesehatan/bumil.ts', 'utf8');
bumil = bumil.replace(/rt: data.rtId \? BigInt\(data.rtId\) : null/g, 'rtId: data.rtId ? BigInt(data.rtId) : null');
bumil = bumil.replace(/rw: data.rwId \? BigInt\(data.rwId\) : null/g, 'rwId: data.rwId ? BigInt(data.rwId) : null');
bumil = bumil.replace(/dusun: data.gubugId \? BigInt\(data.gubugId\) : null/g, 'gubugId: data.gubugId ? BigInt(data.gubugId) : null');
fs.writeFileSync('apps/api/src/routes/kesehatan/bumil.ts', bumil);

// 3. statistik.ts (KeluargaWhereInput properties)
let stat = fs.readFileSync('apps/api/src/routes/public/statistik.ts', 'utf8');
// remove 'rt'/'rw'/'dusun' from the query parameters or map them
stat = stat.replace(/const rt = searchParams\.get\('rt'\);/g, "const rtId = searchParams.get('rtId');");
stat = stat.replace(/const rw = searchParams\.get\('rw'\);/g, "const rwId = searchParams.get('rwId');");
stat = stat.replace(/const dusun = searchParams\.get\('dusun'\);/g, "const gubugId = searchParams.get('gubugId');");
stat = stat.replace(/if \(rt\) where\.rtId = rt;/g, "if (rtId) where.rtId = BigInt(rtId);");
stat = stat.replace(/if \(rw\) where\.rwId = rw;/g, "if (rwId) where.rwId = BigInt(rwId);");
stat = stat.replace(/if \(dusun\) where\.gubugId = dusun;/g, "if (gubugId) where.gubugId = BigInt(gubugId);");
stat = stat.replace(/if \(rt\) where\.rt = rt;/g, "if (rtId) where.rtId = BigInt(rtId);");
stat = stat.replace(/if \(rw\) where\.rw = rw;/g, "if (rwId) where.rwId = BigInt(rwId);");
stat = stat.replace(/if \(dusun\) where\.dusun = dusun;/g, "if (gubugId) where.gubugId = BigInt(gubugId);");

// ensure select has the right fields
stat = stat.replace(/rtId: true/g, 'rtId: true');
stat = stat.replace(/rwId: true/g, 'rwId: true');
stat = stat.replace(/gubugId: true/g, 'gubugId: true');
fs.writeFileSync('apps/api/src/routes/public/statistik.ts', stat);

console.log("Fixes applied");
