MITRADESA — DATABASE CONNECTIVITY UNBLOCK

STATUS: BLOCKED. JANGAN LANJUT KE PHASE 5.

Tujuan: pulihkan koneksi database Supabase dan validasi ulang seluruh infrastructure tanpa mock/fake success.

DATABASE:
Host: db.psxppjmldyhwrqqyqegg.supabase.co
Port: 5432
Error: Can't reach database server / No address associated with hostname.

TASK:

1. Audit DATABASE_URL, .env, .env.test dan pastikan tidak mengubah credential secara sembarangan.
2. Verifikasi DNS, TCP/5432 dan konektivitas PostgreSQL.
3. Tentukan apakah masalah berasal dari Supabase project pause, endpoint, IPv6/network, atau konfigurasi lokal.
4. Jika database kembali accessible, jalankan:
   npx prisma generate
   npx prisma validate
   npx prisma migrate deploy
   npx tsx prisma/seed-reference.ts
5. Verifikasi seluruh tabel, migration dan reference seed langsung ke database.
6. Jalankan TypeScript/build sebagai regression check.
7. Jalankan seluruh Jest database tests menggunakan database nyata.
8. Jangan membuat mock database, jangan mengubah schema hanya untuk membuat test PASS, dan jangan menyatakan PASS jika database belum benar-benar terhubung.
9. Jika koneksi tetap gagal, STOP dan laporkan root cause serta bukti diagnostik.

DEFINITION OF DONE:
DATABASE CONNECTED
MIGRATION PASS
SEED PASS
PRISMA VALIDATE PASS
TYPESCRIPT 0 ERRORS
BUILD PASS
JEST PASS
DATABASE TESTS PASS
REGRESSION PASS
NO DATA LOSS
NO FAKE/MOCK SUCCESS

Jika database belum accessible: STATUS = BLOCKED.
JANGAN PROCEED KE PHASE 5.
