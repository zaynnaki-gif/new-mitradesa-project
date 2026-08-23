// Direct DB test - query account table
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const accounts = await prisma.account.findMany({
      select: { id: true, username: true, status: true },
      take: 5,
    });
    console.log('Accounts:', JSON.stringify(accounts, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
    
    // Check internalSession table exists
    const sessions = await prisma.internalSession.count();
    console.log('Sessions count:', sessions);
    
  } catch (e: any) {
    console.error('DB Error:', e.message);
    console.error('Code:', e.code);
  } finally {
    await prisma.$disconnect();
  }
}

main();
