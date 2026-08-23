const fs = require('fs');

function replaceStr(filePath, search, replacement) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.split(search).join(replacement);
    fs.writeFileSync(filePath, content);
}

// 1. bumil.ts
replaceStr('apps/api/src/routes/kesehatan/bumil.ts', 'dusun: data.dusun ? String(data.dusun) : null,', 'gubugId: data.gubugId ? BigInt(data.gubugId as any) : null,');
replaceStr('apps/api/src/routes/kesehatan/bumil.ts', 'rt: data.rt ? String(data.rt) : null,', 'rtId: data.rtId ? BigInt(data.rtId as any) : null,');
replaceStr('apps/api/src/routes/kesehatan/bumil.ts', 'rw: data.rw ? String(data.rw) : null,', 'rwId: data.rwId ? BigInt(data.rwId as any) : null,');

// 2. statistik.ts
let stat = fs.readFileSync('apps/api/src/routes/public/statistik.ts', 'utf8');
stat = stat.replace(/dusun/g, 'gubugId');
stat = stat.replace(/'rt'/g, "'rtId'");
stat = stat.replace(/'rw'/g, "'rwId'");
stat = stat.replace(/rt: true/g, 'rtId: true');
stat = stat.replace(/rw: true/g, 'rwId: true');
stat = stat.replace(/rt: k\.rt/g, 'rtId: k.rtId');
stat = stat.replace(/rw: k\.rw/g, 'rwId: k.rwId');
stat = stat.replace(/k\.rt/g, 'k.rtId');
stat = stat.replace(/k\.rw/g, 'k.rwId');
fs.writeFileSync('apps/api/src/routes/public/statistik.ts', stat);

// 3. keluarga.service.ts
let kel = fs.readFileSync('apps/api/src/services/keluarga.service.ts', 'utf8');
kel = kel.replace(/rt: createData\.rt \? String\(createData\.rt\) : null,/g, 'rtId: createData.rtId ? BigInt(createData.rtId as any) : null,');
kel = kel.replace(/rw: createData\.rw \? String\(createData\.rw\) : null,/g, 'rwId: createData.rwId ? BigInt(createData.rwId as any) : null,');
kel = kel.replace(/dusun: createData\.dusun \? String\(createData\.dusun\) : null,/g, 'gubugId: createData.gubugId ? BigInt(createData.gubugId as any) : null,');

kel = kel.replace(/k\.dusun/g, 'k.gubugId');
kel = kel.replace(/k\.rw/g, 'k.rwId');
kel = kel.replace(/k\.rt/g, 'k.rtId');

kel = kel.replace(/dusun:/g, 'gubugId:');
kel = kel.replace(/\n\s+rw:/g, '\n          rwId:');
kel = kel.replace(/\n\s+rt:/g, '\n          rtId:');

fs.writeFileSync('apps/api/src/services/keluarga.service.ts', kel);

// 4. penduduk.service.ts
let pen = fs.readFileSync('apps/api/src/services/penduduk.service.ts', 'utf8');
pen = pen.replace(/gubugId: createData\.gubugId \? BigInt\(createData\.gubugId as any\) : null,\r?\n\s+gubugId,/, 'gubugId: createData.gubugId ? BigInt(createData.gubugId as any) : null,');
fs.writeFileSync('apps/api/src/services/penduduk.service.ts', pen);

console.log("Fix 10 applied");
