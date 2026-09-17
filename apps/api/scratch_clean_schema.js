const fs = require('fs');

const schemaPath = 'd:\\mitradesa\\apps\\api\\prisma\\schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

// Remove all lines containing `desaId`
schema = schema.replace(/^.*desaId.*$/gm, '');

// Remove all lines containing `desa Desa` or `desa  Desa` or `desa       Desa`
schema = schema.replace(/^.*desa\s+Desa.*$/gm, '');
schema = schema.replace(/^.*desa\s+Desa\?.*$/gm, '');

// Remove @@unique constraints containing desaId
// They usually look like @@unique([desaId, ...]) or @@unique([..., desaId])
schema = schema.replace(/,?\s*desaId\s*,?/g, function(match) {
  // If it's inside an array `[desaId, kode]` -> `[kode]`
  // we just remove desaId and any stray commas. We might need a safer regex.
  return '';
});

// Since removing just the text 'desaId' might leave broken arrays like `@@unique([, kode])`
// Let's just fix empty arrays `@@unique([])` or stray commas `[,` or `, ]`
schema = schema.replace(/\[\s*,/g, '[');
schema = schema.replace(/,\s*\]/g, ']');
schema = schema.replace(/,\s*,/g, ',');
// Remove empty unique/index lines
schema = schema.replace(/^.*@@index\(\[\]\).*$/gm, '');
schema = schema.replace(/^.*@@unique\(\[\]\).*$/gm, '');

fs.writeFileSync(schemaPath, schema);
console.log('Cleaned schema.prisma');
