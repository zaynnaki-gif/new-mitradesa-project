const fs = require('fs');

function replaceFile(path, regex, replacer) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacer);
  fs.writeFileSync(path, content);
}

// 5. keluarga.service.ts -> ensure it uses rtId, rwId, gubugId
let kelsrv = fs.readFileSync('apps/api/src/services/keluarga.service.ts', 'utf8');

// lines 188-190
kelsrv = kelsrv.replace(/rt: data\.rt \|\| null,\r?\n\s+rw: data\.rw \|\| null,\r?\n\s+dusun: data\.dusun \|\| null,/, 'rtId: data.rt ? BigInt(data.rt) : null,\n            rwId: data.rw ? BigInt(data.rw) : null,\n            gubugId: data.dusun ? BigInt(data.dusun) : null,');

kelsrv = kelsrv.replace(/rt: keluarga\.rt \|\| null,\r?\n\s+rw: keluarga\.rw \|\| null,\r?\n\s+dusun: keluarga\.dusun \|\| null,/, 'rt: keluarga.rtId?.toString() || null,\n      rw: keluarga.rwId?.toString() || null,\n      dusun: keluarga.gubugId?.toString() || null,');

fs.writeFileSync('apps/api/src/services/keluarga.service.ts', kelsrv);

console.log('done');
