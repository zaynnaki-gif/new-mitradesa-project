# MITRADESA - System Architecture Document

**Version:** 1.0
**Date:** August 19, 2026
**Status:** Complete

---

## 1. Database Schema (Prisma ERD)

### 1.1 Core Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CORE DOMAIN MODELS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Provinsi (1) ──────────< Kabupaten (N)                                    │
│      │                        │                                             │
│      │                        └──< Kecamatan (N)                            │
│      │                                   │                                 │
│      │                                   └──< Desa (N)                     │
│      │                                              │                      │
│      │                    ┌───────────────────────┼───────────────────────┐ │
│      │                    │                       │                       │ │
│      │              IdentitasDesa           Keluarga                Penduduk │
│      │                    │                       │                       │ │
│      │                    │                       └──< AnggotaKeluarga    │ │
│      │                    │                                           │ │
│      │              PerangkatDesa ────────────────────────────────────┘ │
│      │                    │                                             │
│      │              Account ◄──────────────────────────────────────────┘ │
│      │                    │                                             │
│      │                    └──< AccountRole ───> Role ───> Permission    │
│      │                                                                  │
│      └───────────────────┬────────────────────────────────────────────┘ │
│                          │                                            │
│              ┌───────────┼───────────────────────────────────────────┐     │
│              │           │                                           │     │
│          Kategori       │                                       Agenda │
│              │           │                                           │     │
│              └──< Berita                                            │     │
│                    │                                               │     │
│              Halaman                                             │     │
│                    │                                               │     │
│              Media ◄─────────────────────────────────────────────┘     │
│                    │                                                 │
│              Umkm ─┬─< PotensiDesa                                │
│                    │                                                │
│              Apbdes ─┴─> ApbdesItem                                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Service Document Engine Entity Relationship

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SERVICE DOCUMENT ENGINE MODELS                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Desa ─< Layanan                                                        │
│              │                                                            │
│              ├──< FieldDefinition                                         │
│              │         (reusable fields for services & templates)           │
│              │                                                            │
│              ├──< NomorsuratConfig                                        │
│              │                                                            │
│              └──< DokumenDefinition                                       │
│                        │                                                 │
│                        ├──< TemplateSurat                                  │
│                        │         │                                         │
│                        │         ├──< TemplateVersion                       │
│                        │         │         │                               │
│                        │         │         ├── kopConfig                    │
│                        │         │         ├── signatureConfig              │
│                        │         │         └── content (JSON)               │
│                        │         │                                         │
│                        │         └──< FieldDefinition                      │
│                        │                                                    │
│                        └──< InstanDokumen                                  │
│                                  │                                        │
│                                  ├── TemplateVersion (snapshot)              │
│                                  ├── PermintaanLayanan                     │
│                                  │                                        │
│                                  │    ├── Penduduk (citizen)               │
│                                  │    └── dataJson (dynamic fields)         │
│                                  │                                        │
│                                  ├── DokumenSignature ◄── PenandaTangan   │
│                                  │                                        │
│                                  └── VerifikasiDokumen                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. API Routes Architecture

### 2.1 Route Hierarchy

```
/api
├── health                          # Health checks
│   ├── GET /                       # Basic health
│   └── GET /database              # Database connectivity
│
├── auth                            # Authentication
│   ├── POST /login
│   ├── POST /logout
│   ├── POST /refresh
│   └── GET /me
│
├── identitas                       # Village Identity
│   └── GET /                       # Get village data
│
├── perangkat-desa                  # Village Officials
│   ├── GET /public                # Public list
│   ├── GET /public?aktif=true     # Active only
│   └── GET /:id                   # Detail
│
├── public                          # Public endpoints (no auth)
│   ├── /berita                    # News
│   │   ├── GET /?limit&page&kategori&search
│   │   └── GET /:slug
│   │
│   ├── /layanan                   # Services
│   │   ├── GET /?limit&page&kategori
│   │   └── GET /:slug
│   │
│   ├── /agenda                   # Agenda
│   │   ├── GET /?limit&tahun
│   │   └── GET /:slug
│   │
│   ├── /umkm                     # UMKM
│   │   ├── GET /?limit&kategori&search
│   │   └── GET /:slug
│   │
│   ├── /galeri                   # Media Gallery
│   │   └── GET /?limit&type
│   │
│   ├── /statistik                # Village Statistics
│   │   └── GET /
│   │
│   ├── /transparansi
│   │   └── /apbdes               # APBDes
│   │       └── GET /
│   │
│   ├── /halaman                  # Static Pages
│   │   ├── GET /?slug
│   │   └── GET /:slug
│   │
│   └── /potensi                 # Village Potential
│       ├── GET /?kategori&limit
│       └── GET /:slug
│
├── citizen                        # Citizen endpoints
│   └── /request                 # Service requests
│       ├── GET /tracking/:nomor
│       ├── POST /
│       └── GET /:id
│
├── cms                            # CMS Admin endpoints
│   ├── /berita                   # News management
│   ├── /agenda                   # Agenda management
│   ├── /umkm                    # UMKM management
│   ├── /transparansi             # Transparency management
│   ├── /potensi                 # Potential management
│   ├── /kategori                # Category management
│   ├── /halaman                 # Page management
│   └── /media                   # Media management
│
├── penduduk                       # Population (protected)
├── keluarga                       # Family (protected)
├── reference                      # Reference data
├── audit-log                     # Audit trail
├── dashboard                      # Dashboard data
├── arsip-surat                   # Incoming mail archive
└── (service routes)              # Document service engine
```

---

## 3. Frontend Integration Matrix

### 3.1 Hook → API Mapping

| Hook | API Endpoint | Data Type | Page Usage |
|------|-------------|-----------|------------|
| `useIdentitasDesa` | `GET /api/identitas` | `IdentitasDesa` | All pages |
| `useBeritaList` | `GET /api/public/berita` | `Berita[]` | BeritaListPage |
| `useBeritaDetail` | `GET /api/public/berita/:slug` | `Berita` | BeritaDetailPage |
| `useKategori` | `GET /api/kategori/active` | `Kategori[]` | BeritaListPage |
| `useLayananList` | `GET /api/public/layanan` | `Layanan[]` | LayananPage |
| `useLayananDetail` | `GET /api/public/layanan/:slug` | `Layanan` | LayananDetailPage |
| `useAgendaList` | `GET /api/public/agenda` | `Agenda[]` | AgendaPage |
| `useUmkmList` | `GET /api/public/umkm` | `Umkm[]` | UmkmPage |
| `useUmkmDetail` | `GET /api/public/umkm/:slug` | `Umkm` | UmkmDetailPage |
| `useMediaList` | `GET /api/public/galeri` | `Media[]` | GaleriPage |
| `useStatistikDesa` | `GET /api/public/statistik` | `StatistikDesa` | Homepage |
| `useApbdes` | `GET /api/public/transparansi/apbdes` | `Apbdes` | TransparansiPage |
| `usePerangkatDesa` | `GET /api/perangkat-desa/public?aktif=true` | `PerangkatDesa[]` | PemerintahanPage |
| `useHalaman` | `GET /api/public/halaman?slug=X` | `Halaman` | ProfilPage |
| `usePotensiList` | `GET /api/public/potensi` | `PotensiDesa[]` | PotensiPage |

### 3.2 Type Schema Mapping

```typescript
// Database (Prisma) → API (JSON) → Frontend (TypeScript)

// Example: Berita
// Prisma Model: Berita { id, judul, slug, excerpt, konten, gambarUrl, status, penulisId, kategoriId, publishedAt, ... }
// API Response: { success, data: Berita, message }
// Frontend Type: useBerita.ts defines { id, judul, slug, excerpt, ... }

// All data flows through the same schema
// Frontend types mirror backend Prisma models
```

---

## 4. Business Logic Implementation

### 4.1 Authentication Flow

```
┌──────────┐    POST /api/auth/login     ┌──────────┐
│  Client  │ ─────────────────────────> │   API    │
│          │                            │          │
│          │ <───────────────────────── │  (Express)│
│          │    { token, user }         │          │
└──────────┘                            └────┬─────┘
                                            │
                                            ▼
                                     ┌────────────┐
                                     │   Prisma   │
                                     │  (verify) │
                                     └────┬─────┘
                                            │
                                     ┌──────┴──────┐
                                     │  PostgreSQL │
                                     └─────────────┘
```

### 4.2 Service Request Flow

```
1. Citizen opens /layanan
   → useLayananList() fetches services

2. Citizen selects service
   → useLayananDetail(slug) fetches service + fields

3. Citizen submits request
   → POST /api/citizen/request
   → Creates PermintaanLayanan record
   → Returns nomorPermintaan

4. Citizen tracks request
   → GET /api/citizen/request/tracking/:nomor
   → Returns request status + timeline

5. Admin processes in dashboard
   → Protected routes check session
   → Updates PermintaanLayanan status
```

### 4.3 Document Generation Flow

```
1. Request APPROVED
   ↓
2. Generate document:
   - Get TemplateVersion content
   - Merge with PermintaanLayanan dataJson
   - Apply kopConfig, signatureConfig
   ↓
3. Create InstanDokumen record
   - Snapshot all data
   - Generate verificationToken
   ↓
4. PDF generation (PDFKit)
   ↓
5. Store & return fileUrl
   ↓
6. Citizen can verify at /verifikasi/:token
```

---

## 5. Data Flow Diagrams

### 5.1 Public Homepage Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    HOMEPAGE DATA FLOW                         │
└──────────────────────────────────────────────────────────┬──┘
                                                           │
                                                           ▼
┌──────────────────────────────────────────────────────────────┐
│  useIdentitasDesa()      →  /api/identitas              Village name, logo │
│  useStatistikDesa()     →  /api/public/statistik       Population data  │
│  useBeritaList()        →  /api/public/berita          Latest 4 news  │
│  useLayananList()       →  /api/public/layanan         Service list     │
│  useMediaList()         →  /api/public/galeri          Gallery images  │
│  usePerangkatDesa()     →  /api/perangkat-desa/public Officials       │
│  useUmkmList()         →  /api/public/umkm            UMKM products   │
│  useAgendaList()        →  /api/public/agenda          Events          │
│  useApbdes()           →  /api/public/transparansi/apbdes  Budget data │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  All data from  │
                    │  Supabase PG    │
                    │  PostgreSQL     │
                    └─────────────────┘
```

### 5.2 Berita Page Data Flow

```
┌────────────────────────────────────────────┐
│          BERITA LIST PAGE                    │
└────────────────┬─────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
useKategori()  useBeritaList()  useIdentitasDesa()
    │               │               │
    │               │               │
    ▼               ▼               ▼
/api/kategori  /api/public/berita  /api/identitas
(active only)  ?limit=10        village name
              &page=1
              &kategori=X
              &search=Y
```

---

## 6. Security Architecture

### 6.1 Authentication & Authorization

```
┌──────────────────────────────────────────────────────────┐
│                    AUTHENTICATION                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Internal (Admin)              Citizen (Public)            │
│  ────────────────────          ──────────────────          │
│  Account + AccountRole        Citizen + Penduduk           │
│       │                            │                      │
│       │                            │                      │
│       ▼                            ▼                      │
│  Session-based auth            OTP-based auth              │
│  (InternalSession)            (CitizenSession)           │
│       │                            │                      │
│       │                            │                      │
│       ▼                            ▼                      │
│  JWT token in header         Token in header             │
│  Authorization: Bearer        Authorization: Bearer       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────────────────┐
│                   PERMISSIONS                        │
├─────────────────────────────────────────────────┤
│ ADMIN      → Full CRUD on all resources             │
│ KADER      → Read/Update penduduk, keluarga         │
│ KASIE      → Read/Update assigned resources        │
│ KEPALA     → Read-only access + approve documents  │
│ CITIZEN    → Submit requests, track own requests   │
└─────────────────────────────────────────────────┘
```

### 6.3 CORS Configuration

```typescript
// Allowed origins (from env)
ALLOWED_ORIGINS=https://serunimumbul.com,https://www.serunimumbul.com

// CORS middleware
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true
}));
```

---

## 7. File Storage Architecture

### 7.1 Storage Backend

```typescript
// Current: Local storage
STORAGE_BACKEND=local
UPLOAD_DIR=./uploads

// Future: S3-compatible
// STORAGE_BACKEND=s3
// S3_BUCKET=mitradesa-uploads
// S3_REGION=ap-southeast-1
```

### 7.2 Upload Flow

```
Client uploads file
       │
       ▼
Multipart form-data to /api/media/upload
       │
       ▼
API validates file type & size
       │
       ▼
Store file (local/S3)
       │
       ▼
Save Media record to database
       │
       ▼
Return { fileUrl, fileId }
```

---

## 8. Database Indexes

### 8.1 Query Optimization Indexes

```prisma
// Critical indexes for performance

model Berita {
  @@index([status])
  @@index([publishedAt])
  @@index([kategoriId])
}

model Penduduk {
  @@index([nik])
  @@index([desaId])
  @@index([namaLengkap])
}

model PermintaanLayanan {
  @@index([desaId])
  @@index([status])
  @@index([nomorPermintaan])
}

model Agenda {
  @@index([tanggalMulai])
  @@index([status])
}
```

---

## 9. Environment Variables

### 9.1 API Environment

```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=<64-char-random>
JWT_EXPIRES_IN=24h

# Origins
ALLOWED_ORIGINS=https://serunimumbul.com,https://www.serunimumbul.com

# Identity
DESA_ID=1
DESA_KODE=5101012001
DESA_NAMA=Desa Seruni Mumbul
```

### 9.2 Frontend Environment

```bash
# API Configuration
VITE_API_URL=https://api.serunimumbul.com
VITE_WEB_URL=https://serunimumbul.com
```

---

## 10. Deployment Architecture

### 10.1 Infrastructure

```
┌─────────────────────────────────────────────────────────┐
│                    HOSTINGER DEPLOYMENT                │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Frontend (Static)         API Backend (Node.js)        │
│  ─────────────────        ───────────────────         │
│  serunimumbul.com         api.serunimumbul.com        │
│  (public_html/)           (Node.js app)               │
│       │                          │                     │
│       │                          │                     │
│       ▼                          ▼                     │
│  Browser              Supabase PostgreSQL               │
│  fetches API              (AWS ap-southeast-1)        │
│  from api.serunimumbul                              │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### 10.2 Build Pipeline

```bash
# Frontend (Vite)
npm run build:prod
# Uses .env.production
# Embeds VITE_API_URL in JS bundle
# Output: dist/

# API (TypeScript)
npm run build
# Compiles to dist/
# Copies .env.production to server
# Runs: node dist/index.js
```

---

## 11. Monitoring & Logging

### 11.1 Log Levels

```typescript
// Environment-based log levels
LOG_LEVEL=warn     // Production
LOG_LEVEL=info     // Development

// Log middleware captures:
requestId, method, url, statusCode, duration
```

### 11.2 Audit Trail

```typescript
// All write operations logged to AuditLog
AuditLog {
  entityType, entityId, action,
  actorId, actorIp, beforeData, afterData
}
```

---

## 12. Glossary

| Term | Definition |
|------|------------|
| RBAC | Role-Based Access Control |
| CMS | Content Management System |
| UMKM | Usaha Mikro Kecil Menengah (Small Business) |
| APBDes | Anggaran Pendapatan dan Belanja Desa |
| KK | Kartu Keluarga (Family Card) |
| NIK | Nomor Induk Kependudukan |
| PODES | Potensi Desa (Village Potential) |

---

*Document Version: 1.0 - Complete System Architecture Reference*
