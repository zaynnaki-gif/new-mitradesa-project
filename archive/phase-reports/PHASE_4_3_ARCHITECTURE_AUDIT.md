# PHASE 4.3 ARCHITECTURE AUDIT REPORT

## Project: MITRADESA - Service Document Template Engine Foundation
## Date: 2026-08-13

---

## 1. Architecture Overview

### Current State
MITRADESA uses a **layered architecture** with clear separation:
```
Routes → Services → Prisma (Database)
```

### Existing Layers
| Layer | Location | Responsibility |
|-------|----------|----------------|
| Routes | `src/routes/` | HTTP handling, auth middleware, validation |
| Services | `src/services/` | Business logic, data transformation |
| Repositories | `src/repositories/` | Data access (currently empty, using Prisma directly) |
| DTOs | `src/dto/` | Zod validation schemas |

### API Pattern
```typescript
// Route
router.METHOD('/path', authenticateInternal(), authorize('perm'), asyncHandler(async (req, res) => {
  const data = inputSchema.parse(req.body);
  const result = await service.method(data);
  return response.success(res, result);
}));

// Service
class XxxService {
  async method(input: InputType): Promise<OutputType> {
    // Business logic
  }
}
```

---

## 2. Multi-Tenancy Architecture

### Current Implementation
Every tenant-scoped model has a `desaId` field linking to the `Desa` model.

### Tenant-Scoped Models (Require `desaId`)
- `IdentitasDesa`
- `Penduduk`
- `Keluarga`
- `AnggotaKeluarga`
- `PerangkatDesa`
- `Kategori`
- `Berita`
- `Halaman`
- `Media`

### Non-Tenant-Scoped Models (Global)
- `Provinsi`, `Kabupaten`, `Kecamatan`, `Desa`
- `Account`, `Role`, `Permission`
- `InternalSession`, `CitizenSession`
- `AuditLog`, `Configuration`

### Authorization Pattern
```typescript
// Current pattern - relies on account's associated village
const account = await getAccountWithVillage(req.user.accountId);
const desaId = account.perangkatDesa?.desaId;

// All queries must filter by desaId
const items = await prisma.model.findMany({
  where: { desaId }
});
```

---

## 3. Service Definition Architecture

### Required Model Structure
```prisma
model Layanan {
  id              BigInt    @id @default(autoincrement())
  desaId          BigInt    @map("desa_id")
  kode            String    @db.VarChar(20)
  nama            String    @db.VarChar(255)
  slug            String    @unique @db.VarChar(255)
  deskripsi       String?   @db.Text
  kategori        String?   @map("kategori") @db.VarChar(100)
  requiresDocument Boolean  @default(false) @map("requires_document")
  requiresApproval Boolean  @default(true) @map("requires_approval")
  isActive        Boolean   @default(true) @map("is_active")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at") @db.Timestamp(6)

  @@unique([desaId, kode])
  @@index([desaId])
  @@index([slug])
}
```

### Service Categories (Configurable)
```typescript
enum ServiceCategory {
  ADMINISTRASI      // General administration letters
  KEPENDUDUKAN     // Population-related
  KEUANGAN         // Financial
  PEMERINTAHAN     // Government
  LAINNYA          // Others
}
```

---

## 4. Field Registry Architecture

### Required Model Structure
```prisma
model FieldDefinition {
  id            BigInt      @id @default(autoincrement())
  serviceId     BigInt?     @map("service_id")
  templateId    BigInt?     @map("template_id")
  key           String      @db.VarChar(100)
  label         String      @db.VarChar(255)
  type          FieldType
  source        String?     @db.VarChar(100)   // e.g., "penduduk.nik", "desa.nama"
  required      Boolean     @default(false)
  validation    Json?       @map("validation")   // { min, max, pattern, options }
  defaultValue  String?     @map("default_value") @db.VarChar(500)
  description   String?     @db.Text
  options       Json?       // For select/radio/checkbox types
  placeholder   String?     @db.VarChar(255)
  orderIndex    Int         @default(0) @map("order_index")
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  @@unique([serviceId, key])
  @@unique([templateId, key])
  @@index([serviceId])
  @@index([templateId])
}

enum FieldType {
  TEXT
  NUMBER
  DATE
  DATETIME
  SELECT
  MULTISELECT
  RADIO
  CHECKBOX
  TEXTAREA
  FILE
  NIK         // Special: auto-validates NIK format
  EMAIL
  PHONE
  ADDRESS
}
```

### Available Data Sources (Pre-registered)
```typescript
const DATA_SOURCES = {
  // Penduduk (Citizen) fields
  'penduduk.id': { type: 'NUMBER', label: 'ID Penduduk' },
  'penduduk.nik': { type: 'NIK', label: 'NIK' },
  'penduduk.namaLengkap': { type: 'TEXT', label: 'Nama Lengkap' },
  'penduduk.tempatLahir': { type: 'TEXT', label: 'Tempat Lahir' },
  'penduduk.tanggalLahir': { type: 'DATE', label: 'Tanggal Lahir' },
  'penduduk.jenisKelamin': { type: 'SELECT', label: 'Jenis Kelamin' },
  'penduduk.alamat': { type: 'ADDRESS', label: 'Alamat' },
  'penduduk.rt': { type: 'TEXT', label: 'RT' },
  'penduduk.rw': { type: 'TEXT', label: 'RW' },
  'penduduk.dusun': { type: 'TEXT', label: 'Dusun' },

  // IdentitasDesa (Village Identity) fields
  'desa.nama': { type: 'TEXT', label: 'Nama Desa' },
  'desa.kecamatan': { type: 'TEXT', label: 'Kecamatan' },
  'desa.kabupaten': { type: 'TEXT', label: 'Kabupaten' },
  'desa.provinsi': { type: 'TEXT', label: 'Provinsi' },
  'desa.alamat': { type: 'ADDRESS', label: 'Alamat Desa' },
  'desa.kodeDesa': { type: 'TEXT', label: 'Kode Desa' },
  'desa.kepalaDesa': { type: 'TEXT', label: 'Nama Kepala Desa' },

  // Sistem fields
  'system.tanggalSurat': { type: 'DATE', label: 'Tanggal Surat' },
  'system.nomorSurat': { type: 'TEXT', label: 'Nomor Surat' },
  'system.penandatangan': { type: 'TEXT', label: 'Penanda Tangan' },
};
```

---

## 5. Service Request Architecture

### Required Model Structure
```prisma
model PermintaanLayanan {
  id              BigInt          @id @default(autoincrement())
  layananId       BigInt          @map("layanan_id")
  pendudukId      BigInt?         @map("penduduk_id")       // Pemohon
  desaId          BigInt          @map("desa_id")
  nomorPermintaan String          @unique @map("nomor_permintaan") @db.VarChar(50)
  status          RequestStatus   @default(DRAFT)
  dataJson        Json?           @map("data_json")         // Dynamic request data
  catatan         String?         @db.Text
  submittedAt     DateTime?       @map("submitted_at") @db.Timestamp(6)
  processedAt     DateTime?       @map("processed_at") @db.Timestamp(6)
  completedAt     DateTime?       @map("completed_at") @db.Timestamp(6)
  createdBy       BigInt?         @map("created_by")
  processedBy     BigInt?         @map("processed_by")
  approvedBy      BigInt?         @map("approved_by")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")
  deletedAt       DateTime?       @map("deleted_at") @db.Timestamp(6)

  @@index([desaId])
  @@index([layananId])
  @@index([pendudukId])
  @@index([status])
  @@index([nomorPermintaan])
}

enum RequestStatus {
  DRAFT
  SUBMITTED
  VERIFICATION
  PROCESSING
  APPROVED
  REJECTED
  COMPLETED
  CANCELLED
}
```

### Request Numbering Pattern
```
Format: {KODE}/{TAHUN}-{SEQUENCE}
Example: SKD/2026-000123
```

---

## 6. Document Definition Architecture

### Required Model Structure
```prisma
model DokumenDefinition {
  id              BigInt    @id @default(autoincrement())
  layananId       BigInt    @map("layanan_id")
  kode            String    @db.VarChar(20)
  nama            String    @db.VarChar(255)
  slug            String    @unique @db.VarChar(255)
  deskripsi       String?   @db.Text
  isActive        Boolean   @default(true) @map("is_active")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@unique([layananId, kode])
  @@index([layananId])
}
```

---

## 7. Template Architecture

### Required Model Structure
```prisma
model TemplateSurat {
  id              BigInt    @id @default(autoincrement())
  dokumenId       BigInt   @map("dokumen_id")
  nama            String   @db.VarChar(255)
  slug            String   @unique @db.VarChar(255)
  deskripsi       String?  @db.Text
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([dokumenId])
}

model TemplateVersion {
  id              BigInt          @id @default(autoincrement())
  templateId     BigInt          @map("template_id")
  version         Int             @map("version")
  content         Json            // Template content (layout, blocks, bindings)
  kopConfig       Json?           @map("kop_config")
  signatureConfig Json?           @map("signature_config")
  status          VersionStatus   @default(DRAFT)
  changelog       String?         @db.Text
  createdBy       BigInt?         @map("created_by")
  publishedAt     DateTime?       @map("published_at") @db.Timestamp(6)
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  @@unique([templateId, version])
  @@index([templateId])
  @@index([status])
}

enum VersionStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

### Template Content Structure
```typescript
interface TemplateContent {
  metadata: {
    name: string;
    description: string;
    createdAt: string;
    version: number;
  };

  layout: {
    pageSize: 'A4' | 'FOLIO';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
  };

  sections: {
    kop: {
      enabled: boolean;
      config: KopConfig;
    };

    header: {
      enabled: boolean;
      elements: TemplateElement[];
    };

    body: {
      elements: TemplateElement[];
    };

    signature: {
      enabled: boolean;
      config: SignatureConfig;
    };

    footer: {
      enabled: boolean;
      elements: TemplateElement[];
    };
  };
}

interface KopConfig {
  logoDesa: { visible: boolean; position: 'left' | 'center' | 'right' };
  logoKabupaten: { visible: boolean; position: 'left' | 'center' | 'right' };
  namaPemda: { visible: boolean; source: 'config' };
  namaKecamatan: { visible: boolean; source: 'config' };
  namaDesa: { visible: boolean; source: 'desa' };
  alamat: { visible: boolean; source: 'desa' };
  dividerStyle: 'single' | 'double' | 'none';
}

interface SignatureConfig {
  position: 'right' | 'center' | 'left';
  title: string;
  signatoryRole: string;
 nipField: string;
  tandaTanganField: 'upload' | 'generated';
}

interface TemplateElement {
  id: string;
  type: 'text' | 'binding' | 'table' | 'line' | 'space' | 'page-break';
  content?: string;
  binding?: string;        // e.g., "{{penduduk.nama}}"
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    color?: string;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
  };
}
```

---

## 8. Document Instance Architecture

### Required Model Structure
```prisma
model InstanDokumen {
  id                  BigInt          @id @default(autoincrement())
  dokumenId           BigInt          @map("dokumen_id")
  permintaanId        BigInt?         @map("permintaan_id")
  templateVersionId   BigInt          @map("template_version_id")
  nomorDokumen       String          @unique @map("nomor_dokumen") @db.VarChar(50)
  judul              String          @db.VarChar(255)
  dataSnapshot       Json            @map("data_snapshot")       // Immutable copy of bound data
  contentSnapshot    Json            @map("content_snapshot")    // Rendered content snapshot
  status             DocumentStatus  @default(GENERATED)
  generatedAt        DateTime        @default(now()) @map("generated_at")
  signedAt           DateTime?       @map("signed_at") @db.Timestamp(6)
  qrCode             String?         @map("qr_code") @db.VarChar(500)
  verificationToken   String?         @unique @map("verification_token") @db.VarChar(100)
  fileUrl            String?         @map("file_url") @db.VarChar(500)
  createdAt          DateTime        @default(now()) @map("created_at")
  updatedAt          DateTime        @updatedAt @map("updated_at")

  @@index([dokumenId])
  @@index([permintaanId])
  @@index([templateVersionId])
  @@index([nomorDokumen])
  @@index([verificationToken])
}

enum DocumentStatus {
  GENERATED
  PENDING_SIGNATURE
  SIGNED
  VERIFIED
  ARCHIVED
}
```

---

## 9. Document Numbering Architecture

### Required Model Structure
```prisma
model NomorDokumen {
  id              BigInt    @id @default(autoincrement())
  desaId          BigInt    @unique @map("desa_id")
  lastSequence    BigInt    @default(0) @map("last_sequence")
  lastYear        Int       @default(0) @map("last_year")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@map("nomor_dokumen")
}

model NomorSuratConfig {
  id              BigInt    @id @default(autoincrement())
  layananId       BigInt    @unique @map("layanan_id")
  formatTemplate  String    @map("format_template") @db.VarChar(255)
  // Format: "{kode}/{seq}/{kades}/{desa}/{bulan}/{tahun}"
  // Example: "474/{seq}/KADES.SM/{bulanRomawi}/{tahun}"
  startingNumber  BigInt    @default(1) @map("starting_number")
  isActive        Boolean   @default(true) @map("is_active")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@index([layananId])
}
```

### Numbering Format Components
```typescript
interface NumberingFormat {
  // Supported tokens:
  // {seq} - Sequence number (padded to 5 digits)
  // {seq:3} - Sequence number with 3 digits
  // {tahun} - Year (4 digits)
  // {bulan} - Month number (01-12)
  // {bulanRomawi} - Month in Roman numerals (I-XII)
  // {kode} - Classification code
  // {kades} - Village head abbreviation
  // {desa} - Village abbreviation
  // {kecamatan} - District name
  // {klasifikasi} - Document classification

  // Example: "474/{seq:5}/KADES.SM/{bulanRomawi}/{tahun}"
  // Result: "474/00001/KADES.SM/VIII/2026"
}
```

---

## 10. Binding Resolver Architecture

### Resolver Pattern
```typescript
interface BindingResolver {
  // Validates binding syntax
  validate(binding: string): ValidationResult;

  // Resolves binding to actual value
  resolve(binding: string, context: DataContext): ResolvedValue;

  // Gets all bindings from template content
  extractBindings(content: TemplateContent): Binding[];
}

interface DataContext {
  penduduk?: Partial<Penduduk>;
  keluarga?: Partial<Keluarga>;
  identitasDesa?: Partial<IdentitasDesa>;
  permintaan?: Partial<PermintaanLayanan>;
  system?: SystemContext;
  custom?: Record<string, unknown>;
}

interface SystemContext {
  tanggalSurat: Date;
  nomorSurat: string;
  penandatangan: string;
  jabatanPenandatangan: string;
}
```

### Security: Allowed Bindings
```typescript
// Only these bindings are allowed (whitelist approach)
const ALLOWED_BINDINGS = [
  // Penduduk
  'penduduk.id', 'penduduk.nik', 'penduduk.namaLengkap',
  'penduduk.tempatLahir', 'penduduk.tanggalLahir',
  'penduduk.jenisKelamin', 'penduduk.alamat',
  'penduduk.rt', 'penduduk.rw', 'penduduk.dusun',
  'penduduk.golDarah', 'penduduk.agama',
  'penduduk.statusPerkawinan', 'penduduk.wargaNegara',

  // Keluarga
  'keluarga.noKk', 'keluarga.alamat',
  'keluarga.rt', 'keluarga.rw', 'keluarga.dusun',

  // Desa
  'desa.nama', 'desa.kode', 'desa.alamat',
  'desa.kecamatan', 'desa.kabupaten', 'desa.provinsi',
  'desa.kepalaDesa', 'desa.sekretarisDesa',

  // Sistem
  'system.tanggalSurat', 'system.nomorSurat',
  'system.penandatangan', 'system.jabatanPenandatangan',
  'system.tanggal',
];
```

### FORBIDDEN Patterns
```typescript
const FORBIDDEN_PATTERNS = [
  /\beval\s*\(/i,           // No eval()
  /\brequire\s*\(/i,       // No require()
  /\bprocess\b/,            // No process
  /\bglobal\b/,             // No global
  /\b__/ ,                  // No dunder vars
  /\.\./,                   // No path traversal
];
```

---

## 11. Signature & QR Architecture (Foundation)

### Signature Model
```prisma
model DokumenSignature {
  id              BigInt    @id @default(autoincrement())
  dokumenId       BigInt    @unique @map("dokumen_id")
  penandatanganId BigInt    @map("penandatangan_id")
  tandaTanganUrl  String?   @map("tanda_tangan_url") @db.VarChar(500)
  tandaTanganType SignatureType @default(IMAGE)
  signedAt        DateTime  @default(now()) @map("signed_at")
  ipAddress       String?    @map("ip_address") @db.VarChar(45)
  createdAt       DateTime  @default(now()) @map("created_at")

  @@index([dokumenId])
  @@index([penandatanganId])
}

enum SignatureType {
  IMAGE     // Uploaded signature image
  // FUTURE: CRYPTOGRAPHIC, BIO_METRIC, etc.
}

model PenandaTangan {
  id              BigInt    @id @default(autoincrement())
  desaId          BigInt    @map("desa_id")
  nama            String    @db.VarChar(255)
  jabatan         String    @db.VarChar(255)
  nip             String?   @db.VarChar(50)
  tandaTanganUrl  String?   @map("tanda_tangan_url") @db.VarChar(500)
  isActive        Boolean   @default(true) @map("is_active")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@index([desaId])
}
```

### QR Verification Model
```prisma
model VerifikasiDokumen {
  id              BigInt    @id @default(autoincrement())
  dokumenId       BigInt    @unique @map("dokumen_id")
  token           String    @unique @db.VarChar(100)
  qrCodeUrl       String?   @map("qr_code_url") @db.VarChar(500)
  status          VerificationStatus @default(PENDING)
  verifiedAt      DateTime? @map("verified_at") @db.Timestamp(6)
  verifyCount     Int       @default(0) @map("verify_count")
  lastVerifyAt    DateTime? @map("last_verify_at") @db.Timestamp(6)
  createdAt       DateTime  @default(now()) @map("created_at")

  @@index([token])
  @@index([dokumenId])
}
```

---

## 12. API Route Structure

### Proposed Routes
```typescript
// Services
GET    /api/services
GET    /api/services/:id
POST   /api/services
PATCH  /api/services/:id
DELETE /api/services/:id

// Field Definitions
GET    /api/services/:id/fields
POST   /api/services/:id/fields
PATCH  /api/services/:id/fields/:fieldId
DELETE /api/services/:id/fields/:fieldId

// Service Requests
GET    /api/service-requests
GET    /api/service-requests/:id
POST   /api/service-requests
PATCH  /api/service-requests/:id
DELETE /api/service-requests/:id
POST   /api/service-requests/:id/submit
POST   /api/service-requests/:id/process
POST   /api/service-requests/:id/approve
POST   /api/service-requests/:id/reject
POST   /api/service-requests/:id/complete

// Documents
GET    /api/documents
GET    /api/documents/:id
GET    /api/documents/:id/preview
GET    /api/documents/:id/download
GET    /api/documents/verify/:token

// Templates
GET    /api/templates
GET    /api/templates/:id
POST   /api/templates
PATCH  /api/templates/:id
GET    /api/templates/:id/versions
POST   /api/templates/:id/versions
PATCH  /api/templates/:id/versions/:versionId
POST   /api/templates/:id/versions/:versionId/publish
GET    /api/templates/:id/preview
POST   /api/templates/:id/preview-data

// Penanda Tangan
GET    /api/signatories
GET    /api/signatories/:id
POST   /api/signatories
PATCH  /api/signatories/:id
DELETE /api/signatories/:id

// Public Routes (No Auth)
GET    /api/public/verify/:token
GET    /api/public/service-requests/:id/track
```

---

## 13. Security Architecture

### Authorization Matrix
| Role | Services | Requests | Documents | Templates |
|------|----------|----------|-----------|-----------|
| ADMIN | CRUD | CRUD | CRUD | CRUD |
| KADES | CRUD | CRUD | READ | CRUD |
| SEKDES | CRUD | CRUD | READ | CRUD |
| KASI | READ | CRUD (own) | READ | - |
| PUBLIC | - | CREATE (own) | - | - |

### Required Permissions
```typescript
const PERMISSIONS = {
  // Services
  'service.view': 'View service definitions',
  'service.create': 'Create service definitions',
  'service.update': 'Update service definitions',
  'service.delete': 'Delete service definitions',

  // Requests
  'request.view': 'View service requests',
  'request.create': 'Create service requests',
  'request.update': 'Update service requests',
  'request.delete': 'Delete service requests',
  'request.process': 'Process service requests',
  'request.approve': 'Approve service requests',

  // Documents
  'document.view': 'View documents',
  'document.generate': 'Generate documents',
  'document.sign': 'Sign documents',
  'document.verify': 'Verify documents',

  // Templates
  'template.view': 'View templates',
  'template.create': 'Create templates',
  'template.update': 'Update templates',
  'template.publish': 'Publish templates',
};
```

---

## 14. Deferred Features

### Phase 4.3 (This Phase)
- [x] Domain models (Service, Field, Request, Document, Template)
- [x] Basic API routes
- [x] Template versioning
- [x] Binding resolver (safe subset)
- [x] Document numbering abstraction
- [x] Signature foundation (no crypto)
- [x] QR verification foundation (no QR generation)

### Phase 4.4+ (Future)
- [ ] Drag-and-drop template editor
- [ ] Visual canvas editor
- [ ] PDF renderer (Puppeteer/Playwright)
- [ ] DOCX export
- [ ] Cryptographic signatures
- [ ] Email/WhatsApp notification
- [ ] Workflow automation
- [ ] Template marketplace
- [ ] Document archival system
