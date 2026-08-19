import { PrismaClient } from '@prisma/client';

async function debugSeed() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('Debugging RefStatusPerkawinan upsert...\n');

    // First, check if any existing data
    const existing = await prisma.refStatusPerkawinan.findMany();
    console.log('Existing records:', existing.length);
    if (existing.length > 0) {
      console.log(existing);
    }

    // Try individual upsert with detailed error handling
    const item = { kode: 'BELUM_KAWIN', nama: 'Belum Kawin' };
    console.log('\nAttempting upsert with:');
    console.log('  kode:', item.kode, '(length:', item.kode.length, ')');
    console.log('  nama:', item.nama, '(length:', item.nama.length, ')');

    // Check if the unique constraint already exists
    const existingRecord = await prisma.refStatusPerkawinan.findUnique({
      where: { kode: item.kode }
    });
    console.log('\nExisting record with kode BELUM_KAWIN:', existingRecord);

    // Try create
    console.log('\nTrying create...');
    try {
      const created = await prisma.refStatusPerkawinan.create({
        data: item
      });
      console.log('Created:', created);
    } catch (createError: any) {
      console.log('Create failed:', createError.message);
      console.log('Error code:', createError.code);
      console.log('Error meta:', createError.meta);
    }

    // Try update
    console.log('\nTrying update...');
    try {
      const updated = await prisma.refStatusPerkawinan.update({
        where: { kode: item.kode },
        data: { nama: item.nama }
      });
      console.log('Updated:', updated);
    } catch (updateError: any) {
      console.log('Update failed:', updateError.message);
      console.log('Error code:', updateError.code);
      console.log('Error meta:', updateError.meta);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
  } finally {
    await prisma.$disconnect();
  }
}

debugSeed();
