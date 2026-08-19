const p = require('@prisma/client');
const keys = Object.keys(p).filter(k => k.match(/Kependudukan/));
console.log('Found models:', keys);

// Try to find lowercase accessor
const prisma = p.Prisma || p.default || p;
const modelNames = Object.keys(prisma).filter(k => k.match(/Status/));
console.log('Prisma.Prisma models:', modelNames);
