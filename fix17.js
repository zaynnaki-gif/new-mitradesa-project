const fs = require('fs');

function replaceFile(path, regex, replacer) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacer);
  fs.writeFileSync(path, content);
}

// 5. keluarga.service.ts
replaceFile('apps/api/src/services/keluarga.service.ts', /keluarga\.dusun \|\| '',\r?\n\s+keluarga\.rw \|\| '',\r?\n\s+keluarga\.rt \|\| '',/g, "keluarga.gubugId?.toString() || '',\n        keluarga.rwId?.toString() || '',\n        keluarga.rtId?.toString() || '',");

replaceFile('apps/api/src/services/keluarga.service.ts', /dusun: kepalaRow\.row\['Dusun'\] \|\| null,\r?\n\s+rw: kepalaRow\.row\['RW'\] \|\| null,\r?\n\s+rt: kepalaRow\.row\['RT'\] \|\| null,/g, "gubugId: kepalaRow.row['Dusun'] ? BigInt(kepalaRow.row['Dusun'] as any) : null,\n              rwId: kepalaRow.row['RW'] ? BigInt(kepalaRow.row['RW'] as any) : null,\n              rtId: kepalaRow.row['RT'] ? BigInt(kepalaRow.row['RT'] as any) : null,");

console.log('done');
