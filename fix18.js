const fs = require('fs');

function replaceFile(path, regex, replacer) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacer);
  fs.writeFileSync(path, content);
}

const targetFields = `      namaAyahLengkap: penduduk.namaAyahLengkap || null,
      namaIbuLengkap: penduduk.namaIbuLengkap || null,
      pendidikan: penduduk.pendidikan || null,
      pekerjaan: penduduk.pekerjaan || null,
      suku: penduduk.suku || null,
      pendapatan: penduduk.pendapatan || null,
      kepemilikanRumah: penduduk.kepemilikanRumah || null,
      luasRumah: penduduk.luasRumah || null,
      jumlahLantai: penduduk.jumlahLantai || null,
      jenisLantai: penduduk.jenisLantai || null,
      jenisDinding: penduduk.jenisDinding || null,
      jenisAtap: penduduk.jenisAtap || null,
      kepemilikanTanah: penduduk.kepemilikanTanah || null,
      luasTanah: penduduk.luasTanah || null,
      penerangan: penduduk.penerangan || null,
      sumberEnergiMasak: penduduk.sumberEnergiMasak || null,
      mck: penduduk.mck || null,
      sumberAir: penduduk.sumberAir || null,
      bantuanSosial: penduduk.bantuanSosial || null,
      bantuanExtra: penduduk.bantuanExtra || null,
      bpjsKesehatan: penduduk.bpjsKesehatan || null,
      bpjsKetenagakerjaan: penduduk.bpjsKetenagakerjaan || null,
      kepemilikanAset: penduduk.kepemilikanAset || null,
      kondisiFisik: penduduk.kondisiFisik || null,`;

// penduduk.service.ts
replaceFile('apps/api/src/services/penduduk.service.ts', 
  /agama: penduduk\.agama,\r?\n\s+statusPerkawinan/g, 
  `agama: penduduk.agama,
${targetFields}
      statusPerkawinan`);

replaceFile('apps/api/src/services/penduduk.service.ts', 
  /\} from '\.\.\/dto\/penduduk\.dto\.js';/g, 
  `  PendudukResponse,
} from '../dto/penduduk.dto.js';`);

replaceFile('apps/api/src/services/penduduk.service.ts',
  /rt: penduduk\.rt,\r?\n\s+rw: penduduk\.rw,\r?\n\s+dusun: penduduk\.dusun,/g,
  `rt: penduduk.rtId?.toString() || penduduk.rt || null,
      rw: penduduk.rwId?.toString() || penduduk.rw || null,
      dusun: penduduk.gubugId?.toString() || penduduk.dusun || null,`);

// wilayah-sync.service.ts error: 'this' implicitly has type 'any'
replaceFile('apps/api/src/services/wilayah-sync.service.ts',
  /const results = await Promise\.all\(\r?\n\s+entities\.map\(async function \(entity\) \{/g,
  `const results = await Promise.all(
          entities.map(async (entity) => {`);

replaceFile('apps/api/src/services/wilayah-sync.service.ts',
  /return \[\];/g,
  `return [] as T[];`);

// numbering.ts: 'perangkat' is declared but its value is never read.
replaceFile('apps/api/src/utils/numbering.ts',
  /const perangkat = await tx\.perangkatDesa/g,
  `await tx.perangkatDesa`);

console.log('done fixing ts errors');
