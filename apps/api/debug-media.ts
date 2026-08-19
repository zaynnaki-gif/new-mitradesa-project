import { MediaService } from './src/services/media.service';

async function main() {
  const service = new MediaService();
  try {
    const res = await service.create({
      nama: 'Test Debug',
      slug: 'test-debug-' + Date.now(),
      deskripsi: 'test',
      fileUrl: 'http://example.com/test.jpg',
      fileType: 'IMAGE',
      fileSize: 1024,
      mimeType: 'image/jpeg',
    }, 1n);
    console.log('Success:', res);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
