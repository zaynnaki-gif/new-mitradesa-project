# PHASE 4.3 GAP ANALYSIS

## Project: MITRADESA - Service Document Template Engine Foundation
## Date: 2026-08-13

---

## 1. Executive Summary

This report identifies the gap between **current state** and **target state** for Phase 4.3, which establishes the foundation for a database-driven Service Request and Document Template Engine.

---

## 2. Current State Analysis

### What EXISTS in MITRADESA

#### 2.1 Core Infrastructure ✓
| Component | Status | Notes |
|-----------|--------|-------|
| Express.js API | ✓ EXISTS | TypeScript, well-structured |
| Prisma ORM | ✓ EXISTS | Schema-based, migrations ready |
| React Web | ✓ EXISTS | Vite, component-based |
| Authentication | ✓ EXISTS | Session-based, OTP support |
| Authorization | ✓ EXISTS | Permission-based roles |
| Multi-tenancy | ✓ EXISTS | Via `desaId` on models |
| Audit Logging | ✓ EXISTS | Comprehensive action tracking |
| Storage | ✓ EXISTS | Local/S3/R2/MinIO abstraction |

#### 2.2 Existing Domain Models ✓
| Domain | Models | Status |
|--------|--------|--------|
| Wilayah | Provinsi, Kabupaten, Kecamatan, Desa | ✓ Complete |
| Penduduk | Penduduk, Keluarga, AnggotaKeluarga | ✓ Complete |
| Pemerintahan | PerangkatDesa | ✓ Complete |
| CMS | Kategori, Berita, Halaman, Media | ✓ Complete |
| Auth | Account, Role, Permission, Session | ✓ Complete |
| Reference | 9 reference tables | ✓ Complete |

#### 2.3 API Patterns ✓
| Pattern | Status | Notes |
|---------|--------|-------|
| Route organization | ✓ EXISTS | `routes/cms/`, `routes/auth/` |
| Service layer | ✓ EXISTS | Business logic in services |
| DTO validation | ✓ EXISTS | Zod schemas |
| Response helpers | ✓ EXISTS | `response.success()`, `response.created()` |
| Error handling | ✓ EXISTS | `ApiError` class |
| Async handlers | ✓ EXISTS | `asyncHandler()` wrapper |

#### 2.4 Test Infrastructure ✓
| Component | Status | Notes |
|-----------|--------|-------|
| Jest setup | ✓ EXISTS | `jest.config.js` |
| Test safety | ✓ EXISTS | `database-safety.ts` guard |
| Test fixtures | ✓ EXISTS | Auth fixtures |
| Supertest | ✓ EXISTS | HTTP testing |
| E2E | ✓ EXISTS | Playwright setup |

---

## 3. Target State Analysis

### What NEEDS to be Built for Phase 4.3

#### 3.1 Service Domain (NEW)
| Component | Purpose | Priority |
|-----------|---------|----------|
| `Layanan` model | Service definitions | CRITICAL |
| `FieldDefinition` model | Reusable field registry | CRITICAL |
| Service CRUD API | Manage services | CRITICAL |
| Field CRUD API | Manage fields | HIGH |

#### 3.2 Request Domain (NEW)
| Component | Purpose | Priority |
|-----------|---------|----------|
| `PermintaanLayanan` model | Service requests | CRITICAL |
| Dynamic data storage | JSON field data | CRITICAL |
| Request CRUD API | Manage requests | CRITICAL |
| Status workflow | Request lifecycle | HIGH |

#### 3.3 Document Domain (NEW)
| Component | Purpose | Priority |
|-----------|---------|----------|
| `DokumenDefinition` model | Document types | CRITICAL |
| `TemplateSurat` model | Template master | CRITICAL |
| `TemplateVersion` model | Versioned templates | CRITICAL |
| Document CRUD API | Manage documents | HIGH |

#### 3.4 Template Engine (NEW)
| Component | Purpose | Priority |
|-----------|---------|----------|
| Template content structure | Layout model | CRITICAL |
| Template versioning | Immutable versions | CRITICAL |
| Kop Surat config | Letterhead abstraction | HIGH |
| Signature config | Signature placement | HIGH |

#### 3.5 Binding System (NEW)
| Component | Purpose | Priority |
|-----------|---------|----------|
| Binding resolver | Safe expression evaluation | CRITICAL |
| Data sources | Pre-registered fields | HIGH |
| Validation | Binding syntax check | HIGH |

#### 3.6 Numbering System (NEW)
| Component | Purpose | Priority |
|-----------|---------|----------|
| `NomorDokumen` model | Sequence counter | CRITICAL |
| `NomorSuratConfig` model | Format config | CRITICAL |
| Numbering service | Race-safe generation | CRITICAL |
| Format templates | Configurable patterns | HIGH |

#### 3.7 Document Instance (NEW)
| Component | Purpose | Priority |
|-----------|---------|----------|
| `InstanDokumen` model | Document snapshots | CRITICAL |
| Data binding | Connect request data to template | HIGH |
| Content snapshot | Immutable rendered content | HIGH |

#### 3.8 Signature/Verification (FOUNDATION ONLY)
| Component | Purpose | Priority |
|-----------|---------|----------|
| `PenandaTangan` model | Signatory management | MEDIUM |
| `DokumenSignature` model | Signature records | MEDIUM |
| `VerifikasiDokumen` model | Public verification | MEDIUM |

---

## 4. Gap Matrix

### API Endpoints Gap

| Category | Current Routes | Required Routes | Gap |
|----------|----------------|-----------------|-----|
| Services | 0 | 5 | **5** |
| Fields | 0 | 4 | **4** |
| Requests | 0 | 11 | **11** |
| Documents | 0 | 6 | **6** |
| Templates | 0 | 10 | **10** |
| Signatories | 0 | 4 | **4** |
| Public | 0 | 2 | **2** |
| **TOTAL** | **0** | **42** | **42** |

### Models Gap

| Category | Current Models | Required Models | Gap |
|----------|----------------|-----------------|-----|
| Service | 0 | 2 | **2** |
| Request | 0 | 1 | **1** |
| Document | 0 | 2 | **2** |
| Template | 0 | 2 | **2** |
| Numbering | 0 | 2 | **2** |
| Signature | 0 | 3 | **3** |
| Enums | 0 | 5 | **5** |
| **TOTAL** | **0** | **17** | **17** |

### Service Layer Gap

| Category | Current Services | Required Services | Gap |
|----------|------------------|-------------------|-----|
| CRUD | 0 | 6 | **6** |
| Business Logic | 0 | 4 | **4** |
| **TOTAL** | **0** | **10** | **10** |

### UI Gap (Admin)

| Category | Current Pages | Required Pages | Gap |
|----------|---------------|----------------|-----|
| Service Management | 0 | 1 | **1** |
| Request Management | 0 | 1 | **1** |
| Template Management | 0 | 1 | **1** |
| Signatory Management | 0 | 1 | **1** |
| **TOTAL** | **0** | **4** | **4** |

### Test Gap

| Category | Current Tests | Required Tests | Gap |
|----------|---------------|----------------|-----|
| Unit (Binding Resolver) | 0 | 1 | **1** |
| Unit (Numbering) | 0 | 1 | **1** |
| Unit (Template) | 0 | 1 | **1** |
| Integration (Service CRUD) | 0 | 1 | **1** |
| Integration (Request) | 0 | 1 | **1** |
| Integration (Template) | 0 | 1 | **1** |
| Security (IDOR) | 0 | 1 | **1** |
| Security (Authorization) | 0 | 1 | **1** |
| E2E (Service Flow) | 0 | 1 | **1** |
| **TOTAL** | **0** | **9** | **9** |

---

## 5. Detailed Gap Breakdown

### 5.1 Service Definition Gap

**Current State:**
- No concept of "Layanan" or administrative services
- No field registry
- All surat-related data would need to be hardcoded

**Target State:**
```
LAYANAN
├── Surat Keterangan Domisili
│   ├── Fields: nama, nik, alamat, rt, rw, dusun
│   └── Document: SURAT_KETERANGAN_DOMISILI
├── Surat Keterangan Usaha
│   ├── Fields: nama, nik, nama_usaha, alamat_usaha
│   └── Document: SURAT_KETERANGAN_USAHA
└── ... (configurable, not hardcoded)
```

**Gap:**
- [ ] `Layanan` model not exists
- [ ] `FieldDefinition` model not exists
- [ ] Service CRUD API not exists
- [ ] Field CRUD API not exists

### 5.2 Service Request Gap

**Current State:**
- No request tracking system
- No dynamic data storage
- No status workflow

**Target State:**
```
PERMINTAAN LAYANAN
├── Nomor: REQ-2026-000001
├── Service: Surat Keterangan Domisili
├── Pemohon: [Penduduk data]
├── Status: DRAFT → SUBMITTED → PROCESSING → APPROVED → COMPLETED
├── Data: { nama: "...", nik: "...", alamat: "..." }
└── Documents: [Generated documents]
```

**Gap:**
- [ ] `PermintaanLayanan` model not exists
- [ ] JSON data storage pattern not established
- [ ] Status workflow API not exists
- [ ] Request CRUD API not exists

### 5.3 Template Engine Gap

**Current State:**
- No template concept
- No versioning
- Document layout would be hardcoded

**Target State:**
```
TEMPLATE: Surat Keterangan Domisili
├── Version 1 (Draft)
│   └── Layout: Kop → Header → Body → Signature
├── Version 2 (Published) [ACTIVE]
│   └── Layout: Kop → Header → Body → Signature
└── Documents created with Version 2 retain their layout

DOCUMENT INSTANCE
├── Generated from: Template Version 2
├── Bound data: { penduduk.nama, penduduk.nik, ... }
└── Content snapshot: Immutable rendered output
```

**Gap:**
- [ ] `DokumenDefinition` model not exists
- [ ] `TemplateSurat` model not exists
- [ ] `TemplateVersion` model not exists
- [ ] Template content structure not defined
- [ ] Version selection logic not exists

### 5.4 Numbering Gap

**Current State:**
- No document numbering concept
- No sequence management

**Target State:**
```
LAYANAN: Surat Keterangan Domisili
├── Format: "474/{seq}/KADES.SM/{bulanRomawi}/{tahun}"
├── Current: 474/00001/KADES.SM/VIII/2026
└── Next: 474/00002/KADES.SM/VIII/2026

Generated Number is:
- Unique per service
- Safe against race conditions
- Configurable per village
```

**Gap:**
- [ ] `NomorDokumen` model not exists
- [ ] `NomorSuratConfig` model not exists
- [ ] Numbering service not exists
- [ ] Format template parser not exists

### 5.5 Binding System Gap

**Current State:**
- No concept of data binding
- No safe expression evaluation

**Target State:**
```
TEMPLATE CONTENT:
{
  "elements": [
    { "type": "text", "content": "Yang bertanda tangan di bawah ini:" },
    { "type": "binding", "path": "penduduk.nama" },
    { "type": "binding", "path": "penduduk.nik" }
  ]
}

RENDERED OUTPUT:
Yang bertanda tangan di bawah ini:
John Doe
NIK: 1234567890123456
```

**Gap:**
- [ ] Binding resolver not exists
- [ ] Data source registry not exists
- [ ] Safe binding validation not exists

### 5.6 Signature/Verification Gap (Foundation Only)

**Current State:**
- No signature concept
- No verification concept

**Target State (Phase 4.3 Foundation):**
```
DOKUMEN
├── Status: GENERATED → SIGNED → VERIFIED
├── Signature: PenandaTangan record exists
├── Verification: Token + public endpoint ready
└── QR: Generated but not rendered (Phase 4.4)
```

**Gap:**
- [ ] `PenandaTangan` model not exists
- [ ] `DokumenSignature` model not exists
- [ ] `VerifikasiDokumen` model not exists
- [ ] Public verification endpoint not exists

---

## 6. What NOT to Build in Phase 4.3

### 6.1 Deferred Features
| Feature | Reason for Deferral |
|---------|-------------------|
| Drag-and-drop template editor | UI complexity, needs design work |
| Visual canvas | Requires frontend framework decision |
| PDF renderer | Needs evaluation (Puppeteer/Playwright) |
| DOCX export | Different rendering engine needed |
| Cryptographic signatures | Security audit needed |
| Email/WhatsApp notifications | External service integration |
| Complex approval workflows | Business rules not defined |
| Template marketplace | Future feature |
| Document archival system | Phase 4.4+ work |

### 6.2 Why These Are Deferred
- **UI Editors:** Too complex for foundation work; design needs user research
- **PDF/DOCX:** Need external library evaluation; different from JSON templates
- **Cryptographic:** Security implications; regulatory requirements unclear
- **Notifications:** External dependencies; business rules not defined
- **Marketplace:** Future scaling concern

---

## 7. Implementation Priority

### Phase 4.3 Priority Stack

```
[P1] CRITICAL - Foundation
├── Domain Models (11 tables)
├── Service CRUD APIs
├── Basic Request CRUD
├── Document Definition + Template
├── Template Versioning
├── Binding Resolver (safe subset)
└── Document Numbering

[P2] HIGH - Core Functionality
├── Request Status Workflow
├── Document Instance Generation
├── Field CRUD
├── Signatory Management
└── Public Verification Endpoint

[P3] MEDIUM - Admin UI
├── Service Management Page
├── Template Management Page
├── Request List/Detail Page
└── Basic Forms

[P4] LOW - Testing
├── Unit Tests (resolver, numbering, validation)
├── Integration Tests
└── E2E Workflow Tests
```

---

## 8. Risk Analysis

### 8.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| JSON field performance | LOW | MEDIUM | Index on key fields, limit JSON size |
| Template versioning complexity | MEDIUM | MEDIUM | Clear version selection logic |
| Race conditions in numbering | LOW | HIGH | Database-level locking |
| Binding injection | LOW | HIGH | Whitelist approach, regex validation |

### 8.2 Architectural Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Over-engineering for initial use | MEDIUM | LOW | Start simple, extend as needed |
| JSON schema drift | MEDIUM | MEDIUM | Schema validation on save |
| Missing fields in context | MEDIUM | MEDIUM | Comprehensive data source registry |

### 8.3 Schedule Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep (UI editors) | HIGH | HIGH | Strict scope boundary enforcement |
| Test infrastructure issues | MEDIUM | MEDIUM | Test safety guard, isolated DB |
| Migration conflicts | LOW | MEDIUM | Review migration SQL before apply |

---

## 9. Recommendations

### 9.1 Immediate Actions
1. Create Prisma migration for new models
2. Implement core domain services
3. Build API routes following existing patterns
4. Create binding resolver with safe subset
5. Implement numbering service with race protection
6. Add admin UI pages (simple, not editor)

### 9.2 Quality Gates
1. All existing tests must pass
2. TypeScript compilation must succeed
3. Prisma schema must validate
4. Migration must be reversible
5. No breaking changes to existing APIs

### 9.3 Success Criteria
1. Service CRUD works with proper authorization
2. Request CRUD works with dynamic JSON data
3. Template versioning creates immutable snapshots
4. Binding resolver safely evaluates whitelist expressions
5. Document numbering is race-condition free
6. Tenant isolation is enforced on all operations
