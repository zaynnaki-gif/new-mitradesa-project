export function initMockApi() {
  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (!url.includes('/api/') || url.includes('/api/auth/')) {
      return originalFetch(input, init);
    }

    try {
      // Coba panggil API backend asli terlebih dahulu
      const response = await originalFetch(input, init);
      
      // Jika berhasil dan bukan error 500, cek apakah datanya kosong
      if (response.ok) {
        const clonedResponse = response.clone();
        const json = await clonedResponse.json();
        
        // Jika data dari database ada (tidak kosong), gunakan data asli!
        if (json && json.data && (Array.isArray(json.data) ? json.data.length > 0 : Object.keys(json.data).length > 0)) {
          return response;
        }
      }
    } catch (error) {
      // Jika backend mati / error koneksi, lanjut ke mock data
      console.warn('[Mock API] Backend tidak dapat dihubungi, menggunakan data buatan untuk:', url);
    }

    console.log('[Mock API] Menggunakan data buatan (placeholder) untuk:', url);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createResponse = (data: any) => 
      Promise.resolve(new Response(JSON.stringify({ success: true, data, meta: { total: data.length || 1, page: 1, limit: 10, totalPages: 1 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));

    const isDetailRoute = (base: string) => {
      const path = url.split('?')[0];
      const parts = path.split(base);
      return parts.length > 1 && parts[1].length > 1; // has something after the base route
    };

    if (url.includes('/api/identitas')) {
      return createResponse({
        namaDesa: 'Desa Sejahtera',
        namaKepalaDesa: 'Budi Santoso',
        alamat: 'Jl. Merdeka No. 1, Kecamatan Maju, Kabupaten Sejahtera',
        telepon: '081234567890',
        email: 'info@desasejahtera.go.id',
        website: 'www.desasejahtera.go.id',
        kodePos: '12345',
        logoDesaUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Logo',
        deskripsiSingkat: 'Desa Sejahtera adalah desa yang mandiri dan berbudaya.',
        desa: {
          nama: 'Sejahtera',
          kecamatan: {
            nama: 'Maju',
            kabupaten: { nama: 'Sejahtera', provinsi: { nama: 'Jawa Tengah' } }
          }
        }
      });
    }

    if (url.includes('/api/perangkat-desa/public')) {
      return createResponse([
        { id: '1', nama: 'Budi Santoso', jabatan: 'Kepala Desa', fotoUrl: 'https://placehold.co/400x400/475569/ffffff?text=Kades' },
        { id: '2', nama: 'Siti Aminah', jabatan: 'Sekretaris Desa', fotoUrl: 'https://placehold.co/400x400/475569/ffffff?text=Sekdes' }
      ]);
    }

    if (url.includes('/api/kategori/active')) {
      return createResponse([
        { id: '1', nama: 'Infrastruktur', slug: 'infrastruktur' },
        { id: '2', nama: 'Sosial', slug: 'sosial' }
      ]);
    }

    if (url.includes('/api/public/transparansi/apbdes')) {
      return createResponse({
        tahun: 2026,
        totalPendapatan: 1000000000,
        totalBelanja: 950000000,
        totalPembiayaan: 50000000,
        pendapatan: { total: 1000000000, rincian: [{ nama: 'Dana Desa', jumlah: 800000000 }] },
        belanja: { total: 950000000, rincian: [{ nama: 'Infrastruktur', jumlah: 500000000 }] }
      });
    }

    if (url.includes('/api/public/potensi')) {
      const mockData = [
        {
          id: '1',
          nama: 'Pertanian Padi Organik',
          slug: 'pertanian-padi-organik',
          deskripsi: 'Pertanian padi organik dengan sistem pengairan modern dan hasil panen berkualitas ekspor yang menjadi komoditas utama.',
          kategori: 'Pertanian',
          gambarUrl: 'https://placehold.co/600x400/16a34a/ffffff?text=Padi+Organik',
          lokasi: 'Dusun Makmur',
          isActive: true
        },
        {
          id: '2',
          nama: 'Wisata Air Terjun',
          slug: 'wisata-air-terjun',
          deskripsi: 'Destinasi wisata alam yang menawarkan keindahan air terjun dengan ketinggian 50 meter dan suasana yang sejuk.',
          kategori: 'Pariwisata',
          gambarUrl: 'https://placehold.co/600x400/0284c7/ffffff?text=Air+Terjun',
          lokasi: 'Dusun Asri',
          isActive: true
        }
      ];
      return createResponse(isDetailRoute('/api/public/potensi') ? mockData[0] : mockData);
    }

    if (url.includes('/api/public/berita')) {
      const mockData = [
        {
          id: '1',
          judul: 'Pembangunan Jalan Desa Tahap 2 Selesai',
          slug: 'pembangunan-jalan-tahap-2',
          konten: 'Pemerintah desa telah menyelesaikan pembangunan jalan desa tahap 2 yang menghubungkan Dusun A dan Dusun B.',
          excerpt: 'Pemerintah desa telah menyelesaikan pembangunan jalan desa tahap 2.',
          kategori: 'Infrastruktur',
          penulis: 'Admin Desa',
          gambarUrl: 'https://placehold.co/600x400/475569/ffffff?text=Jalan+Desa',
          status: 'PUBLISHED',
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          judul: 'Penyaluran Bantuan Sosial Bulan Ini',
          slug: 'penyaluran-bansos',
          konten: 'Bantuan sosial dari pemerintah pusat telah tiba dan akan segera disalurkan kepada warga yang berhak menerima di balai desa.',
          excerpt: 'Bantuan sosial dari pemerintah pusat telah tiba dan akan segera disalurkan.',
          kategori: 'Sosial',
          penulis: 'Sekretaris Desa',
          gambarUrl: 'https://placehold.co/600x400/475569/ffffff?text=Bansos',
          status: 'PUBLISHED',
          publishedAt: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          judul: 'Desa Kita Meraih Penghargaan Desa Bersih',
          slug: 'penghargaan-desa-bersih',
          konten: 'Puji syukur, desa kita berhasil memenangkan penghargaan tingkat nasional.',
          excerpt: 'Puji syukur, desa kita berhasil memenangkan penghargaan tingkat nasional.',
          kategori: 'Penghargaan',
          penulis: 'Kepala Desa',
          gambarUrl: 'https://placehold.co/600x400/475569/ffffff?text=Penghargaan',
          status: 'PUBLISHED',
          publishedAt: new Date(Date.now() - 172800000).toISOString(),
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      return createResponse(isDetailRoute('/api/public/berita') ? mockData[0] : mockData);
    }

    if (url.includes('/api/public/agenda')) {
      return createResponse([
        {
          id: '1',
          judul: 'Kerja Bakti Rutin Bulanan',
          slug: 'kerja-bakti-rutin',
          deskripsi: 'Kegiatan kerja bakti rutin untuk membersihkan lingkungan sekitar balai desa dan fasilitas umum.',
          tanggalMulai: new Date(Date.now() + 86400000).toISOString(),
          lokasi: 'Balai Desa',
          penyelenggara: 'Pemerintah Desa',
          status: 'PUBLISHED'
        },
        {
          id: '2',
          judul: 'Rapat Koordinasi RT/RW',
          slug: 'rapat-koordinasi',
          deskripsi: 'Rapat koordinasi bersama seluruh ketua RT dan RW untuk membahas program kerja bulan depan.',
          tanggalMulai: new Date(Date.now() + 172800000).toISOString(),
          lokasi: 'Ruang Rapat Desa',
          penyelenggara: 'Kepala Desa',
          status: 'PUBLISHED'
        }
      ]);
    }

    if (url.includes('/api/public/umkm')) {
      const mockData = [
        {
          id: '1',
          nama: 'Kopi Nusantara',
          slug: 'kopi-nusantara',
          deskripsi: 'Produksi kopi bubuk robusta pilihan asli dari perkebunan desa.',
          kategori: 'Minuman',
          namaPemilik: 'Pak Joko',
          kontak: '08111222333',
          alamat: 'Jl. Kopi No.1',
          gambarUrl: 'https://placehold.co/600x400/78350f/ffffff?text=Kopi',
          isActive: true
        },
        {
          id: '2',
          nama: 'Batik Tulis Sekar',
          slug: 'batik-tulis',
          deskripsi: 'Pengrajin kain batik tulis dengan motif khas daerah.',
          kategori: 'Pakaian',
          namaPemilik: 'Ibu Siti',
          kontak: '08999888777',
          alamat: 'Jl. Batik No.2',
          gambarUrl: 'https://placehold.co/600x400/be185d/ffffff?text=Batik',
          isActive: true
        },
        {
          id: '3',
          nama: 'Keripik Singkong Renyah',
          slug: 'keripik-singkong',
          deskripsi: 'Oleh-oleh khas dari singkong pilihan.',
          kategori: 'Makanan',
          namaPemilik: 'Bu Ani',
          kontak: '08222333444',
          alamat: 'Jl. Melati No.3',
          gambarUrl: 'https://placehold.co/600x400/eab308/ffffff?text=Keripik',
          isActive: true
        }
      ];
      return createResponse(isDetailRoute('/api/public/umkm') ? mockData[0] : mockData);
    }

    if (url.includes('/api/public/layanan')) {
      const mockData = [
        {
          id: '1',
          nama: 'Pembuatan KTP/KK Baru',
          slug: 'pembuatan-ktp',
          deskripsi: 'Layanan pengurusan KTP dan Kartu Keluarga baru bagi penduduk desa.',
          kategori: 'Administrasi Kependudukan',
          persyaratan: '1. Pengantar RT/RW\n2. Fotokopi Buku Nikah\n3. Surat Pindah (jika ada)',
          waktuProses: '3 Hari Kerja',
          biaya: 'Gratis',
          isActive: true
        }
      ];
      return createResponse(isDetailRoute('/api/public/layanan') ? mockData[0] : mockData);
    }

    if (url.includes('/api/public/galeri') || url.includes('/api/public/media')) {
      return createResponse([
        {
          id: '1',
          nama: 'Lomba Desa Tingkat Kabupaten',
          deskripsi: 'Partisipasi desa dalam lomba kebersihan tingkat kabupaten.',
          fileUrl: 'https://placehold.co/800x600/3b82f6/ffffff?text=Lomba+Desa',
          alt: 'Foto Lomba Desa',
          tipe: 'IMAGE',
          kategori: 'GALERI'
        },
        {
          id: '2',
          nama: 'Panen Raya',
          deskripsi: 'Kegiatan panen raya bersama kelompok tani.',
          fileUrl: 'https://placehold.co/800x600/22c55e/ffffff?text=Panen+Raya',
          alt: 'Foto Panen Raya',
          tipe: 'IMAGE',
          kategori: 'GALERI'
        },
        {
          id: '3',
          nama: 'Pentas Seni Budaya',
          deskripsi: 'Acara tahunan pentas seni budaya desa.',
          fileUrl: 'https://placehold.co/800x600/f59e0b/ffffff?text=Seni+Budaya',
          alt: 'Pentas Seni',
          tipe: 'IMAGE',
          kategori: 'GALERI'
        }
      ]);
    }

    if (url.includes('/api/public/halaman')) {
      return createResponse({
        id: '1',
        judul: 'Profil Desa',
        slug: 'profil',
        konten: '<h1>Sejarah Desa</h1><p>Desa ini didirikan pada tahun 1900...</p><h2>Visi & Misi</h2><p>Mewujudkan desa yang maju dan sejahtera.</p>',
        isActive: true
      });
    }
    
    if (url.includes('/api/public/statistik')) {
      return createResponse({
        keluarga: 450,
        wilayah: {
          dusun: 4,
          rw: 8,
          rt: 24
        },
        penduduk: { total: 1500, lakiLaki: 760, perempuan: 740 },
        pendidikan: { sd: 500, smp: 400, sma: 300, sarjana: 100, lainnya: 200 },
        pekerjaan: { petani: 800, pns: 50, wiraswasta: 200, lainnya: 450 }
      });
    }

    // Default fallback mock
    return createResponse([]);
  };
}
