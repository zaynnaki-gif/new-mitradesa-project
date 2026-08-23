# MITRADESA — Admin Panel: Full Repair & Completion Plan

## Current State Assessment

| Issue | Count | Severity |
|---|---|---|
| Pages without AdminLayout (broken nav) | 3 main + 8 konten | 🔴 CRITICAL |
| Wrong/missing `${API_URL}` prefix | 4 pages | 🔴 CRITICAL |
| Token from `localStorage` directly | 3 pages | 🟠 HIGH |
| No dedicated CSS module | 15+ pages | 🟡 MEDIUM |
| ArsipSuratPage disposition button no-op | 1 page | 🟡 MEDIUM |
| No posyandu API route | 0 | 🟠 HIGH |
| Missing new modules (APBDes entry, Kas Umum, etc.) | 5+ | 🟡 MEDIUM |

---

## Phase 1 — Fix Broken Layout & Critical API Issues
**Goal: All pages render with working sidebar/navigation**

### 1.1 IdentitasDesaPage — Fix & Wrap
**File:** `apps/web/src/pages/admin/IdentitasDesaPage.tsx`
**Problems:**
- Uses `<Container>` instead of `<AdminLayout>`
- API URL: `/api/identitas` (no `${API_URL}` prefix)
- No auth token header
- Inline styles everywhere, no CSS module

**Fixes:**
- Wrap in `<AdminLayout>`
- Change to `${API_URL}/identitas-desa`
- Add `Authorization: Bearer ${token}` header via `useAuthStore`
- Extract inline styles → new `IdentitasDesaPage.module.css`
- Add `logoDesaUrl` file upload UI (stretch goal)

**Reference pattern:** Follow `LembagaPage.tsx` structure

### 1.2 PerangkatDesaPage — Fix & Wrap
**File:** `apps/web/src/pages/admin/PerangkatDesaPage.tsx`
**Problems:**
- Uses `<Container>` instead of `<AdminLayout>`
- API URL: `/api/perangkat-desa` (no `${API_URL}` prefix)
- No create/edit modal
- Search not debounced
- Pagination not wired to search

**Fixes:**
- Wrap in `<AdminLayout>`
- Change to `${API_URL}/perangkat-desa`
- Add create/edit modal
- Debounce search
- Wire pagination to search
- Extract inline styles → `PerangkatDesaPage.module.css`
- Add proper CRUD operations

### 1.3 TransparansiPage — Fix & Wrap
**File:** `apps/web/src/pages/admin/konten/TransparansiPage.tsx`
**Problems:**
- Uses `<Container>` instead of `<AdminLayout>`
- Inline styles
- Shows only totals, no APBDesItem breakdown
- `TransparansiForm` used but page lacks full CRUD for APBDesItem

**Fixes:**
- Wrap in `<AdminLayout>`
- Extract inline styles → `TransparansiPage.module.css`
- Change `/api/transparansi` → `${API_URL}/transparansi`

### 1.4 Wrap all 8 remaining konten pages in AdminLayout
**Files (all use `<Container>` or no wrapper):**
- `konten/BeritaPage.tsx` — has `<Container>` + `AdminShared.module.css`
- `konten/HalamanPage.tsx` — inline styles
- `konten/KategoriPage.tsx` — uses `AdminShared.module.css`
- `konten/MediaPage.tsx` — inline styles + `MediaUploadForm`
- `konten/AgendaPage.tsx` — uses `AdminShared.module.css`
- `konten/UmkmPage.tsx` — inline styles
- `konten/PotensiPage.tsx` — inline styles
- `konten/BeritaPage.tsx` (already noted)

**Pattern for each:**
```
import { AdminLayout } from '@/layouts';
return <AdminLayout><Container>...</Container></AdminLayout>
```
- Move inline styles to existing `AdminShared.module.css` OR create individual modules
- Ensure `${API_URL}` prefix in all fetch calls

---

## Phase 2 — Standardize API URL & Token Source
**Goal: Consistent patterns across entire codebase**

### 2.1 Fix API URL prefix — 4 pages
| File | Current | Should be |
|---|---|---|
| `IdentitasDesaPage.tsx` | `/api/identitas` | `${API_URL}/identitas-desa` |
| `PerangkatDesaPage.tsx` | `/api/perangkat-desa` | `${API_URL}/perangkat-desa` |
| `TransparansiPage.tsx` | `/api/transparansi` | `${API_URL}/transparansi` |
| `AppDashboard.tsx` | `/api/dashboard/*` | `${API_URL}/dashboard/*` |

### 2.2 Fix Token Source — 3 pages
Replace `localStorage.getItem('token')` with `useAuthStore().token`:
- `ArsipSuratPage.tsx` (3 occurrences)
- `AppDashboard.tsx` (1 occurrence)
- `DokumenListPage.tsx` (2 occurrences)
- `DokumenDetailPage.tsx` (1 occurrence)

### 2.3 Create `AdminShared.module.css` if missing
Currently some pages share this. Verify it exists and has all shared patterns:
- `.pageHeader`, `.filters`, `.searchInput`, `.tableContainer`, `.table`, `.th`, `.td`, `.tr`
- `.pagination`, `.paginationControls`, `.pageInfo`, `.emptyState`

---

## Phase 3 — Create CSS Modules for All Admin Pages
**Goal: No more inline styles in admin pages**

### 3.1 Existing pages needing CSS modules
| Page | File | Notes |
|---|---|---|
| IdentitasDesaPage | NEW `IdentitasDesaPage.module.css` | Form-based, section groups |
| PerangkatDesaPage | NEW `PerangkatDesaPage.module.css` | Table + modal |
| TransparansiPage | NEW `TransparansiPage.module.css` | Table + modal |
| BeritaPage | NEW `BeritaPage.module.css` | Card list + modal |
| HalamanPage | NEW `HalamanPage.module.css` | Table + modal |
| KategoriPage | NEW `KategoriPage.module.css` | Simple table |
| MediaPage | NEW `MediaPage.module.css` | Grid upload |
| AgendaPage | NEW `AgendaPage.module.css` | Table + modal |
| UmkmPage | NEW `UmkmPage.module.css` | Table + modal |
| PotensiPage | NEW `PotensiPage.module.css` | Card grid |
| DokumenListPage | NEW `DokumenListPage.module.css` | Table + modal |
| DokumenDetailPage | NEW `DokumenDetailPage.module.css` | Detail view |
| TemplateListPage | NEW `TemplateListPage.module.css` | Table + modal |
| AppDashboard | (has `ExecutiveDashboard.module.css` — rename/expand) |

### 3.2 CSS Module Template
Standard structure for all admin pages:
```css
.container { padding: 1.5rem; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: 600; margin: 0; color: var(--color-text); }
.subtitle { color: var(--color-text-secondary); margin: 0.25rem 0 0; font-size: 0.875rem; }
.headerActions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.filters { margin-bottom: 1rem; }
.filterRow { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: flex-end; }
.tableWrapper { overflow-x: auto; background: white; border-radius: 0.5rem; border: 1px solid var(--color-border); }
.table { width: 100%; border-collapse: collapse; min-width: 800px; }
.table th, .table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--color-border); font-size: 0.875rem; }
.table th { background: var(--color-bg-secondary); font-weight: 600; color: var(--color-text-secondary); }
.table tbody tr:hover { background: var(--color-bg-hover); }
.empty { text-align: center; padding: 3rem; color: var(--color-text-secondary); }
.actions { white-space: nowrap; }
.actions button + button { margin-left: 0.25rem; }
.modalOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-start; justify-content: center; padding-top: 2rem; overflow-y: auto; z-index: 1000; }
.modal { background: white; border-radius: 0.5rem; width: 100%; max-width: 640px; margin: 1rem; }
.modalHeader { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--color-border); }
.modalHeader h2 { margin: 0; font-size: 1.125rem; }
.form { padding: 1.5rem; }
.formActions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; }
@media (max-width: 640px) { .formGrid { grid-template-columns: 1fr; } }
```

---

## Phase 4 — Fix ArsipSuratPage Disposisi
**File:** `apps/web/src/pages/admin/surat/ArsipSuratPage.tsx`

### 4.1 Implement Disposisi Button
- When "Disposisi" button clicked → open a Modal
- Form fields: Tujuan (text), Instruksi (textarea), Tanggal Selesai (date)
- POST to `${API_URL}/arsip-surat/masuk/${suratId}/disposisi`
- Refresh after save
- Show existing disposisi in a collapsible section

### 4.2 Fix "Lihat" Button for Surat Keluar
- Should navigate to detail view or open modal with document details
- Either: Link to `/admin/dokumen/${surat.id}` or open inline preview modal

### 4.3 Fix Token Source
- Replace `localStorage.getItem('token')` with `useAuthStore().token`

---

## Phase 5 — Build Backend API Routes
**Goal: Backend supports all frontend features**

### 5.1 Posyandu Kesehatan Route
**File:** `apps/api/src/routes/kesehatan/posyandu.ts` (NEW)

```
GET    /api/posyandu/kunjungan          — list with pagination, filters
POST   /api/posyandu/kunjungan          — create visit record
GET    /api/posyandu/kunjungan/:id      — get single
PATCH  /api/posyandu/kunjungan/:id      — update
DELETE /api/posyandu/kunjungan/:id        — delete
```

**Prisma model addition:** `PosyanduKunjungan` (see Phase 7)

### 5.2 Extend Transparansi/APBDes Route
**File:** `apps/api/src/routes/keuangan/apbdes.ts` (NEW, or extend transparansi.ts)
- GET APBDes with items breakdown by kategori (PENDAPATAN, BELANJA, PEMBIAYAAN)
- CRUD for ApbdesItem
- Realisasi update per item

### 5.3 Disposisi Route
**File:** `apps/api/src/routes/arsip-surat.ts` (extend)
- Add: `POST /arsip-surat/masuk/:id/disposisi`
- Return disposisi list per surat

---

## Phase 6 — Build Missing Frontend Modules

### 6.1 APBDes Entry Page
**File:** `apps/web/src/pages/admin/keuangan/AdminApbdesPage.tsx` (NEW)
**Route:** `/admin/keuangan/apbdes` (NEW)
**Sidebar:** "Keuangan" section (NEW)

Features:
- Year selector
- Three tabs: Pendapatan | Belanja | Pembiayaan
- Table with columns: Nama | Anggaran | Realisasi | Sisa | % | Aksi
- Inline edit for anggaran/realisasi
- Add item modal
- Progress bars per category

### 6.2 Kas Umum Page
**File:** `apps/web/src/pages/admin/keuangan/AdminKasUmumPage.tsx` (NEW)
**Route:** `/admin/keuangan/kas-umum`
Features:
- Date range filter
- Cash flow table: Tanggal | Keterangan | Masuk | Keluar | Saldo
- Running balance calculation
- Add transaksi modal (jenis: KAS_MASUK / KAS_KELUAR)
- Print/export

### 6.3 Buku Bank Page
**File:** `apps/web/src/pages/admin/keuangan/AdminBukuBankPage.tsx` (NEW)
**Route:** `/admin/keuangan/buku-bank`
Features:
- Bank account selector
- Book entry: Tanggal | Uraian | Kode | Debit | Kredit | Saldo
- Reconciliation marking
- Monthly report view

### 6.4 Bansos Page
**File:** `apps/web/src/pages/admin/pemberdayaan/AdminBansosPage.tsx` (NEW)
**Route:** `/admin/pemberdayaan/bansos`
Features:
- List of social assistance programs
- Recipient management
- Distribution tracking
- Period/year filter

### 6.5 User Management Page
**File:** `apps/web/src/pages/admin/sistem/AdminUserPage.tsx` (NEW)
**Route:** `/admin/sistem/user`
Features:
- Account CRUD (admin accounts, not citizens)
- Role assignment
- Status toggle (active/inactive)
- Password reset

### 6.6 Activity Log Page
**File:** `apps/web/src/pages/admin/sistem/AdminActivityLogPage.tsx` (NEW)
**Route:** `/admin/sistem/activity-log`
Features:
- AuditLog table: Waktu | Actor | Action | Entity | Detail
- Filters: date range, entity type, actor
- Paginated view

---

## Phase 7 — Database Schema Extensions

### 7.1 PosyanduKunjungan Model (Prisma)
```prisma
model PosyanduKunjungan {
  id               String    @id @default(cuid())
  pendudukId       BigInt    @map("penduduk_id")
  tanggalKunjungan DateTime  @map("tanggal_kunjungan") @db.Date
  kategori         String    // IBU_HAMIL, BALITA, LANSIA, UMUM
  mingguKehamilan  Int?
  tekananDarah     String?
  beratBadanIbu   Float?
  beratBadan      Float?
  panjangBadan    Float?
  lingkarKepala   Float?
  statusGizi       String?
  gulaDarah       Float?
  imunisasi        String?
  vitamin          String?
  catatan          String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("posyandu_kunjungan")
}
```

### 7.2 KasUmum Model
```prisma
model KasUmum {
  id          String   @id @default(cuid())
  tanggal     DateTime @db.Date
  jenis       String   // KAS_MASUK, KAS_KELUAR
  uraian      String
  jumlah      Float
  saldo       Float
  createdAt   DateTime @default(now())
  @@map("kas_umum")
}
```

### 7.3 BukuBank Model
```prisma
model BukuBank {
  id          String   @id @default(cuid())
  tanggal     DateTime @db.Date
  uraian      String
  kodeBukti   String?
  debit       Float    @default(0)
  kredit      Float    @default(0)
  saldo       Float
  rekonsiliasi Boolean @default(false) @map("rekonsiliasi")
  createdAt   DateTime @default(now())
  @@map("buku_bank")
}
```

### 7.4 Bansos Model
```prisma
model Bansos {
  id           String   @id @default(cuid())
  nama         String
  jenis        String   // BLT, PKH, BPNT, dll
  tahun        Int
  periode      String?
  jumlahPenerima Int    @default(0) @map("jumlah_penerima")
  jumlahDana   Float    @default(0) @map("jumlah_dana")
  createdAt    DateTime @default(now())
  @@map("bansos")
}
```

---

## Phase 8 — Final Integration & Polish

### 8.1 Sidebar Update (AdminLayout)
Add new sections:
```tsx
{
  title: 'Keuangan',
  items: [
    { label: 'APBDes', href: '/admin/keuangan/apbdes', icon: '💰' },
    { label: 'Kas Umum', href: '/admin/keuangan/kas-umum', icon: '📒' },
    { label: 'Buku Bank', href: '/admin/keuangan/buku-bank', icon: '🏦' },
  ]
},
{
  title: 'Pemberdayaan',
  items: [
    { label: 'Bansos', href: '/admin/pemberdayaan/bansos', icon: '🎁' },
  ]
},
{
  title: 'Sistem',
  items: [
    { label: 'User Management', href: '/admin/sistem/user', icon: '👤' },
    { label: 'Activity Log', href: '/admin/sistem/activity-log', icon: '📋' },
  ]
},
```

### 8.2 App.tsx Route Registration
Register all new routes with lazy imports.

### 8.3 Constants.ts Sync
Update `ADMIN_NAV_LINKS` with all new items.

### 8.4 Final Quality Checklist
- [ ] All admin pages have `AdminLayout` wrapper
- [ ] All API calls use `${API_URL}` prefix
- [ ] All pages use `useAuthStore().token`
- [ ] All pages have dedicated CSS modules (no inline styles)
- [ ] All form submissions have loading + error states
- [ ] All tables have empty states
- [ ] All delete actions have confirmation
- [ ] All routes are registered in App.tsx
- [ ] All nav items in sidebar are wired
- [ ] Build passes (no TypeScript errors)

---

## Execution Order

```
Phase 1  → Fix IdentitasDesaPage (critical, most complex)
Phase 1  → Fix PerangkatDesaPage
Phase 1  → Fix TransparansiPage
Phase 1  → Wrap 8 konten pages in AdminLayout

Phase 2  → Fix API_URL on 4 pages
Phase 2  → Fix localStorage token on 3 pages

Phase 3  → Create CSS modules for all 13 admin pages

Phase 4  → Fix ArsipSuratPage (disposisi + surat keluar)

Phase 5  → Build posyandu API route
Phase 5  → Extend APBDes API route

Phase 6  → Build APBDes Entry page
Phase 6  → Build Kas Umum page
Phase 6  → Build Buku Bank page
Phase 6  → Build Bansos page
Phase 6  → Build User Management page
Phase 6  → Build Activity Log page

Phase 7  → Prisma schema extensions (run migrations)
Phase 8  → Final integration & polish
```
