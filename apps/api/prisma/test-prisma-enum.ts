import { PrismaClient } from '@prisma/client';

async function testPrismaEnum() {
  const prisma = new PrismaClient();

  try {
    console.log('Testing Prisma client with enums...\n');

    // Try to create an account
    const passwordHash = 'dummy_hash_for_testing';

    try {
      const account = await prisma.account.create({
        data: {
          username: 'test_enum_user',
          email: 'test_enum@test.com',
          passwordHash,
          status: 'ACTIVE',
        }
      });
      console.log('Account created:', account);
    } catch (err: any) {
      console.log('Error creating account:', err.message);
      console.log('Error code:', err.code);
      console.log('Error meta:', err.meta);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaEnum();
