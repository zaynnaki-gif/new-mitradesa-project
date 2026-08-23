# Status Pengerjaan

## Kondisi Keseluruhan
| Status | Jumlah |
|--------|--------|
| ✅ Well-implemented | ~24 halaman |
| ✅ Wrap AdminLayout | 16 halaman (DONE) |
| ✅ Standarisasi API_URL + token | DONE |
| ✅ CSS Module | 6 file dirapikan |
| ✅ APBDes Entry + Kas Umum | DONE |
| ❌ Belum dibuat | - |

## ✅ Done — Wrap AdminLayout (16 halaman)
Semua halaman admin sekarang render dengan sidebar/topbar:

- [x] IdentitasDesaPage
- [x] PerangkatDesaPage
- [x] WilayahPage
- [x] TemplateListPage
- [x] DokumenListPage
- [x] DokumenDetailPage
- [x] BeritaPage
- [x] UmkmPage
- [x] PotensiPage
- [x] TransparansiPage
- [x] MediaPage
- [x] HalamanPage
- [x] KategoriPage
- [x] AgendaPage
- [x] LayananFieldsPage
- [x] LayananListPage
- [x] ExecutiveDashboard
- [x] LembagaPage

## ✅ Done — Standarisasi API_URL + Token
- [x] VerifyPage — `/api/public/verify` → `${API_URL}/public/verify`
- [x] RequestOtpPage — `/api/auth/citizen/...` → `${API_URL}/auth/citizen/...`
- [x] Semua halaman admin sudah pakai `useAuthStore` untuk token
- [x] Tidak ada `localStorage.getItem` di halaman admin

## ✅ Done — CSS Module
6 halaman dirapikan dari inline styles ke CSS module:

- [x] UmkmPage — CSS module baru
- [x] PotensiPage — CSS module baru
- [x] KategoriPage — CSS module baru
- [x] HalamanPage — CSS module baru
- [x] MediaPage — CSS module baru
- [x] TemplateListPage — CSS module baru

## ❌ Belum Dibuat Sama Sekali (Missing Modules)

### 💰 Keuangan / APBDes
| Modul | Keterangan |
|-------|-----------|
| ✅ APBDes Entry | Input rincian APBDes per tahun |
| ✅ Kas Umum | Buku kas umum (pemasukan/pengeluaran) |
| RKPDes | Rencana kerja pembangunan |
| SPP / SPM / SP2D | Alur pembayaran desa |
| Buku Bank | Rekonsiliasi buku bank |

### 👥 Kependudukan / Pemberdayaan
| Modul | Keterangan |
|-------|-----------|
| Bumil | Tracking ibu hamil (terpisah dari posyandu) |
| ✅ Mutasi Penduduk | Lahir, mati, pindah datang, pindah pergi |

### 🏛️ Pemerintahan
| Modul | Keterangan |
|-------|-----------|
| ✅ BPD | Kelola anggota BPD (sudah ada di LembagaPage) |
| ✅ Bansos | Distribusi bantuan sosial |
| ✅ Saran/Aduan | Aspirasi warga |

### ⚙️ Sistem
| Modul | Keterangan |
|-------|-----------|
| ✅ User Management | CRUD user admin |
| ✅ Activity Log | Riwayat perubahan data |
| ✅ Konfigurasi App | Pengaturan global |
| ✅ Export PDF | Batch export data tabel |

## Urutan Kerja yang Disarankan

1. ~~WRAP semua halaman tanpa AdminLayout ← DONE~~
2. ~~Standarisasi API_URL + token ← DONE~~
3. ~~CSS Module ← 6 file dirapikan, sisanya masih inline styles~~
4. ~~Keuangan: APBDes Entry + Kas Umum ← DONE~~
5. ~~Kependudukan: Mutasi Penduduk ← DONE~~
6. ~~Pemerintahan: BPD + Bansos + Saran ← DONE~~
7. ~~Sistem: User Management + Activity Log ← DONE~~
8. ~~Sistem: Konfigurasi + Export ← DONE~~
