# PHASE 4.4 BASELINE AUDIT

## Project Overview

**Project:** MITRADESA - Manajemen Informasi dan Administrasi Desa
**Phase:** 4.4 - Template Surat Engine & Visual Template Designer
**Date:** 2026-08-13
**Status:** Pre-implementation Audit COMPLETE

---

## 1. DATABASE AUDIT

### 1.1 Migration Status
- **Baseline:** `20260813000000_baseline_initial_schema` ✓
- **Phase 4.3:** `20260813000001_add_service_document_engine` ✓
- **Total:** 2 migrations applied
- **Database:** PostgreSQL (Supabase)

### 1.2 Phase 4.3 Models (12 Total)
| # | Model | Table | Purpose |
|---|-------|-------|---------|
| 1 | `Layanan` | `layanan` | Service Definition |
| 2 | `FieldDefinition` | `field_definition` | Reusable Field Registry |
| 3 | `PermintaanLayanan` | `permintaan_layanan` | Service Request Instance |
| 4 | `DokumenDefinition` | `dokumen_definition` | Document Types |
| 5 | `TemplateSurat` | `template_surat` | Template Master |
| 6 | `TemplateVersion` | `template_version` | Versioned Content |
| 7 | `InstanDokumen` | `instan_dokumen` | Immutable Snapshot |
| 8 | `NomorDokumen` | `nomor_dokumen` | Document Number Sequence |
| 9 | `NomorSuratConfig` | `nomor_surat_config` | Numbering Format |
| 10 | `PenandaTangan` | `penanda_tangan` | Authorized Signatories |
| 11 | `DokumenSignature` | `dokumen_signature` | Signature Record |
| 12 | `VerifikasiDokumen` | `verifikasi_dokumen` | Public Verification |

### 1.3 Existing Enums
```typescript
enum FieldType { TEXT, NUMBER, DATE, DATETIME, SELECT, MULTISELECT, RADIO, CHECKBOX, TEXTAREA, FILE, NIK, EMAIL, PHONE, ADDRESS }
enum RequestStatus { DRAFT, SUBMITTED, VERIFICATION, PROCESSING, APPROVED, REJECTED, COMPLETED, CANCELLED }
enum VersionStatus { DRAFT, PUBLISHED, ARCHIVED }
enum DocumentStatus { GENERATED, PENDING_SIGNATURE, SIGNED, VERIFIED, ARCHIVED }
enum SignatureType { IMAGE }
```

### 1.4 Schema Strengths
- ✓ Multi-tenant via `desaId` in Layanan, PermintaanLayanan, PenandaTangan
- ✓ Version immutability via TemplateVersion
- ✓ Document snapshot via `dataSnapshot` and `contentSnapshot` in InstanDokumen
- ✓ Atomic numbering via `NomorDokumen.lastSequence`
- ✓ Soft delete on Layanan and PermintaanLayanan

### 1.5 Schema Gaps
- **Kop Surat Config:** TemplateVersion.kopConfig (JSON) exists but needs structured API
- **Signature Config:** TemplateVersion.signatureConfig (JSON) exists but needs structured API
- **Template Content:** TemplateVersion.content (JSON) - needs element system definition
- **Field Registry:** FieldDefinition exists but needs Field Registry API for designer
- **Formatter Registry:** Not yet defined

---

## 2. BACKEND AUDIT

### 2.1 Existing Services
| Service | Location | Status | Notes |
|---------|----------|--------|-------|
| `LayananService` | `layanan.service.ts` | ✓ | CRUD + stats |
| `FieldDefinitionService` | `layanan.service.ts` | ✓ | CRUD + reorder |
| `DokumenDefinitionService` | `dokumen.service.ts` | ✓ | CRUD |
| `TemplateSuratService` | `dokumen.service.ts` | ✓ | CRUD |
| `TemplateVersionService` | `dokumen.service.ts` | ✓ | CRUD + publish/archive |
| `InstanDokumenService` | `dokumen.service.ts` | ✓ | Generate + find |
| `PenandaTanganService` | `dokumen.service.ts` | ✓ | CRUD |
| `PermintaanLayananService` | `permintaan-layanan.service.ts` | ✓ | Full workflow |

### 2.2 Existing Utilities
| Utility | Location | Status | Notes |
|---------|----------|--------|-------|
| `binding-resolver.ts` | `utils/` | ⚠️ | Basic whitelist + resolver exists |
| `numbering.ts` | `utils/` | ⚠️ | Token parsing + atomic generation exists |

### 2.3 Existing Routes
```
/api/services/*              - CRUD + fields
/api/documents/*             - DokumenDefinition CRUD
/api/templates/*             - Template CRUD + versions
/api/templates/:id/versions - Version management
/api/versions/:id/*          - Version CRUD + publish/archive
/api/documents-instance/*   - Document instance
/api/signatories/*          - PenandaTangan CRUD
/api/service-requests/*      - Service request workflow
/api/public/verify/:token   - Public verification
```

### 2.4 Existing DTOs
- All Phase 4.3 schemas defined in `service-document.dto.ts`
- Template content schema (`templateContentSchema`) has basic structure
- Kop config schema (`kopConfigSchema`) defined
- Signature config schema (`signatureConfigSchema`) defined

### 2.5 Gaps to Fill
1. **Template Designer API:** Need endpoints for element operations
2. **Field Registry API:** Need structured field registry for UI picker
3. **Formatter Registry:** Need formatter definitions for binding
4. **Validator API:** Need template validation endpoint
5. **Preview API:** Need preview generation endpoint
6. **Kop Surat API:** Need dedicated Kop configuration endpoints

---

## 3. FRONTEND AUDIT

### 3.1 Existing Pages
```
/apps/web/src/pages/
├── admin/
│   ├── IdentitasDesaPage.tsx
│   ├── PerangkatDesaPage.tsx
│   ├── WilayahPage.tsx
│   ├── LayananPage.tsx          (basic CRUD)
│   └── konten/
│       ├── BeritaPage.tsx
│       ├── HalamanPage.tsx
│       ├── KategoriPage.tsx
│       └── MediaPage.tsx
├── public/
│   ├── LayananPage.tsx           (public listing)
│   └── ...
```

### 3.2 Routing
- Uses React Router v6
- Protected routes via `ProtectedRoute` and `AdminRoute`
- Admin pages require `ADMIN` or `DEVELOPER` role

### 3.3 Component Libraries
- Custom UI components in `components/ui/index.tsx`
- shadcn/ui pattern (Button, Input, Card, Dialog, etc.)
- CSS Modules for layout

### 3.4 API Client
- Fetch-based API calls
- Token management in services

### 3.5 Frontend Gaps
1. **Template Management Page:** Not yet created
2. **Template Designer:** Not yet created
3. **Field Picker Component:** Not yet created
4. **Live Preview Component:** Not yet created
5. **Kop Surat Editor:** Not yet created

---

## 4. SECURITY AUDIT

### 4.1 Existing Protections
- ✓ Authentication via session token
- ✓ Permission-based authorization (`authorize()`)
- ✓ Tenant isolation via `desaId` checks
- ✓ Binding whitelist in `binding-resolver.ts`
- ✓ Forbidden pattern detection in binding validation

### 4.2 XSS Prevention
- Template content stored as JSON (not HTML)
- Binding resolver uses whitelist approach
- No `eval()` or `new Function()` in binding resolver

### 4.3 Security Gaps to Address
1. **Template Content Sanitization:** Need to sanitize text before rendering
2. **File Upload Validation:** Ensure file URLs in templates are validated
3. **Rate Limiting:** Consider adding for template operations
4. **Audit Logging:** Add audit events for template operations

---

## 5. BINDING ENGINE AUDIT

### 5.1 Current State
```typescript
// ALLOWED_BINDINGS whitelist includes:
- penduduk.* (nik, namaLengkap, tempatLahir, tanggalLahir, etc.)
- keluarga.* (noKk, alamat, rt, rw, dusun)
- desa.* (nama, kode, alamat, kecamatan, kabupaten, provinsi)
- system.* (tanggalSurat, nomorSurat, tahun, bulan)
```

### 5.2 Missing Bindings
1. **Wilayah binding:** `wilayah.dusun`, `wilayah.rt`, `wilayah.rw`
2. **Pemerintahan binding:** `kepala_desa`, `sekretaris_desa`
3. **System extended:** `tanggal_indonesia`, `bulan_indonesia`, `tahun_romawi`

### 5.3 Formatter Registry Needed
```typescript
const FORMATTERS = {
  date: (v) => format(v, 'dd-MM-yyyy'),
  tanggal_indonesia: (v) => formatIndonesian(v),
  uppercase: (v) => String(v).toUpperCase(),
  lowercase: (v) => String(v).toLowerCase(),
  capitalize: (v) => capitalize(v),
  currency: (v) => formatCurrency(v, 'IDR'),
  nik: (v) => maskNIK(v),
};
```

---

## 6. NUMBERING ENGINE AUDIT

### 6.1 Current State
```typescript
// Existing tokens:
{seq} / {seq:N} - Sequence number
{tahun}          - Year
{bulan}          - Month (01-12)
{bulanRomawi}    - Month in Roman numerals
{kode}           - Classification code
{kades}          - Village head abbreviation
{desa}           - Village abbreviation
```

### 6.2 Implementation
- Atomic sequence via `NomorDokumen.lastSequence`
- Year rollover logic present
- Race condition protected via Prisma transaction

### 6.3 Gaps
1. **Per-service numbering:** Need configuration per dokumen type
2. **Custom prefix:** Allow custom prefix per template
3. **Reset logic:** Define when sequence resets (yearly, monthly, never)

---

## 7. ELEMENT SYSTEM DESIGN

### 7.1 Proposed Element Types
```typescript
interface Element {
  id: string;
  type: ElementType;
  properties: ElementProperties;
}

enum ElementType {
  TEXT = 'text',
  FIELD = 'field',         // Bound field
  TABLE = 'table',          // Repeater
  IMAGE = 'image',          // Logo, photo
  DIVIDER = 'divider',     // Horizontal line
  SIGNATURE = 'signature', // Signature block
  PAGE_BREAK = 'page_break',
  CONDITIONAL = 'conditional',
}
```

### 7.2 Element Properties
```typescript
interface TextElement {
  type: 'text';
  content: string;          // Supports {{binding}} with formatters
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

interface FieldElement {
  type: 'field';
  binding: string;          // e.g., 'penduduk.namaLengkap'
  formatter?: string;       // e.g., 'uppercase'
  label?: string;
  fontSize: number;
  // ...
}

interface TableElement {
  type: 'table';
  columns: Column[];
  dataSource: string;       // e.g., 'keluarga.anggota'
  headerStyle: TextElement;
  rowStyle: TextElement;
}
```

---

## 8. KOP SURAT DESIGN

### 8.1 Anatomy
```
┌─────────────────────────────────────────────────────────┐
│ [Logo Kabupaten]              [Logo Desa]               │
│                                                         │
│ PEMERINTAH KABUPATEN LOMBOK TIMUR                      │
│ KECAMATAN PRINGGABAYA                                  │
│ DESA SERUNI MUMBUL                                     │
│                                                         │
│ Alamat Kantor                                          │
│ Telepon • Email • Website                              │
│ ═══════════════════════════════════════════════════   │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Configurable Elements
- Logo position (left, center, right)
- Logo size
- Institution names (from IdentitasDesa)
- Address block
- Divider style (single, double, none)
- Header margin from body

---

## 9. WORKFLOW REQUIREMENTS

### 9.1 Template Lifecycle
```
DRAFT → REVIEW → PUBLISHED → ARCHIVED
```

### 9.2 Versioning Rules
1. Only DRAFT versions can be edited
2. Publishing archives current PUBLISHED version
3. Published versions are immutable
4. Documents reference specific version ID

### 9.3 Document Generation Flow
```
1. Select service + template
2. Fill form fields
3. Preview with live data binding
4. Validate template
5. Generate document (snapshot created)
6. Assign signatory
7. Generate PDF
8. Generate QR verification
```

---

## 10. IMPLEMENTATION PRIORITY

### Priority 1: Core Infrastructure
1. [ ] Extend binding resolver with more fields
2. [ ] Create formatter registry
3. [ ] Enhance template content schema
4. [ ] Add template validation endpoint

### Priority 2: Template Designer
1. [ ] Create Template Management page
2. [ ] Build Visual Template Designer
3. [ ] Implement Field Picker
4. [ ] Implement Live Preview
5. [ ] Build Kop Surat Editor

### Priority 3: Document Generation
1. [ ] Create preview API
2. [ ] Implement Kop Surat rendering
3. [ ] Build signature block
4. [ ] Create PDF generation adapter

### Priority 4: Polish
1. [ ] Add audit logging
2. [ ] Enhance error handling
3. [ ] Add unit tests
4. [ ] Create E2E tests

---

## 11. FILES TO CREATE

### Backend
```
apps/api/src/
├── utils/
│   └── formatter-registry.ts     # Formatter definitions
├── services/
│   └── template-designer.service.ts  # Designer operations
└── routes/
    └── service/template-designer.ts # Designer routes
```

### Frontend
```
apps/web/src/
├── pages/admin/surat/
│   ├── TemplateListPage.tsx
│   ├── TemplateDesignerPage.tsx
│   └── TemplatePreviewPage.tsx
├── components/designer/
│   ├── TemplateDesigner.tsx
│   ├── ElementToolbar.tsx
│   ├── FieldPicker.tsx
│   ├── KopEditor.tsx
│   ├── NumberingEditor.tsx
│   ├── SignatureEditor.tsx
│   ├── LivePreview.tsx
│   └── elements/
│       ├── TextElement.tsx
│       ├── FieldElement.tsx
│       ├── TableElement.tsx
│       └── SignatureElement.tsx
└── hooks/
    └── useTemplateDesigner.ts
```

---

## 12. FILES TO MODIFY

### Backend
- `apps/api/src/dto/service-document.dto.ts` - Extend schemas
- `apps/api/src/utils/binding-resolver.ts` - Add more bindings + formatters
- `apps/api/src/routes/service/document.ts` - Add designer routes
- `apps/api/src/services/dokumen.service.ts` - Add designer operations

### Frontend
- `apps/web/src/App.tsx` - Add template routes
- `apps/web/src/lib/constants.ts` - Add nav links
- `apps/web/src/pages/admin/LayananPage.tsx` - Enhance CRUD

---

## 13. DEPENDENCIES

### No New Dependencies Required
- Using existing: React, TypeScript, Prisma, Express, Zod
- Using existing: shadcn/ui components
- PDF generation: Can use `@react-pdf/renderer` or `jspdf` later

---

## 14. CONCLUSION

Phase 4.3 foundation is solid and ready for Phase 4.4:
- ✓ 12 models covering document engine
- ✓ Basic binding resolver with whitelist
- ✓ Atomic numbering system
- ✓ Version immutability
- ✓ Document snapshot pattern

**Phase 4.4 focus:** Build the visual designer layer on top of existing foundation.

---

## 15. RECOMMENDATIONS

1. **Start with extending binding resolver** - This is foundational
2. **Build Field Registry API first** - Powers the Field Picker UI
3. **Create Template Designer component** - Core UX piece
4. **Implement Live Preview** - Critical for usability
5. **Add validation** - Prevents broken templates
6. **Write tests** - Especially for binding resolver and numbering
