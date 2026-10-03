# Environment Variables Documentation

Variabel lingkungan yang perlu dikonfigurasi untuk menjalankan fitur-fitur baru.

---

## Redis Caching

```env
# URL koneksi Redis (jika tidak diset, caching dinonaktifkan secara otomatis)
REDIS_URL=redis://localhost:6379
```

- Jika `REDIS_URL` tidak diset, cache middleware akan dilewati secara otomatis (graceful degradation).
- Public endpoint `/api/public/berita` di-cache selama **5 menit**.

---

## S3 / Object Storage

```env
# Provider: 'local' (default) | 's3' | 'supabase'
STORAGE_PROVIDER=s3

# AWS S3
S3_REGION=us-east-1
S3_BUCKET=nama-bucket-anda
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Opsional: untuk S3-compatible (Cloudflare R2, MinIO, dll.)
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
S3_PUBLIC_URL=https://cdn.example.com

# Opsional: durasi signed URL (detik, default 3600)
S3_SIGNED_URL_EXPIRES=3600
```

---

## Sentry Error Tracking

### API (Backend)
```env
SENTRY_DSN=https://xxx@ooo.ingest.sentry.io/0000
```

### Web (Frontend) — di `.env` apps/web
```env
VITE_SENTRY_DSN=https://xxx@ooo.ingest.sentry.io/0000
```

- Sentry hanya aktif bila `NODE_ENV=production` (API) atau `MODE=production` (Web).
- Jika `SENTRY_DSN` / `VITE_SENTRY_DSN` tidak diset, Sentry dinonaktifkan secara otomatis.

---

## GitHub Actions Secrets

Tambahkan secrets berikut di **Settings → Secrets and variables → Actions** pada repositori GitHub:

| Secret Name | Keterangan |
|---|---|
| `SENTRY_DSN` | DSN dari dashboard Sentry untuk backend |
| `VITE_SENTRY_DSN` | DSN dari dashboard Sentry untuk frontend |

> **Catatan:** Kredensial S3 dan Redis tidak diperlukan di GitHub Actions karena build tidak membutuhkan koneksi aktif ke layanan tersebut. Mereka hanya diperlukan di server production.
