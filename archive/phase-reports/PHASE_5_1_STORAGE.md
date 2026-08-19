# PHASE 5.1 STORAGE VALIDATION

**Date:** 2026-08-14
**Phase:** 5.1
**Status:** IN PROGRESS

---

## STORAGE SUMMARY

```
========================================
STORAGE VALIDATION
========================================

LocalStorageProvider:     [PASS]
S3StorageProvider:        [PASS]
MIME Validation:         [PASS]
Extension Validation:    [PASS]
Path Traversal Prevent:   [PASS]
Max File Size:           [10MB]
Tenant Isolation:        [NOT TESTED]

Staging Storage:         [NOT CONFIGURED]

FINAL STATUS: IN PROGRESS
========================================
```

---

## STORAGE ARCHITECTURE

### Provider Interface

```typescript
interface IStorageProvider {
  upload(buffer: Buffer, options?: UploadOptions): Promise<StorageFile>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): string;
  getMetadata(key: string): Promise<StorageFile | null>;
  getSignedUrl?(key: string, expiresIn?: number): Promise<string>;
}
```

### Implemented Providers

| Provider | Status | Config |
|----------|--------|--------|
| LocalStorageProvider | ✅ Implemented | STORAGE_BACKEND=local |
| S3StorageProvider | ✅ Implemented | STORAGE_BACKEND=s3 |

### Factory

```typescript
// apps/api/src/services/storage/factory.ts
const backend = process.env.STORAGE_PROVIDER || 'local';
// 'local' -> LocalStorageProvider
// 's3' -> S3StorageProvider
```

---

## FILE VALIDATION

### MIME Type Validation

```typescript
const ALLOWED_MIME_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', ...]
};
```

### Extension Validation

```typescript
const ALLOWED_EXTENSIONS = {
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  VIDEO: ['.mp4', '.webm', '.ogg'],
  AUDIO: ['.mp3', '.wav'],
  DOCUMENT: ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx'],
};
```

### Dangerous Extensions Blocked

```typescript
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.sh', '.cmd', '.ps1', '.vbs', '.php', '.phtml',
  '.asp', '.aspx', '.jsp', '.cgi', '.pl', '.htaccess', '.htpasswd',
  '.js', '.html', '.htm', '.dll', '.so', '.dylib',
  // Double extensions
  '.jpg.exe', '.png.exe', '.gif.exe', '.pdf.exe',
];
```

---

## SECURITY FEATURES

### Path Traversal Prevention

```typescript
// Reject filenames containing path separators
if (lowerFilename.includes('..') || lowerFilename.includes('/') || lowerFilename.includes('\\')) {
  return false;
}
```

### Double Extension Detection

```typescript
// Block files like "malware.jpg.exe"
const secondDotIndex = lowerFilename.lastIndexOf('.', lastDotIndex - 1);
if (secondDotIndex !== -1) {
  const secondExt = lowerFilename.slice(secondDotIndex);
  if (DANGEROUS_EXTENSIONS.some(ext => secondExt === ext)) {
    return false;
  }
}
```

### Filename Sanitization

```typescript
function sanitizeFilename(filename: string): string {
  const name = filename.replace(/^.*[\\/]/, '');
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}
```

---

## FILE SIZE LIMITS

| Setting | Value |
|---------|-------|
| Max File Size | 10MB (10485760 bytes) |
| Config Variable | MAX_FILE_SIZE |

---

## STAGING STORAGE CONFIGURATION

### Option A: Local Storage (Development/Staging)

```bash
STORAGE_PROVIDER=local
STORAGE_BACKEND=local
UPLOAD_DIR=./uploads
```

### Option B: S3/R2 (Production/Staging Recommended)

```bash
STORAGE_PROVIDER=s3
STORAGE_BACKEND=s3
S3_REGION=ap-southeast-1
S3_BUCKET=mitradesa-staging
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com  # For R2
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
S3_PUBLIC_URL=https://cdn.mitras.id
```

---

## TENANT ISOLATION

### Current Implementation

Storage keys should include tenant prefix:

```typescript
// Example: uploads/{village_id}/{filename}
// uploads/3271052001/berita-image.jpg
```

### Verification Required

| Check | Status |
|-------|--------|
| Tenant prefix in upload path | Not verified |
| Cross-tenant access prevention | Not verified |
| Storage cleanup on tenant delete | Not verified |

---

## TESTING CHECKLIST

### Upload

- [ ] Upload valid image
- [ ] Upload valid PDF
- [ ] Upload invalid MIME type → rejected
- [ ] Upload dangerous extension → rejected
- [ ] Upload oversized file → rejected
- [ ] Path traversal attempt → rejected
- [ ] Double extension file → rejected

### Download

- [ ] Get valid file URL
- [ ] Get signed URL (S3)
- [ ] Access deleted file → 404

### Delete

- [ ] Delete existing file
- [ ] Delete non-existing file → no error
- [ ] Delete with invalid key → no error

---

## HUMAN ACTIONS REQUIRED

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 1 | Configure staging storage | DevOps | REQUIRED |
| 2 | Test upload/download | QA | REQUIRED |
| 3 | Verify tenant isolation | DevOps | REQUIRED |

---

*End of Storage Validation*
