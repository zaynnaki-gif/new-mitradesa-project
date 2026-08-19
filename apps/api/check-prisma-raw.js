const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const p = new PrismaClient();

async function main() {
  console.log('Testing Prisma raw methods...');
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(p));
  console.log('Prisma client methods:', methods.filter(m => m.toLowerCase().includes('raw'));
}

main().finally(() => p.$disconnect()).catch(console.error);
