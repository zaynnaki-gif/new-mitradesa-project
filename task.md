============================================================

# MANDATORY REFERENCE STUDY — WESLEY COLLEGE

============================================================

REFERENCE WEBSITE:

https://www.wesleycollege-usyd.edu.au/

THIS IS A MANDATORY DESIGN RESEARCH STEP.

Sebelum menulis atau mengubah kode navbar MITRADESA,
AI AGENT WAJIB menggunakan browser / browser automation /
available visual inspection skill untuk membuka website
Wesley College secara LANGSUNG.

Jangan hanya mengandalkan:

- source code
- sitemap
- textual description
- search result
- asumsi
- memory model

Actual rendered website adalah source of truth untuk
reference study.

============================================================

# 1. DIRECT BROWSER RECONNAISSANCE

============================================================

Buka secara langsung:

https://www.wesleycollege-usyd.edu.au/

Jika tersedia browser skill / browser automation skill,
WAJIB gunakan skill tersebut.

Jika tersedia screenshot / visual inspection capability,
WAJIB gunakan capability tersebut.

Jangan langsung coding sebelum reconnaissance selesai.

============================================================

# 2. STUDY NAVBAR IN DETAIL

============================================================

Audit secara visual:

A. Initial navbar state

Perhatikan:

- tinggi navbar
- posisi logo
- typography
- spacing antar menu
- alignment
- whitespace
- warna
- border
- CTA
- hover indicator
- active indicator

B. Open setiap menu utama.

WAJIB mencoba:

- hover
- click
- keyboard navigation jika tersedia

Untuk setiap menu:

capture / inspect:

- ukuran dropdown
- posisi dropdown
- width
- height
- number of columns
- typography hierarchy
- heading
- submenu
- description
- image
- whitespace
- divider
- hover state
- active state
- animation
- transition
- overlay
- relationship antara navbar dan dropdown

============================================================

# 3. STUDY DROPDOWN — PIXEL/COMPOSITION LEVEL

============================================================

Jangan hanya menyimpulkan:

"Wesley menggunakan mega menu."

Itu terlalu dangkal.

Analisis:

1. Bagaimana dropdown muncul?
2. Apakah full-width atau constrained?
3. Apakah panel mengikuti container website?
4. Apakah dropdown memiliki overlay?
5. Apakah navbar berubah ketika dropdown aktif?
6. Berapa kolom?
7. Bagaimana column spacing?
8. Bagaimana heading kategori dibedakan dari link?
9. Bagaimana link diberi hover feedback?
10. Apakah ada visual/image?
11. Apakah ada featured content?
12. Bagaimana submenu bertingkat ditampilkan?
13. Bagaimana dropdown ditutup?
14. Bagaimana transisinya?
15. Bagaimana behavior ketika mouse berpindah dari navbar
    ke dropdown?
16. Bagaimana behavior ketika viewport diperkecil?

============================================================

# 4. STUDY MOBILE NAVIGATION

============================================================

WAJIB inspect Wesley pada mobile viewport.

Minimum:

390x844

Analisis:

- hamburger
- menu drawer
- accordion
- nested navigation
- back navigation
- close interaction
- typography
- spacing
- active state
- animation
- scroll behavior

Jangan mengasumsikan mobile hanya desktop yang diperkecil.

============================================================

# 5. STUDY RESPONSIVE BREAKPOINTS

============================================================

Inspect minimal:

1440px
1024px
768px
390px

Catat perubahan:

navbar
dropdown
navigation hierarchy
spacing
font
mobile drawer

Gunakan hasil observasi sebagai dasar implementasi
MITRADESA.

============================================================

# 6. CREATE REFERENCE DESIGN SPEC

============================================================

SEBELUM CODING, AI AGENT WAJIB menghasilkan internal
design specification berdasarkan hasil observasi.

Minimal:

REFERENCE_NAV_HEIGHT
REFERENCE_CONTENT_WIDTH
REFERENCE_DROPDOWN_WIDTH
REFERENCE_DROPDOWN_COLUMNS
REFERENCE_PADDING
REFERENCE_GAP
REFERENCE_FONT_SCALE
REFERENCE_BORDER
REFERENCE_SHADOW
REFERENCE_ANIMATION
REFERENCE_BREAKPOINTS

Tidak perlu menyalin angka secara buta.

Tujuannya memahami design system Wesley secara presisi
kemudian menerjemahkannya ke Design System MITRADESA.

============================================================

# 7. IMPORTANT — DO NOT COPY BRANDING

============================================================

Yang dipelajari:

LAYOUT
COMPOSITION
NAVIGATION BEHAVIOR
INFORMATION ARCHITECTURE
SPACING
TYPOGRAPHY HIERARCHY
INTERACTION
RESPONSIVE BEHAVIOR
EDITORIAL PRESENTATION

Yang TIDAK boleh disalin:

Wesley logo
Wesley branding
Wesley colors secara identik
Wesley proprietary assets
Wesley copywriting
Wesley images
Wesley content
Wesley-specific icons

MITRADESA harus tetap memiliki:

MITRADESA BRAND IDENTITY
DESA CONTEXT
EXISTING COLOR SYSTEM
EXISTING ROUTES
EXISTING DATA

============================================================

# 8. TRANSLATE, DON'T CLONE

============================================================

Setelah memahami Wesley:

Jangan membuat:

"Wesley clone."

Buat:

"Wesley-inspired navigation architecture adapted
for Mitradesa."

Contoh:

Wesley:

About Wesley
Learning
School Life
Boarding
School Community
Enrol
News

MITRADESA:

Tentang Desa
Layanan
Potensi
Informasi
Kontak

Tetapi cara menyajikan dropdown:

INSPIRED BY THE OBSERVED WESLEY EXPERIENCE.

============================================================

# 9. MITRADESA MEGA MENU

============================================================

Implementasikan:

BERANDA

TENTANG DESA ▾

LAYANAN ▾

POTENSI ▾

INFORMASI ▾

KONTAK

[MULAI LAYANAN]

Top-level navigation harus tetap ringkas.

JANGAN kembali ke:

Beranda
Layanan
Berita
Agenda
Transparansi
Profil
Pemerintahan
Potensi
UMKM
Galeri
...

============================================================

# 10. DROPDOWN MUST FEEL LIKE WESLEY

============================================================

Jangan membuat dropdown:

width 250px
list vertical
white box
small text

Itu BUKAN target.

Target:

LARGE EDITORIAL NAVIGATION PANEL.

Dropdown harus terasa seperti sebuah
"second navigation canvas".

Contoh struktur konseptual:

┌────────────────────────────────────────────────────────────┐
│ │
│ TENTANG DESA │
│ │
│ Kenali identitas, sejarah, │
│ pemerintahan dan masyarakat desa. │
│ │
│ PROFIL DESA PEMERINTAHAN KEPENDUDUKAN │
│ Mengenal desa... Struktur desa... Data warga... │
│ │
└────────────────────────────────────────────────────────────┘

Tetapi jangan membuat semua dropdown dengan layout
identik.

============================================================

# 11. DROPDOWN VARIANTS

============================================================

TENTANG DESA:

Editorial text + navigation.

LAYANAN:

Navigation + optional featured service dari API.

POTENSI:

Image + navigation.

INFORMASI:

Featured content + navigation.

Tujuan:

Setiap dropdown memiliki karakter sendiri.

============================================================

# 12. VISUAL SCALE

============================================================

Dropdown harus memiliki:

large category heading

small descriptive text

large link typography

subtle metadata

generous spacing

clear grouping

Jangan menggunakan:

tiny 12px navigation wall.

Link utama harus mudah dipindai.

============================================================

# 13. OPEN/CLOSE BEHAVIOR

============================================================

Pelajari behavior Wesley secara langsung.

Kemudian implementasikan equivalent behavior:

- hover open pada desktop
- click toggle
- keyboard accessible
- Escape close
- outside click close
- mouse transition tolerant
- no accidental closing ketika cursor bergerak
  dari navbar ke dropdown
- subtle enter/exit animation

Jangan menggunakan animation berlebihan.

============================================================

# 14. DROPDOWN WIDTH

============================================================

Jangan mengunci:

width: 400px;

Gunakan responsive strategy.

Desktop:

large constrained panel / viewport-aware panel.

Tablet:

sesuaikan available width.

Jika reference menggunakan panel yang lebih luas,
ikuti prinsip tersebut.

Pastikan:

dropdown tidak keluar viewport.

============================================================

# 15. OVERLAY

============================================================

Audit apakah reference menggunakan page dimming /
overlay / visual separation.

Jika ditemukan dalam reference:

implementasikan versi MITRADESA.

Contoh:

navbar
↓
dropdown
↓
subtle page overlay

Tujuan:

menguatkan perception bahwa dropdown adalah
navigation layer.

Jangan membuat overlay terlalu gelap.

============================================================

# 16. DATA INTEGRITY

============================================================

Navigation STRUCTURE boleh static.

Business content TIDAK BOLEH static.

Contoh static:

"Tentang Desa"
"Informasi"
"Potensi"

Contoh TIDAK BOLEH hardcode:

latest news
featured image
service records
UMKM records
agenda
statistics

Jika dropdown menampilkan data:

AMBIL DARI EXISTING API/CMS.

Jika API tidak memiliki data:

render graceful empty state atau hide optional
content block.

JANGAN membuat dummy data.

============================================================

# 17. EXISTING ROUTES MUST REMAIN

============================================================

/profil
/pemerintahan
/kependudukan
/layanan
/layanan/tracking
/umkm
/potensi
/galeri
/berita
/agenda
/transparansi
/kontak

Tidak boleh diubah.

============================================================

# 18. VISUAL COMPARISON

============================================================

Setelah implementasi:

ambil screenshot MITRADESA:

1440x900

dengan:

1. Navbar closed
2. Tentang Desa open
3. Layanan open
4. Potensi open
5. Informasi open
6. Mobile menu open

Kemudian lakukan comparison terhadap hasil
reference reconnaissance.

Audit:

- scale
- spacing
- hierarchy
- density
- dropdown proportion
- visual weight
- interaction
- responsiveness

Tujuan comparison:

bukan pixel cloning.

Tujuan:

memastikan MITRADESA telah memahami dan menerapkan
PRINSIP visual reference dengan benar.

============================================================

# 19. ANTI-SHALLOW-IMPLEMENTATION RULE

============================================================

FAIL IMPLEMENTATION jika AI Agent hanya menghasilkan:

<nav>
  <a>Beranda</a>
  <a>Tentang</a>
  <a>Layanan</a>
</nav>

dengan dropdown CSS sederhana.

FAIL jika:

- dropdown terlalu kecil
- typography kecil
- spacing sempit
- semua link menjadi list
- tidak ada hierarchy
- tidak ada visual distinction
- tidak ada editorial composition
- tidak ada responsive adaptation

Target harus terlihat sebagai:

PREMIUM EDITORIAL MEGA NAVIGATION.

============================================================

# 20. IF BROWSER SKILL IS AVAILABLE

============================================================

Gunakan browser skill.

Prioritas:

1. open reference
2. inspect navbar
3. interact with each menu
4. inspect dropdown
5. resize viewport
6. inspect mobile
7. capture screenshots
8. document observations
9. implement
10. compare
11. iterate

JANGAN skip step 1–8.

============================================================

# 21. IF REFERENCE CANNOT BE OPENED

============================================================

STOP sebelum membuat klaim bahwa design telah
dipelajari secara langsung.

Report:

REFERENCE AUDIT BLOCKED

dan jelaskan:

- browser unavailable
- URL inaccessible
- visual inspection unavailable

Jangan mengarang hasil observasi.

============================================================

# 22. FINAL REPORT MUST INCLUDE

============================================================

# MITRADESA — PHASE 16.3

# WESLEY-INSPIRED NAVIGATION AUDIT & IMPLEMENTATION

Include:

## A. Reference Audit

Reference:
https://www.wesleycollege-usyd.edu.au/

Browser inspection:
PASS / BLOCKED

Viewports inspected:

1440
1024
768
390

## B. Observed Wesley Patterns

Jelaskan hasil observasi nyata:

- navbar structure
- dropdown architecture
- typography
- spacing
- columns
- imagery
- hover
- animation
- mobile
- responsive behavior

Jangan mengisi bagian ini berdasarkan asumsi.

## C. MITRADESA Translation

Jelaskan bagaimana pattern tersebut diterjemahkan
ke Mitradesa.

## D. Navigation Architecture

List final top-level categories.

## E. Files Modified

## F. Data Integrity

Business data:
dynamic / hardcoded

## G. Accessibility

Keyboard:
PASS / FAIL

ARIA:
PASS / FAIL

Focus:
PASS / FAIL

## H. Responsive

1440
1024
768
390

## I. Regression

Existing routes:
PASS / FAIL

## J. Screenshot Evidence

Reference screenshots:
AVAILABLE / UNAVAILABLE

Mitradesa screenshots:
AVAILABLE / UNAVAILABLE

## K. Final Verdict

Use exactly:

WESLEY-INSPIRED NAVIGATION COMPLETE

or

WESLEY-INSPIRED NAVIGATION COMPLETE WITH LIMITATIONS

or

REFERENCE AUDIT BLOCKED

============================================================
ABSOLUTE RULE
============================================================

Jangan mengatakan:

"terinspirasi Wesley"

hanya karena dropdown dibuat.

AI AGENT HARUS:

OBSERVE
UNDERSTAND
DOCUMENT
TRANSLATE
IMPLEMENT
COMPARE
VERIFY

Reference website adalah objek studi visual.

MITRADESA bukan clone Wesley.

MITRADESA harus memiliki:

WESLEY-INSPIRED EXPERIENCE

- MITRADESA IDENTITY
- REAL SYSTEM DATA
- EXISTING ROUTES
- ACCESSIBLE NAVIGATION
