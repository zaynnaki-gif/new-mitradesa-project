# PHASE 4.5 BASELINE AUDIT

## Project Overview

**Project:** MITRADESA - Manajemen Informasi dan Administrasi Desa
**Phase:** 4.5 - Production-Grade Surat Engine, Visual Designer, PDF Rendering & E2E Verification
**Date:** 2026-08-13
**Status:** Pre-implementation Audit COMPLETE

---

## 1. DATABASE AUDIT (Phase 4.3 + 4.4)

### 1.1 Migration Status
- **Baseline:** `20260813000000_baseline_initial_schema` ✓
- **Phase 4.3:** `20260813000001_add_service_document_engine` ✓
- **Phase 4.4:** No migration (configuration-only) ✓
- **Total:** 2 migrations applied
- **Database:** PostgreSQL (Supabase)

### 1.2 Phase 4.3-4.4 Models (12 Total)
| # | Model | Table | Purpose | Phase |
|---|-------|-------|---------|-------|
| 1 | `Layanan` | `layanan` | Service Definition | 4.3 |
| 2 | `FieldDefinition` | `field_definition` | Reusable Field Registry | 4.3 |
| 3 | `PermintaanLayanan` | `permintaan_layanan` | Service Request Instance | 4.3 |
| 4 | `DokumenDefinition` | `dokumen_definition` | Document Types | 4.3 |
| 5 | `TemplateSurat` | `template_surat` | Template Master | 4.3 |
| 6 | `TemplateVersion` | `template_version` | Versioned Content | 4.3 |
| 7 | `InstanDokumen` | `instan_dokumen` | Immutable Snapshot | 4.3 |
| 8 | `NomorDokumen` | `nomor_dokumen` | Document Number Sequence | 4.3 |
| 9 | `NomorSuratConfig` | `nomor_surat_config` | Numbering Format | 4.3 |
| 10 | `PenandaTangan` | `penanda_tangan` | Authorized Signatories | 4.3 |
| 11 | `DokumenSignature` | `dokumen_signature` | Signature Record | 4.3 |
| 12 | `VerifikasiDokumen` | `verifikasi_dokumen` | Public Verification | 4.3 |

### 1.3 Schema Assessment
**No migration required for Phase 4.5** - Existing schema supports:
- ✅ Template content as JSON (`content`, `kopConfig`, `signatureConfig`)
- ✅ Document snapshot (`dataSnapshot`, `contentSnapshot`)
- ✅ Atomic numbering via `NomorDokumen.lastSequence`
- ✅ Version immutability via `TemplateVersion.status`

---

## 2. BACKEND AUDIT

### 2.1 Existing Services
| Service | Location | Status | Phase |
|---------|----------|--------|-------|
| `LayananService` | `layanan.service.ts` | ✅ | 4.3 |
| `FieldDefinitionService` | `layanan.service.ts` | ✅ | 4.3 |
| `DokumenDefinitionService` | `dokumen.service.ts` | ✅ | 4.3 |
| `TemplateSuratService` | `dokumen.service.ts` | ✅ | 4.3 |
| `TemplateVersionService` | `dokumen.service.ts` | ✅ | 4.3 |
| `InstanDokumenService` | `dokumen.service.ts` | ✅ | 4.3 |
| `PenandaTanganService` | `dokumen.service.ts` | ✅ | 4.3 |
| `TemplateDesignerService` | `template-designer.service.ts` | ✅ | 4.4 |

### 2.2 Existing Utilities
| Utility | Location | Status | Phase |
|---------|----------|--------|-------|
| `binding-resolver.ts` | `utils/` | ✅ 70+ bindings | 4.4 |
| `formatter-registry.ts` | `utils/` | ✅ 14 formatters | 4.4 |
| `numbering.ts` | `utils/` | ✅ Atomic generation | 4.3 |

### 2.3 Existing Routes
```
/api/template-designer/registry            ✅
/api/template-designer/numbering-tokens    ✅
/api/template-designer/templates            ✅
/api/template-designer/templates/:id       ✅
/api/template-designer/templates/:id/duplicate ✅
/api/template-designer/templates/:id/versions ✅
/api/template-designer/versions/:id        ✅
/api/template-designer/versions/:id/validate ✅
/api/template-designer/versions/:id/preview ✅
/api/template-designer/versions/:id/publish ✅
/api/template-designer/versions/:id/archive ✅
```

### 2.4 Backend Gaps (Phase 4.5)
1. **PDF Generation Service** - No PDF renderer
2. **Condition Evaluator** - No conditional visibility
3. **Table/Repeater Resolver** - No array iteration support
4. **Document Generation Service** - Needs full pipeline
5. **QR Code Generation** - Not implemented
6. **E2E Test Infrastructure** - Missing

---

## 3. FRONTEND AUDIT

### 3.1 Existing Pages
| Page | Location | Status | Phase |
|------|----------|--------|-------|
| `TemplateListPage` | `admin/surat/` | ✅ | 4.4 |
| `TemplateDesignerPage` | `admin/surat/` | ⚠️ Basic | 4.4 |

### 3.2 Frontend Gaps (Phase 4.5)
1. **Enhanced Designer** - Drag-drop, precision controls
2. **Table Element Editor** - Column configuration
3. **Conditional Section Editor** - Condition builder UI
4. **Live Preview with Data** - Real-time preview
5. **PDF Preview** - Actual PDF rendering
6. **Kop Surat Editor** - Visual kop configuration
7. **Signature Block Editor** - Signature configuration

---

## 4. ELEMENT SYSTEM

### 4.1 Existing Element Types
```typescript
enum ElementType {
  'text',      // Static or bound text
  'field',     // Data binding
  'table',     // Table/repeater (schema only)
  'image',     // Image/logo
  'divider',   // Horizontal line
  'signature',  // Signature block
  'page_break', // Page break
  'spacer',    // Vertical space
}
```

### 4.2 Element Properties (Standardized)
```typescript
interface Element {
  id: string;
  type: ElementType;
  x?: number;           // X position (mm)
  y?: number;           // Y position (mm)
  width?: string;       // Width (mm or %)
  height?: string;      // Height (mm or auto)
  zIndex?: number;     // Layer order
  visible?: boolean;    // Conditional visibility
  style?: ElementStyle; // Common styling
  binding?: string;     // Data binding path
  formatter?: string;   // Output formatter
  content?: string;     // Text content
}
```

---

## 5. BINDING ENGINE (Phase 4.4)

### 5.1 Allowed Bindings (~70+)
```typescript
// Penduduk
'penduduk.nik', 'penduduk.namaLengkap', 'penduduk.alamat', ...

// Keluarga
'keluarga.noKk', 'keluarga.alamat', ...

// Wilayah
'wilayah.dusun', 'wilayah.rt', 'wilayah.rw', ...

// Desa
'desa.nama', 'desa.kode', 'desa.kepalaDesa', ...

// Pemerintahan
'kepala_desa.nama', 'kepala_desa.nip', ...

// Surat
'surat.nomor', 'surat.tanggal', ...

// System
'system.tanggal', 'system.tahun', 'system.bulanRomawi', ...
```

### 5.2 Missing Bindings for Phase 4.5
1. **Array bindings** - `keluarga.anggota[]` for repeater
2. **Nested paths** - `penduduk.keluarga.noKk`

---

## 6. FORMATTER ENGINE (Phase 4.4)

### 6.1 Available Formatters (14)
| Formatter | Description |
|-----------|-------------|
| `date` | dd-MM-yyyy |
| `tanggal_indonesia` | 17 Agustus 2026 |
| `currency` | Rp1.500.000 |
| `uppercase` | HURUF BESAR |
| `lowercase` | huruf kecil |
| `capitalize` | Huruf Kapital |
| `number` | 1.500.000 |
| `nik` | 5203******4 |
| `bulan_indonesia` | Agustus |
| `hari_indonesia` | Senin |
| `bulan_romawi` | VIII |
| `usia` | 40 tahun |
| `jenis_kelamin` | Laki-laki |
| `telepon` | +62 81234567890 |

---

## 7. NUMBERING ENGINE (Phase 4.3)

### 7.1 Token System
```
{seq}          - Sequence (default 5 digits)
{seq:3}        - Sequence with N digits
{tahun}        - Year (4 digits)
{bulan}        - Month (01-12)
{bulanRomawi}  - Month (I-XII)
{kode}         - Classification code
{kades}        - Village head abbreviation
{desa}         - Village abbreviation
```

### 7.2 Example Format
```
470/123/KADES.SRM/VIII/2026
```

---

## 8. PDF RENDERING REQUIREMENTS (Phase 4.5)

### 8.1 PDF Library Selection
**Recommendation:** `pdfkit` (Node.js native)
- ✅ Stable and mature
- ✅ No browser dependency
- ✅ Supports A4/F4
- ✅ Text, images, tables
- ✅ Page breaks, headers, footers

### 8.2 Document Model Requirements
```typescript
interface DocumentModel {
  metadata: {
    name: string;
    version: number;
    generatedAt: Date;
  };
  layout: {
    pageSize: 'A4' | 'FOLIO' | 'LETTER' | 'LEGAL';
    orientation: 'portrait' | 'landscape';
    margins: { top: mm; right: mm; bottom: mm; left: mm };
  };
  kop: KopConfig;
  elements: Element[];
  signature: SignatureConfig;
  footer?: {
    text: string;
    pageNumber: boolean;
  };
}
```

---

## 9. TABLE/REPEATER ENGINE (Phase 4.5)

### 9.1 Data Source Binding
```typescript
// Array binding format
'keluarga.anggota'

// Example template
{{#each keluarga.anggota}}
  {{nama}} | {{nik}} | {{hubungan}}
{{/each}}
```

### 9.2 Table Element Configuration
```typescript
interface TableElement {
  type: 'table';
  dataSource: string;      // e.g., 'keluarga.anggota'
  columns: Column[];
  headerStyle: TextStyle;
  rowStyle: TextStyle;
  repeatHeader: boolean;
  pageBreak: 'none' | 'row' | 'section';
}
```

---

## 10. CONDITIONAL VISIBILITY (Phase 4.5)

### 10.1 Expression Syntax
```typescript
// Operators (whitelist)
==, !=, >, <, >=, <=
AND, OR, NOT
EXISTS, NOT_EXISTS

// Examples
jenis_kelamin == "L"
status_perkawinan == "KAWIN"
jabatan EXISTS
```

### 10.2 Implementation Approach
- **No eval()** - Safe expression parser
- **AST-based** - Parse to tree, evaluate safely
- **Whitelist operators** - Only allow listed operators

---

## 11. SECURITY REQUIREMENTS

### 11.1 Existing Protections
- ✅ Binding whitelist (70+ paths)
- ✅ No eval() in binding resolver
- ✅ No eval() in formatters
- ✅ Tenant isolation via desaId
- ✅ Permission guards
- ✅ No arbitrary code execution

### 11.2 Additional Security (Phase 4.5)
- [ ] SSRF protection (no internal IPs)
- [ ] Path traversal prevention
- [ ] XSS prevention in content
- [ ] SQL injection via bindings (already safe)
- [ ] Authorization tests

---

## 12. STORAGE REQUIREMENTS

### 12.1 Existing Providers
| Provider | Location | Status |
|----------|----------|--------|
| `LocalStorageProvider` | `services/storage/` | ✅ |
| `S3StorageProvider` | `services/storage/` | ✅ |

### 12.2 Required Operations
```typescript
interface StorageProvider {
  upload(key: string, data: Buffer, mimeType: string): Promise<string>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
  getMetadata(key: string): Promise<FileMetadata>;
  getSignedUrl(key: string, expires: number): Promise<string>;
}
```

---

## 13. TEST REQUIREMENTS

### 13.1 Existing Tests (51 total)
| Test File | Tests | Coverage |
|-----------|-------|----------|
| `binding-resolver.test.ts` | 26 | Whitelist, validation, resolution |
| `numbering.test.ts` | 25 | Token parsing, generation |

### 13.2 Required Tests (Phase 4.5)
| Category | Count | Priority |
|----------|-------|----------|
| Unit - Table/Repeater | 15 | HIGH |
| Unit - Condition Evaluator | 20 | HIGH |
| Unit - PDF Layout | 10 | MED |
| Integration - Document Pipeline | 10 | HIGH |
| Integration - PDF Generation | 5 | MED |
| Security - XSS/Injection | 15 | HIGH |
| E2E - Template Workflow | 10 | MED |
| E2E - Document Generation | 10 | MED |

---

## 14. IMPLEMENTATION PRIORITY

### Priority 1: Core Engine
1. [ ] **Condition Evaluator** - Safe expression parsing
2. [ ] **Table/Repeater Resolver** - Array iteration
3. [ ] **PDF Renderer Service** - pdfkit integration
4. [ ] **Document Generation Pipeline** - End-to-end

### Priority 2: Integration
5. [ ] **Signature Integration** - QR + signature block
6. [ ] **Numbering Integration** - Auto-generate on create
7. [ ] **Storage Integration** - PDF persistence
8. [ ] **Preview Enhancement** - Live preview

### Priority 3: Testing
9. [ ] Unit Tests - Condition, Table, Layout
10. [ ] Integration Tests - Full pipeline
11. [ ] Security Tests - XSS, injection
12. [ ] E2E Tests - Playwright workflows

### Priority 4: Polish
13. [ ] Enhanced Designer UI
14. [ ] Documentation
15. [ ] Build verification

---

## 15. DEPENDENCIES TO ADD

### Backend (API)
```json
{
  "pdfkit": "^0.15.0",
  "qrcode": "^1.5.3"
}
```

### Frontend (Web)
```json
{
  "@react-pdf/renderer": "^3.4.0"
}
```

---

## 16. FILES TO CREATE

### Backend
```
apps/api/src/
├── services/
│   ├── pdf-renderer.service.ts      # PDF generation
│   ├── document-engine.service.ts   # Document pipeline
│   └── condition-evaluator.ts      # Safe expression evaluator
├── utils/
│   ├── table-resolver.ts            # Array iteration
│   └── layout-engine.ts             # Position/size calculation
└── routes/
    └── service/
        ├── document.ts              # Document generation API
        └── public.ts                # Public verification
```

### Frontend
```
apps/web/src/
├── pages/admin/surat/
│   ├── DocumentListPage.tsx
│   └── DocumentDetailPage.tsx
├── components/
│   ├── designer/
│   │   ├── TableEditor.tsx
│   │   ├── ConditionEditor.tsx
│   │   └── EnhancedPreview.tsx
│   └── pdf/
│       └── PdfPreview.tsx
└── hooks/
    └── useDocumentGenerator.ts
```

---

## 17. NO DATABASE CHANGES REQUIRED

Phase 4.5 does NOT require any database migration. All features use existing models:
- `TemplateVersion.content` (JSON) - Already supports all element types
- `InstanDokumen.contentSnapshot` (JSON) - Already stores resolved content
- `InstanDokumen.fileUrl` (String) - Already stores PDF URL
- `DokumenSignature` (Model) - Already stores signature info
- `VerifikasiDokumen` (Model) - Already stores verification token

---

## 18. BACKWARD COMPATIBILITY

All Phase 4.4 templates remain compatible:
- ✅ Existing `content` JSON structure
- ✅ Existing element types (text, field, etc.)
- ✅ Existing binding format `{{binding}}`
- ✅ Existing formatter format `{{binding | formatter}}`

---

## 19. VERIFICATION CHECKLIST

Before Phase 4.5 implementation:
- [x] Phase 4.4 baseline audit complete
- [x] Existing architecture documented
- [x] Gaps identified
- [x] Dependencies listed
- [x] Files to create mapped
- [x] No database changes required
- [x] Backward compatibility verified

---

## 20. NEXT STEPS

1. **Create PHASE_4_5_ARCHITECTURE.md** - Detailed design
2. **Implement Condition Evaluator** - Safe expression parser
3. **Implement Table Resolver** - Array iteration support
4. **Implement PDF Renderer** - pdfkit integration
5. **Create Document Pipeline** - End-to-end generation
6. **Add Unit Tests** - Condition, table, layout
7. **Add Integration Tests** - Full pipeline
8. **Add Security Tests** - XSS, injection
9. **Create E2E Tests** - Playwright workflows
10. **Verify Build** - TypeScript + tests pass
11. **Create PHASE_4_5_FINAL_REPORT.md**
