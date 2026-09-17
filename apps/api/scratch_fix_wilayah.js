const fs = require('fs');
const path = require('path');

const file = 'd:\\mitradesa\\apps\\api\\src\\services\\wilayah.service.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove desaId from toGubugResponse
content = content.replace(/desaId:\s*g\.desaId\.toString\(\),/g, '');

// 2. Fix getGubugAll
content = content.replace(/async getGubugAll\(desaId\?: bigint\) {/g, 'async getGubugAll() {');
content = content.replace(/const where = desaId \? \{ desaId \} : undefined;/g, 'const where = undefined;');

// 3. Fix createGubug
content = content.replace(/data: \{ desaId: bigint; kode: string; nama: string \},/g, 'data: { kode: string; nama: string },');
content = content.replace(/where: \{ desaId: data\.desaId, kode: data\.kode \},/g, 'where: { kode: data.kode },');

// 4. Fix updateGubug
content = content.replace(/where: \{ desaId: existing\.desaId, kode: data\.kode, id: \{ not: id \} \},/g, 'where: { kode: data.kode, id: { not: id } },');

// 5. Fix getTree
content = content.replace(/async getTree\(desaId: bigint\): Promise<WilayahTreeResponse\[\]> {/g, 'async getTree(): Promise<WilayahTreeResponse[]> {');
content = content.replace(/where: \{ desaId \},/g, '');

// 6. Fix getDropdown
content = content.replace(/async getDropdown\(desaId\?: bigint\): Promise<WilayahDropdownResponse> {/g, 'async getDropdown(): Promise<WilayahDropdownResponse> {');
content = content.replace(/where: desaId \? \{ desaId \} : undefined,/g, '');
content = content.replace(/where: desaId \? \{ gubug: \{ desaId \} \} : undefined,/g, '');
content = content.replace(/where: desaId \? \{ rw: \{ gubug: \{ desaId \} \} \} : undefined,/g, '');

fs.writeFileSync(file, content);
console.log('Fixed wilayah.service.ts');
