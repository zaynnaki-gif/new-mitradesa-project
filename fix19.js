const fs = require('fs');

function replaceFile(path, regex, replacer) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacer);
  fs.writeFileSync(path, content);
}

replaceFile('apps/api/src/services/penduduk.service.ts',
  /  QueryPendudukInput,\r?\n  PendudukResponse,\r?\n  PendudukResponse,\r?\n\} from '\.\.\/dto\/penduduk\.dto\.js';/g,
  `  QueryPendudukInput,
  PendudukResponse,
} from '../dto/penduduk.dto.js';`);

replaceFile('apps/api/src/services/penduduk.service.ts',
  /            statusKepindahan: createData\.statusKepindahan \? String\(createData\.statusKepindahan\) : null,\r?\n            rt: createData\.rt \? String\(createData\.rt\) : null,\r?\n            rw: createData\.rw \? String\(createData\.rw\) : null,\r?\n            dusun: createData\.dusun \? String\(createData\.dusun\) : null,\r?\n            desaId: desaId \?\? null,\r?\n            gubugId,/g,
  `            statusKepindahan: createData.statusKepindahan ? String(createData.statusKepindahan) : null,
            desaId: desaId ?? null,
            gubugId,
            rtId: createData.rt ? BigInt(createData.rt as any) : null,
            rwId: createData.rw ? BigInt(createData.rw as any) : null,`);

// In case the above regex doesn't match for line 293:
replaceFile('apps/api/src/services/penduduk.service.ts',
  /            statusKepindahan: createData\.statusKepindahan \? String\(createData\.statusKepindahan\) : null,\r?\n            desaId: desaId \?\? null,\r?\n            gubugId,\r?\n            rt: createData\.rt \? String\(createData\.rt\) : null,\r?\n            rw: createData\.rw \? String\(createData\.rw\) : null,\r?\n            dusun: createData\.dusun \? String\(createData\.dusun\) : null,/g,
  `            statusKepindahan: createData.statusKepindahan ? String(createData.statusKepindahan) : null,
            desaId: desaId ?? null,
            gubugId,
            rtId: createData.rt ? BigInt(createData.rt as any) : null,
            rwId: createData.rw ? BigInt(createData.rw as any) : null,`);

replaceFile('apps/api/src/services/wilayah-sync.service.ts',
  /const results = await Promise\.all\(\r?\n\s+entities\.map\(async function \(entity\) \{/g,
  `const results = await Promise.all(
        entities.map(async (entity) => {`);

replaceFile('apps/api/src/services/wilayah-sync.service.ts',
  /const results = await Promise\.all\(\r?\n\s+entities\.map\(async \(entity\) => \{/g,
  `const results = await Promise.all(
        entities.map(async (entity) => {`);

replaceFile('apps/api/src/utils/numbering.ts',
  /const perangkat = await tx\.perangkatDesa\.findFirst\(\{\r?\n\s+where: \{/g,
  `await tx.perangkatDesa.findFirst({
      where: {`);

console.log('done script 19');
