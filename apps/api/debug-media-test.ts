import request from 'supertest';
import app from './src/app';
import { getTestAdmin, prisma } from './src/fixtures/auth.fixture';

async function main() {
  const admin = await getTestAdmin();
  console.log('Admin:', admin.accountId, admin.username, admin.token.substring(0, 20) + '...');

  const uniqueSlug = 'test-media-create-' + Date.now();
  const testMedia = {
    nama: 'Test Media ' + Date.now(),
    slug: uniqueSlug,
    deskripsi: 'Test media file',
    fileUrl: 'https://example.com/test.jpg',
    fileType: 'IMAGE' as const,
    fileSize: 1024,
    mimeType: 'image/jpeg',
    width: 800,
    height: 600,
    alt: 'Test image',
    kategori: 'test',
  };

  const res = await request(app)
    .post('/api/media')
    .set('Authorization', `Bearer ${admin.token}`)
    .send(testMedia);

  console.log('Response status:', res.status);
  console.log('Response body:', res.body);

  await prisma.$disconnect();
}

main().catch(console.error);
