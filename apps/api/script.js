const fs = require('fs');

// 1. document-engine.service.ts
let p = 'd:/mitradesa/apps/api/src/services/document-engine.service.ts';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/this\.db\.dokumenSignature\.create\(\{\s*data:\s*\{/g, 'this.db.dokumenSignature.create({ data: { desaId,');
c = c.replace(/this\.db\.instanDokumen\.create\(\{\s*data:\s*\{/g, 'this.db.instanDokumen.create({ data: { desaId,');
fs.writeFileSync(p, c);

// 2. dokumen.service.ts
p = 'd:/mitradesa/apps/api/src/services/dokumen.service.ts';
c = fs.readFileSync(p, 'utf8');
c = c.replace(/this\.db\.templateVersion\.create\(\{\s*data:\s*\{/g, 'this.db.templateVersion.create({ data: { desaId,');
fs.writeFileSync(p, c);

// 3. keluarga.service.ts
p = 'd:/mitradesa/apps/api/src/services/keluarga.service.ts';
c = fs.readFileSync(p, 'utf8');
c = c.replace(/desaId,\s*desaId,/g, 'desaId,');
c = c.replace(/tx\.anggotaKeluarga\.create\(\{\s*data:\s*\{/g, 'tx.anggotaKeluarga.create({ data: { desaId,');
fs.writeFileSync(p, c);

// 4. layanan.service.ts
p = 'd:/mitradesa/apps/api/src/services/layanan.service.ts';
c = fs.readFileSync(p, 'utf8');
c = c.replace(/async updateTemplateField[\s\S]*?\{/, m => m + '\n    const { desaId } = getInstanceContext();');
fs.writeFileSync(p, c);

// 5. nomor-surat-config.service.ts
p = 'd:/mitradesa/apps/api/src/services/nomor-surat-config.service.ts';
c = fs.readFileSync(p, 'utf8');
c = c.replace(/create:\s*\{/, 'create: { desaId,');
fs.writeFileSync(p, c);

// 6. template-designer.service.ts
p = 'd:/mitradesa/apps/api/src/services/template-designer.service.ts';
c = fs.readFileSync(p, 'utf8');
if (!c.includes('getInstanceContext')) {
  c = "import { getInstanceContext } from '../config/instance.js';\n" + c;
}
fs.writeFileSync(p, c);

console.log('Done');
