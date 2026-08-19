# MITRADESA - Hostinger Deployment Guide

## Prerequisites
- Hostinger account with Business plan (Node.js support)
- Domain/subdomain for frontend: `darkslategrey-beaver-503941.hostingersite.com`

---

## Deploy Frontend (Static Files)

### Option 1: Hostinger File Manager (Recommended)

1. **Login ke Hostinger hPanel**
   - https://hpanel.hostinger.com

2. **Buka File Manager**
   - Navigate ke: `Website` → `details` (pada hosting) → `File Manager`

3. **Navigate ke public_html**
   - Buka folder `public_html`
   - **DELETE** semua file lama (kecuali folder yang perlu dipertahankan)

4. **Upload files**
   - Klik `Upload`
   - Upload **SEMUA ISI** dari folder `apps/web/dist/`
   - Atau drag-and-drop semua file dari folder dist

5. **Pastikan struktur sama:**
   ```
   public_html/
   ├── index.html
   ├── favicon.svg
   ├── og-image.svg
   ├── robots.txt
   ├── sitemap.xml
   └── assets/
       ├── *.js
       └── *.css
   ```

### Option 2: FTP

1. **Dapatkan FTP credentials**
   - hPanel → Website → Details → FTP Details

2. **Connect menggunakan FTP client**
   - FileZilla, Cyberduck, atau WinSCP

3. **Upload isi folder dist/ ke public_html/**

---

## Verify Deployment

1. **Buka website:**
   ```
   https://darkslategrey-beaver-503941.hostingersite.com
   ```

2. **Check Network tab (F12):**
   - Tidak boleh ada `localhost:3001` errors
   - Tidak boleh ada `ERR_CONNECTION_REFUSED`

3. **Check Console:**
   - Tidak boleh ada JavaScript errors fatal

---

## Troubleshooting

### Error: vite.svg 404
**FIXED** - favicon.svg sudah digunakan

### Error: API calls fail
**NORMAL** - API belum di-deploy. Frontend akan menampilkan loading state.

### Error: CORS
**NORMAL** - Backend perlu di-deploy dengan `ALLOWED_ORIGINS` yang benar.

---

## Post-Deployment Checklist

- [ ] Homepage loads
- [ ] No console errors
- [ ] Navigation works
- [ ] Assets (CSS/JS) loaded correctly
- [ ] Favicon displays

---

## Deploy API (Separate Step)

API backend perlu di-deploy terpisah. Lihat `apps/api/.env.production` untuk konfigurasi.

### API Subdomain Needed
Buat subdomain baru di Hostinger, contoh:
- `api-mitradesa.hostingersite.com`

### Update Frontend API URL
1. Edit `apps/web/.env.production`:
   ```
   VITE_API_URL=https://api-mitradesa.hostingersite.com
   ```

2. Rebuild:
   ```bash
   cd apps/web
   npm run build:prod
   ```

3. Re-upload dist/

---

## Quick Commands Reference

```bash
# Build frontend
cd apps/web
npm run build:prod

# Check dist
ls dist/
ls dist/assets/

# Scan for localhost
grep -r "localhost" dist/assets/*.js
```

---

## Contact
Need help? Check Hostinger documentation or contact support.
