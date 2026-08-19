# MITRADESA Deployment Guide - serunimumbul.com

## Prerequisites
- Hostinger account with Business plan (Node.js support)
- Domain: serunimumbul.com
- Subdomain: api.serunimumbul.com

## Build Verification
- API dist: apps/api/dist/
- Web dist: apps/web/dist/ (4.5MB)
- API URL: api.serunimumbul.com (embedded in JS)

---

## Step 1: Domain Setup di Hostinger

### 1.1 Add Domain
1. Login ke https://hpanel.hostinger.com
2. Websites → Add Website
3. Masukkan `serunimumbul.com`
4. Pilih hosting plan
5. Tunggu propagasi DNS

### 1.2 Buat Subdomain API
1. Website details → Subdomains
2. Add subdomain: `api` → Point ke `serunimumbul.com`
3. Tunggu DNS propagate

---

## Step 2: Deploy API Backend

### 2.1 Siapkan Environment Variables
```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres.psxppjmldyhwrqqyqegg:Serunimumbul-88@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
JWT_SECRET=sB80sqGHTiH3RgFgQJgi6TBKqZ3Kjaliq5lm+ppwJF013cWg5p2LpIpK/4Zqi7F4j7HbmD8xmD21B0NBUXDZQ==
API_URL=https://api.serunimumbul.com
WEB_URL=https://serunimumbul.com
ALLOWED_ORIGINS=https://serunimumbul.com,https://www.serunimumbul.com
DESA_ID=1
DESA_KODE=52.03.08.2014
DESA_NAMA=Desa Seruni Mumbul
LOG_LEVEL=warn
```

### 2.2 Deploy via Node.js App
1. hPanel → Websites → Pilih hosting serunimumbul.com
2. Tab **Node.js** → **Deploy Node.js Application**
3. Konfigurasi:
   - **Application root**: `api`
   - **Startup file**: `dist/index.js`
   - **Package manager**: npm
   - **Build command**: `npm install`
   - **Run command**: `npm start`
4. Set environment variables dari 2.1
5. Deploy & start

### 2.3 Verifikasi API
```bash
curl https://api.serunimumbul.com/api/health
# Expected: {"success":true,"data":{"service":"MITRADESA","version":"0.1.0","environment":"production"}
```

---

## Step 3: Deploy Frontend

### 3.1 Upload Static Files
1. hPanel → File Manager → public_html
2. **Hapus** file lama
3. **Upload** semua isi folder `apps/web/dist/`

Struktur yang benar:
```
public_html/
├── index.html
├── favicon.svg
├── assets/
│   ├── *.js
│   └── *.css
├── robots.txt
└── sitemap.xml
```

---

## Step 4: Verifikasi Deployment

### Test API:
```bash
curl https://api.serunimumbul.com/api/health
curl https://api.serunimumbul.com/api/identitas
```

### Test Frontend:
Buka https://serunimumbul.com di browser

---

## Troubleshooting

### API returns 500
- Cek logs di Node.js dashboard
- Verifikasi DATABASE_URL benar
- Pastikan JWT_SECRET di-set

### CORS error
- Pastikan ALLOWED_ORIGINS include domain dengan https://

### Connection refused
- API belum jalan → restart dari Node.js dashboard
- Port 3001 aktif?
