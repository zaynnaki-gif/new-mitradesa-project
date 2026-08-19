const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// List all model accessors
const models = Object.getOwnPropertyNames(prisma).filter(p => !p.startsWith('_'));
console.log('Available models:', models.sort().join('\n'));
