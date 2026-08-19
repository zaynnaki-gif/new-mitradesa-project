import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const desaId = 1n;
  const devAccount = await prisma.account.findFirst({ where: { username: 'developer' } });
  
  const pages = [
    {
      judul: 'Sejarah Desa',
      slug: 'sejarah-desa',
      konten: '<p>Desa ini memiliki sejarah panjang yang dimulai sejak zaman kerajaan nusantara. Dibangun oleh para pendiri yang memiliki visi kuat untuk kesejahteraan bersama.</p>',
      excerpt: 'Sejarah pembentukan dan perkembangan desa dari masa ke masa.',
      status: 'PUBLISHED',
      desaId,
      createdById: devAccount?.id
    },
    {
      judul: 'Visi dan Misi',
      slug: 'visi-misi',
      konten: '<h3>Visi</h3><p>Mewujudkan desa yang mandiri, maju, dan sejahtera dengan mengedepankan kearifan lokal.</p><h3>Misi</h3><ul><li>Meningkatkan kualitas sumber daya manusia</li><li>Membangun infrastruktur yang memadai</li><li>Memberdayakan ekonomi kerakyatan</li></ul>',
      excerpt: 'Visi dan Misi arah pembangunan desa ke depan.',
      status: 'PUBLISHED',
      desaId,
      createdById: devAccount?.id
    }
  ];

  for (const p of pages) {
    await prisma.halaman.upsert({
      where: { slug: p.slug },
      update: { ...p, status: 'PUBLISHED' },
      create: p,
    });
  }

  console.log('Seeded Halaman successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
