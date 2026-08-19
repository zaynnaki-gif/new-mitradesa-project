# MITRADESA — PHASE 16.1A

# CRITICAL PRODUCTION API ORIGIN RECOVERY

# DO NOT REDESIGN

# DO NOT USE MOCK DATA

============================================================
OBJECTIVE
============================================================

Production frontend MITRADESA saat ini mengalami SYSTEMIC
DATA FAILURE.

Evidence dari browser:

SEMUA request API diarahkan ke:

http://localhost:3001/api/...

dan mendapatkan:

ERR_CONNECTION_REFUSED

Contoh:

/api/identitas
/api/public/berita
/api/public/layanan
/api/public/galeri
/api/public/umkm
/api/public/agenda
/api/public/transparansi/apbdes
/api/public/statistik
/api/perangkat-desa/public

Stack trace juga menunjukkan:

useIdentitasDesa.ts
→ GET http://localhost:3001/api/identitas
→ ERR_CONNECTION_REFUSED

Ini menunjukkan production frontend kemungkinan dibuild dengan
VITE_API_URL yang salah.

============================================================
CRITICAL RULE
============================================================

JANGAN:

- redesign UI
- membuat mock data
- membuat fallback data palsu
- mengubah business logic hanya agar screenshot bagus
- mengganti API dengan static JSON
- hardcode production API URL di component
- menggunakan localhost sebagai API production

PERBAIKI ROOT CAUSE.

============================================================

1. # TRACE API CONFIGURATION

Audit seluruh repository.

Cari:

VITE_API_URL
API_URL
API_BASE_URL
localhost:3001
127.0.0.1:3001
10.10.1.198
/api/

Cari seluruh penggunaan:

fetch(
axios
useQuery
React Query
API services
hooks
stores

Command/search:

grep/search:

VITE_API_URL
localhost:3001
127.0.0.1
10.10.1.198
/api/api/

============================================================ 2. DETERMINE ACTUAL PRODUCTION API ORIGIN
============================================================

Jangan menebak.

Temukan:

- staging API
- production API
- Hostinger API
- deployment configuration
- environment variables
- server configuration

Inspect:

.env
.env.local
.env.development
.env.production
.env.staging
.env.example

package.json

Vite configuration

deployment configuration

Hostinger configuration jika tersedia.

============================================================ 3. IMPORTANT VITE BEHAVIOR
============================================================

Ingat:

VITE\_\* variables di-embed ke JavaScript saat BUILD.

Mengubah environment variable setelah dist dibuat
tidak otomatis memperbaiki frontend.

Karena itu:

1. tentukan API URL yang benar
2. set environment production
3. rebuild frontend
4. deploy dist baru
5. verify browser

============================================================ 4. API URL ARCHITECTURE
============================================================

Buat SATU canonical API configuration.

Contoh architecture:

VITE_API_URL=https://ACTUAL-API-DOMAIN/api

Kemudian:

const API_URL = import.meta.env.VITE_API_URL;

Semua request menggunakan:

${API_URL}/identitas

${API_URL}/public/berita

${API_URL}/public/umkm

dst.

JANGAN:

${API_URL}/api/...

jika API_URL sudah berakhiran /api.

============================================================ 5. DEVELOPMENT VS PRODUCTION
============================================================

Development boleh:

http://localhost:3001/api

Production TIDAK BOLEH:

http://localhost:3001/api

Production browser harus menggunakan API yang dapat diakses
dari internet / deployment environment.

Pastikan tidak ada localhost yang ter-embed ke:

apps/web/dist/

Lakukan search terhadap generated JS:

dist/assets/\*.js

Cari:

localhost:3001

Jika ditemukan setelah production build:

FAIL.

============================================================ 6. CORS
============================================================

Setelah API origin benar, audit CORS.

Production frontend:

https://darkslategrey-beaver-503941.hostingersite.com

harus diizinkan oleh backend.

Cari:

ALLOWED_ORIGINS
CORS configuration
helmet
proxy
reverse proxy

JANGAN menggunakan:

Access-Control-Allow-Origin: \*

sebagai workaround production.

Gunakan exact production origin.

============================================================ 7. VERIFY API DIRECTLY
============================================================

Sebelum browser test, hit API langsung.

Test endpoint:

/api/identitas
/api/public/berita?limit=4&page=1
/api/public/layanan?limit=6&page=1
/api/public/galeri?limit=8&page=1
/api/public/umkm?limit=3
/api/public/agenda?limit=3
/api/public/statistik
/api/public/transparansi/apbdes
/api/perangkat-desa/public?aktif=true

Catat:

HTTP status
response body
content-type
CORS headers
latency

Expected:

200

untuk public endpoints yang memang tersedia.

============================================================ 8. VERIFY FRONTEND
============================================================

Setelah rebuild + redeploy:

Open:

https://darkslategrey-beaver-503941.hostingersite.com/

Browser audit:

Chromium
Firefox
WebKit

Check:

console
network
failed requests

EXPECTED:

0 ERR_CONNECTION_REFUSED

0 localhost API requests

0 unexpected 400

0 unexpected 404

0 unexpected 500

0 failed fetch

============================================================ 9. DATA VERIFICATION
============================================================

Setelah API hidup, pastikan data benar-benar berasal dari backend.

Verify:

Homepage

- identitas
- statistik
- berita
- layanan
- galeri
- perangkat desa
- UMKM
- agenda
- transparansi

UMKM

- records
- categories
- images

Berita

- records
- categories
- images

Agenda

- records

Galeri

- media

Profil

- identitas
- sejarah
- visi misi

JANGAN membuat mock records.

============================================================ 10. HARDCODED DATA SCAN
============================================================

Setelah API recovery:

search seluruh:

const umkm = [
const berita = [
const agenda = [
const layanan = [
const statistics = [

Cari juga business values:

nama desa
alamat
nomor telepon
statistik penduduk
jumlah dusun
jumlah UMKM
APBDes
nama perangkat desa

Classify:

DESIGN CONSTANT
SYSTEM CONSTANT
BUSINESS DATA
MOCK DATA
TEST DATA

Business data harus berasal dari backend/CMS/database.

============================================================ 11. FIX VITE.SVG 404
============================================================

Evidence tambahan:

vite.svg → 404

Cari siapa yang masih mereferensikan:

vite.svg

Kemungkinan:

index.html
favicon
template Vite
manifest
component

Remove obsolete Vite starter references.

Jangan mengganti dengan asset random.

Gunakan asset MITRADESA yang benar atau hapus reference
jika memang tidak diperlukan.

============================================================ 12. DO NOT MASK API FAILURE
============================================================

Jangan membuat:

if (!data) {
return fakeData;
}

Jangan membuat:

const fallback = [...]

Jangan membuat:

Failed API → static content

API failure harus terlihat sebagai proper error state.

============================================================ 13. ERROR STATE
============================================================

Setiap data-driven page harus mempunyai:

LOADING
ERROR
EMPTY
SUCCESS

ERROR state:

Data tidak dapat dimuat.

- Coba Lagi

Technical error:

console/log

Jangan menampilkan:

Failed to fetch

sebagai satu-satunya user-facing message.

============================================================ 14. VERIFY ALL PUBLIC ROUTES
============================================================

Test:

/
/profil
/pemerintahan
/kependudukan
/kontak
/galeri
/layanan
/layanan/tracking
/berita
/umkm
/potensi
/transparansi
/agenda

Setiap route:

API healthy
data rendered
no blank state caused by API failure
no console application errors

============================================================ 15. RESPONSIVE CHECK
============================================================

Hanya setelah API recovery.

Test:

1440x900
1024x768
390x844

Check:

horizontal overflow
clipping
grid
images
buttons
typography
spacing

============================================================ 16. REGRESSION
============================================================

Run:

npm run typecheck
npm run build

Run unit tests.

Run E2E.

Run public browser audit.

============================================================ 17. PRODUCTION DIST INSPECTION
============================================================

CRITICAL.

Setelah build:

search:

apps/web/dist

untuk:

localhost:3001
127.0.0.1
10.10.1.198
/api/api/

EXPECTED:

0 production localhost references

0 private IP references

0 double /api/ prefixes

============================================================ 18. FINAL EVIDENCE
============================================================

Produce evidence:

A. Production API URL
B. API direct test results
C. CORS result
D. Production frontend network result
E. localhost scan result
F. /api/api scan result
G. vite.svg result
H. Public route matrix
I. Screenshots
J. Build result
K. Typecheck
L. Unit tests
M. E2E

============================================================ 19. FINAL REPORT
============================================================

Generate:

# MITRADESA — PHASE 16.1A

# PRODUCTION API ORIGIN RECOVERY REPORT

Include:

1. Root Cause
2. Evidence
3. Environment Configuration
4. API Origin
5. CORS
6. Frontend API Architecture
7. Files Modified
8. Production Build
9. Dist Inspection
10. API Verification
11. Public Route Verification
12. vite.svg Fix
13. Hardcoded Data Scan
14. Regression Tests
15. Remaining Issues

============================================================
FINAL VERDICT
============================================================

Use exactly one:

API RECOVERED

API RECOVERED WITH LIMITATIONS

API NOT RECOVERED

API BLOCKED

============================================================
STOP CONDITION
============================================================

STOP and report BLOCKED if:

- actual production API origin cannot be determined
- API cannot be reached externally
- CORS cannot be verified
- deployment credentials/configuration unavailable
- production build still contains localhost API
- database/backend unavailable

DO NOT claim PASS based only on local development.

============================================================
MOST IMPORTANT
============================================================

Masalah saat ini bukan:

"UMKM page jelek."

Masalah sebenarnya adalah:

PRODUCTION FRONTEND
↓
HARDCODED/INCORRECT API ORIGIN
↓
localhost:3001
↓
ERR_CONNECTION_REFUSED
↓
ALL DATA-DRIVEN PAGES FAIL

FIX THIS SYSTEMIC ROOT CAUSE FIRST.

DO NOT REDESIGN UNTIL THIS PHASE PASSES.
