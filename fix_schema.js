const fs = require('fs');
const path = 'apps/api/prisma/schema.prisma';

let schema = fs.readFileSync(path, 'utf8');

// Use regex matching to allow variable spaces and line endings
schema = schema.replace(/.*map\("rt"\).*\r?\n/g, '');
schema = schema.replace(/.*map\("rw"\).*\r?\n/g, '');
schema = schema.replace(/.*dusun.*String\?.*\r?\n/g, '');
schema = schema.replace(/.*rt\s*String\?.*\r?\n/g, '');
schema = schema.replace(/.*rw\s*String\?.*\r?\n/g, '');

fs.writeFileSync(path, schema);
console.log('Schema updated');
