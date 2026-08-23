const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('Audit count:', await prisma.auditLog.count());
}
main().finally(()=>prisma.$disconnect());
