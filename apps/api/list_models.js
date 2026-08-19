const fs = require('fs');
const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
// Find all model names
const matches = schema.match(/model\s+(\w+)/g);
console.log('Models:', matches ? matches.map(m => m.replace('model ', '') : 'NONE');
