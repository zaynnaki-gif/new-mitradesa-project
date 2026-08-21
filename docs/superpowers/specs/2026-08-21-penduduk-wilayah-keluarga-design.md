# Desain: Fitur Manajemen Penduduk, Wilayah & Keluarga

**Tanggal:** 2026-08-21
**Status:** Disetujui
**Fase:** Implementasi bertahap (4 fase)

---

## Ringkasan

Membuat 4 fitur utama:
1. **Database schema** untuk wilayah hierarki (Gubug → RW → RT)
2. **API wilayah** dengan endpoint CRUD + tree + dropdown
3. **Halaman Wilayah** dengan tree view interaktif
4. **Halaman Keluarga** dengan CRUD + Export/Import CSV

---

## 1. Database Schema

### 1.1 Tabel Baru: `Gubug`

Wilayah tingkat dusun. Menyimpan data gubug (nama lain dusun) per desa.

```prisma
model Gubug {
  id        BigInt    @id @default(autoincrement())
  desaId    BigInt    @map("desa_id")
  kode      String    @db.VarChar(20)
  nama      String    @db.VarChar(100)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  rws       Rw[]
  desa      Desa      @relation(fields: [desaId], references: [id], onUpdate: NoAction)

  @@unique([desaId, kode])
  @@index([desaId])
  @@map("gubug")
}
```

### 1.2 Tabel Baru: `Rw`

Wilayah tingkat RW, milik 1 Gubug.

```prisma
model Rw {
  id        BigInt    @id @default(autoincrement())
  gubugId   BigInt    @map("gubug_id")
  kode      String    @db.VarChar(20)
  nama      String    @db.VarChar(100)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  rts       Rt[]
  gubug     Gubug    @relation(fields: [gubugId], references: [id], onUpdate: NoAction)

  @@unique([gubugId, kode])
  @@index([gubugId])
  @@map("rw")
}
```

### 1.3 Tabel Baru: `Rt`

Wilayah tingkat RT, milik 1 RW. Hanya punya `kode` saja, tanpa `nama`.

```prisma
model Rt {
  id        BigInt    @id @default(autoincrement())
  rwId      BigInt    @map("rw_id")
  kode      String    @db.VarChar(20)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  rw        Rw       @relation(fields: [rwId], references: [id], onUpdate: NoAction)

  @@unique([rwId, kode])
  @@index([rwId])
  @@map("rt")
}
```

### 1.4 Relasi

```
Desa (1) ──→ (N) Gubug (1) ──→ (N) Rw (1) ──→ (N) Rt
```

### 1.5 Enum AuditAction Tambahan

```prisma
GUBUG_CREATED
GUBUG_UPDATED
GUBUG_DELETED
RW_CREATED
RW_UPDATED
RW_DELETED
RT_CREATED
RT_UPDATED
RT_DELETED
```

---

## 2. API Endpoints

### 2.1 Wilayah

Base path: `/api/wilayah`

| Method | Endpoint | Deskripsi | Access |
|--------|----------|-----------|--------|
| GET | `/gubug` | List gubug (filter by `desaId`) | Public |
| GET | `/gubug/:id` | Get gubug by ID | Public |
| POST | `/gubug` | Create gubug | Admin |
| PUT | `/gubug/:id` | Update gubug | Admin |
| DELETE | `/gubug/:id` | Delete gubug (cascade RW/RT) | Admin |
| GET | `/gubug/:id/rw` | List RW di gubug | Public |
| GET | `/rw` | List semua RW (filter by `gubugId`) | Public |
| GET | `/rw/:id` | Get RW by ID | Public |
| POST | `/rw` | Create RW | Admin |
| PUT | `/rw/:id` | Update RW | Admin |
| DELETE | `/rw/:id` | Delete RW (cascade RT) | Admin |
| GET | `/rw/:id/rt` | List RT di RW | Public |
| GET | `/rt` | List semua RT (filter by `rwId`) | Public |
| GET | `/rt/:id` | Get RT by ID | Public |
| POST | `/rt` | Create RT | Admin |
| PUT | `/rt/:id` | Update RT | Admin |
| DELETE | `/rt/:id` | Delete RT | Admin |
| GET | `/tree` | Full hierarchy (Desa → Gubug → RW → RT) | Public |
| GET | `/dropdown` | Flat dropdown data untuk form | Public |

#### Endpoint `GET /tree`

```json
{
  "data": [
    {
      "id": 1,
      "kode": "01",
      "nama": "Mandiri",
      "rw": [
        {
          "id": 1,
          "kode": "01",
          "nama": "RW 01",
          "rt": [
            { "id": 1, "kode": "001" },
            { "id": 2, "kode": "002" }
          ]
        }
      ]
    }
  ]
}
```

#### Endpoint `GET /dropdown`

```json
{
  "data": {
    "gubug": [{ "id": 1, "kode": "01", "nama": "Mandiri" }],
    "rw": [{ "id": 1, "gubugId": 1, "kode": "01", "nama": "RW 01" }],
    "rt": [{ "id": 1, "rwId": 1, "kode": "001" }]
  }
}
```

### 2.2 Keluarga

Base path: `/api/keluarga` (existing, add endpoints berikut)

| Method | Endpoint | Deskripsi | Access |
|--------|----------|-----------|--------|
| GET | `/` | List keluarga (pagination + filter) | Admin |
| GET | `/:id` | Detail keluarga + anggota | Admin |
| POST | `/` | Create keluarga + kepala sebagai anggota | Admin |
| PATCH | `/:id` | Update keluarga | Admin |
| DELETE | `/:id` | Soft delete | Admin |
| GET | `/:id/anggota` | List anggota keluarga | Admin |
| POST | `/:id/anggota` | Tambah anggota | Admin |
| PATCH | `/:id/anggota/:anggotaId` | Update anggota | Admin |
| DELETE | `/:id/anggota/:anggotaId` | Hapus anggota | Admin |
| POST | `/export` | Download CSV keluarga + anggota | Admin |
| POST | `/import` | Upload CSV keluarga + anggota | Admin |

#### Export CSV Response

Trigger download file `keluarga_YYYY-MM-DD.csv`:

```csv
No_KK,Nama_Kepala,Alamat,Gubug,RW,RT,Nama_Anggota,Hubungan,NIK_Anggota
350123xxxxx,Budi Santoso,Jl. Utama,Mandiri,01,001,Siti Aminah,ISTRI,3501xxxxx
350123xxxxx,Budi Santoso,Jl. Utama,Mandiri,01,001,Budi Santoso,KEPALA,3501xxxxx
```

#### Import CSV Request

```
POST /api/keluarga/import
Content-Type: multipart/form-data

file: <CSV file>
```

**Proses:**
1. Parse CSV
2. Upsert keluarga by `No_KK`
3. Upsert anggota by `NIK` (create penduduk if not exists)
4. Batch processing untuk performance

**Response:**

```json
{
  "success": true,
  "message": "Import selesai",
  "data": {
    "keluargaCreated": 5,
    "keluargaUpdated": 10,
    "pendudukCreated": 3,
    "pendudukUpdated": 12,
    "failed": 2,
    "errors": [
      "Baris 5: NIK tidak valid",
      "Baris 8: No KK duplikat"
    ]
  }
}
```

---

## 3. Halaman Admin

### 3.1 Halaman Wilayah

**Route:** `/admin/master/wilayah`
**Route lama:** `/admin/master/wilayah` (rewrite)

#### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Master Wilayah                        [+ Tambah Gubug]   │
├──────────────────────────────────────────────────────────┤
│  Desa: [Pilih Desa ▼]                                   │
│                                                          │
│  ▼ Gubug: Mandiri (Kode: 01)          [✏️ Edit] [🗑️ Hps]│
│    ▼ RW 01                                  [✏️][🗑️][+]  │
│      ├─ RT 001                              [✏️][🗑️]   │
│      ├─ RT 002                              [✏️][🗑️]   │
│      └─ RT 003                              [✏️][🗑️]   │
│    ▼ RW 02                                  [✏️][🗑️][+]  │
│      ├─ RT 001                              [✏️][🗑️]   │
│      └─ (kosong)                             [+]        │
│                                                          │
│  ▼ Gubug: Mawar (Kode: 02)           [✏️ Edit] [🗑️ Hps]│
└──────────────────────────────────────────────────────────┘
```

#### Komponen UI

- **Tree View**: Collapsible per Gubug dan RW
- **Dropdown Desa**: Load dari API wilayah (di头部)
- **Tombol [+ Tambah]**: Inline form untuk tambah RW (di level Gubug) atau RT (di level RW)
- **Tombol [✏️][🗑️]**: Edit/hapus per item
- **Confirm dialog**: Untuk operasi delete

#### Form Modal

**Tambah/Edit Gubug:**
- Kode (text, required)
- Nama (text, required)

**Tambah/Edit RW:**
- Kode (text, required)
- Nama (text, required)
- Gubug (readonly, dari konteks)

**Tambah/Edit RT:**
- Kode (text, required, contoh: "001")
- RW (readonly, dari konteks)

### 3.2 Halaman Keluarga

**Route:** `/admin/master/keluarga` (NEW)

#### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Data Keluarga                                           │
│  [🔍 Cari No. KK...]        [📥 Export] [📤 Import]     │
│                             [+ Tambah Keluarga]           │
├──────────────────────────────────────────────────────────┤
│ No KK      │ Kepala Keluarga │ Alamat      │ Aksi       │
│ 350123...  │ Budi Santoso   │ Jl. Utama   │ [Detail][✏️][🗑️] │
│ 350124...  │ Siti Aminah   │ Jl. Mawar   │ [Detail][✏️][🗑️] │
└──────────────────────────────────────────────────────────┘
Pagination: < 1 2 3 ... 10 >
```

#### Modal Tambah/Edit Keluarga

```
┌──────────────────────────────────────────────────────────┐
│ Tambah/Edit Keluarga                              [X]    │
├──────────────────────────────────────────────────────────┤
│ No. KK:        [________________]                         │
│ Alamat:        [________________]                         │
│ Gubug:         [Pilih Gubug ▼]                           │
│ RW:            [Pilih RW ▼]                              │
│ RT:            [Pilih RT ▼]                               │
│                                                          │
│ Kepala Keluarga: [Cari NIK/Nama ▼] 🔍                    │
│                  (Dropdown/search penduduk)                │
│                                                          │
│                            [Batal]  [Simpan]             │
└──────────────────────────────────────────────────────────┘
```

#### Modal Detail Keluarga

```
┌──────────────────────────────────────────────────────────┐
│ Detail Keluarga                                   [X]    │
├──────────────────────────────────────────────────────────┤
│ No. KK: 350123xxxxx                                     │
│ Alamat: Jl. Utama, Gubug Mandiri RW 01 RT 001           │
│                                                          │
│ Daftar Anggota Keluarga                      [+ Tambah]  │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ NIK        │ Nama         │ Hubungan │ Status │ Aksi │ │
│ │ 3501xxxxx  │ Budi S.      │ KEPALA   │ Aktif  │ [✏️] │ │
│ │ 3501xxxxx  │ Siti Aminah  │ ISTRI    │ Aktif  │ [✏️][🗑️]│ │
│ └──────────────────────────────────────────────────────┘ │
│                                                    [Tutup]│
└──────────────────────────────────────────────────────────┘
```

#### Modal Import CSV

```
┌──────────────────────────────────────────────────────────┐
│ Import Data Keluarga dari CSV                    [X]    │
├──────────────────────────────────────────────────────────┤
│ Download template: [template_import_keluarga.csv]        │
│                                                          │
│ Upload file: [Pilih File...]                             │
│                                                          │
│ ── Hasil Import ──                                       │
│ ✅ Keluarga dibuat: 5                                    │
│ ✅ Keluarga diupdate: 10                                 │
│ ✅ Penduduk dibuat: 3                                    │
│ ✅ Penduduk diupdate: 12                                 │
│ ❌ Gagal: 2                                             │
│   - Baris 5: NIK tidak valid                            │
│   - Baris 8: No KK duplikat                             │
│                                                    [Tutup]│
└──────────────────────────────────────────────────────────┘
```

---

## 4. File yang Dibuat/Diubah

### Fase 1: Database
```
apps/api/prisma/schema.prisma              — add Gubug, Rw, Rt models
apps/api/prisma/migrations/               — generate migration
```

### Fase 2: API Wilayah
```
apps/api/src/services/wilayah.service.ts   — add CRUD methods + tree + dropdown
apps/api/src/routes/wilayah.ts            — add gubug/rw/rt endpoints
apps/api/src/dto/wilayah.dto.ts           — add Zod schemas (NEW)
```

### Fase 3: Halaman Wilayah
```
apps/web/src/pages/admin/WilayahPage.tsx  — rewrite with tree view
apps/web/src/components/ui/               — add TreeView component if needed
```

### Fase 4: Halaman Keluarga + CSV
```
apps/web/src/pages/admin/master/KeluargaPage.tsx    — NEW
apps/web/src/pages/admin/master/KeluargaPage.module.css — NEW
apps/api/src/routes/keluarga.ts             — add export/import endpoints
apps/api/src/dto/keluarga.dto.ts            — add export/import schemas
apps/web/src/App.tsx                        — add route /admin/master/keluarga
```

---

## 5. Catatan Teknis

### 5.1 Cascade Delete
- Hapus Gubug → cascade hapus semua RW dan RT di dalamnya
- Hapus RW → cascade hapus semua RT di dalamnya
- Hapus RT → standalone, aman

### 5.2 Soft Delete
- Tidak ada soft delete untuk Gubug, RW, RT — hard delete langsung
- Alasan: wilayah adalah data master yang jarang berubah

### 5.3 Performance
- Endpoint `/tree` harus efficient — pakai single query dengan nested include
- Endpoint `/dropdown` harus fast — query terpisah per level

### 5.4 Validasi Import CSV
- NIK harus 16 digit
- No KK harus 16 digit
- Hubungan harus sesuai enum (KEPALA, ISTRI, ANAK, dll)
- Jika NIK tidak ada → create penduduk baru (basic data)
- Jika NIK ada → update data jika ada perubahan

---

## 6. Fase Implementasi

| Fase | Deskripsi | Estimasi |
|------|-----------|----------|
| 1 | Database schema + migration | 1-2 jam |
| 2 | API wilayah (CRUD + tree + dropdown) | 2-3 jam |
| 3 | Halaman Wilayah (tree view + forms) | 3-4 jam |
| 4 | Halaman Keluarga + CSV export/import | 4-5 jam |

**Total estimasi: ~10-14 jam**
