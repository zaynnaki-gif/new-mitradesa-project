import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loading } from './components/Loading';
import { QueryProvider } from './hooks/QueryProvider';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Public pages
const ProfilPage = lazy(() => import('./pages/public/ProfilPage'));
const PemerintahanPage = lazy(() => import('./pages/public/PemerintahanPage'));
const KependudukanPage = lazy(() => import('./pages/public/KependudukanPage'));
const KontakPage = lazy(() => import('./pages/public/KontakPage'));
const GaleriPage = lazy(() => import('./pages/public/GaleriPage'));
const HalamanPage = lazy(() => import('./pages/public/HalamanPage'));

// Public service catalog
const LayananCatalogPage = lazy(() => import('./pages/public/layanan/LayananCatalogPage'));
const LayananDetailPage = lazy(() => import('./pages/public/layanan/LayananDetailPage'));
const TrackingPage = lazy(() => import('./pages/public/layanan/TrackingPage'));

// Berita pages
const BeritaListPage = lazy(() => import('./pages/public/berita/BeritaListPage'));
const BeritaDetailPage = lazy(() => import('./pages/public/berita/BeritaDetailPage'));

// UMKM pages
const UmkmListPage = lazy(() => import('./pages/public/umkm/UmkmListPage'));
const UmkmDetailPage = lazy(() => import('./pages/public/umkm/UmkmDetailPage'));

// Potensi pages
const PotensiListPage = lazy(() => import('./pages/public/potensi/PotensiListPage').then(m => ({ default: m.PotensiListPage })));
const PotensiDetailPage = lazy(() => import('./pages/public/potensi/PotensiDetailPage').then(m => ({ default: m.PotensiDetailPage })));

// Transparansi pages
const TransparansiPage = lazy(() => import('./pages/public/transparansi/TransparansiPage'));

// Agenda pages
const AgendaListPage = lazy(() => import('./pages/public/agenda/AgendaListPage'));

// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RequestOtpPage = lazy(() => import('./pages/auth/RequestOtpPage').then(m => ({ default: m.RequestOtpPage })));

// Protected app pages
const AppDashboard = lazy(() => import('./pages/AppDashboard'));
const WilayahPage = lazy(() => import('./pages/admin/WilayahPage').then(m => ({ default: m.WilayahPage })));
const IdentitasDesaPage = lazy(() => import('./pages/admin/IdentitasDesaPage'));
const PerangkatDesaPage = lazy(() => import('./pages/admin/PerangkatDesaPage').then(m => ({ default: m.PerangkatDesaPage })));
const PendudukPage = lazy(() => import('./pages/admin/penduduk/PendudukPage'));
const KeluargaPage = lazy(() => import('./pages/admin/master/KeluargaPage').then(m => ({ default: m.default })));
const ReferensiPage = lazy(() => import('./pages/admin/master/ReferensiPage').then(m => ({ default: m.default })));

// Surat Template pages
const TemplateListPage = lazy(() => import('./pages/admin/surat/TemplateListPage'));
const TemplateDesignerPage = lazy(() => import('./pages/admin/surat/TemplateDesignerPage'));
const ArsipSuratPage = lazy(() => import('./pages/admin/surat/ArsipSuratPage'));
// Admin Request pages
const RequestListPage = lazy(() => import('./pages/admin/permintaan/PermintaanListPage'));
const RequestDetailPage = lazy(() => import('./pages/admin/permintaan/PermintaanDetailPage'));

// Admin Layanan pages
const LayananListPage = lazy(() => import('./pages/admin/layanan/LayananListPage'));
const LayananFieldsPage = lazy(() => import('./pages/admin/layanan/LayananFieldsPage'));

// Admin Document pages
const DokumenListPage = lazy(() => import('./pages/admin/dokumen/DokumenListPage'));
const DokumenDetailPage = lazy(() => import('./pages/admin/dokumen/DokumenDetailPage'));

// Admin Konten pages
const BeritaAdminPage = lazy(() => import('./pages/admin/konten/BeritaPage'));
const HalamanAdminPage = lazy(() => import('./pages/admin/konten/HalamanPage'));
const KategoriAdminPage = lazy(() => import('./pages/admin/konten/KategoriPage'));
const MediaAdminPage = lazy(() => import('./pages/admin/konten/MediaPage'));
const AgendaAdminPage = lazy(() => import('./pages/admin/konten/AgendaPage').then(m => ({ default: m.AgendaPage })));
const UmkmAdminPage = lazy(() => import('./pages/admin/konten/UmkmPage').then(m => ({ default: m.UmkmPage })));
const PotensiAdminPage = lazy(() => import('./pages/admin/konten/PotensiPage').then(m => ({ default: m.PotensiPage })));
const TransparansiAdminPage = lazy(() => import('./pages/admin/konten/TransparansiPage').then(m => ({ default: m.TransparansiPage })));
const ExecutiveDashboard = lazy(() => import('./pages/admin/ExecutiveDashboard'));

// Public verification
const VerifyPage = lazy(() => import('./pages/verification/VerifyPage'));
import { Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';



function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, token, loading } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('DEVELOPER');

  if (loading) return <Loading />;

  // Not logged in → redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not admin (citizen) → redirect to public homepage
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/profil" element={<ProfilPage />} />
            <Route path="/pemerintahan" element={<PemerintahanPage />} />
            <Route path="/kependudukan" element={<KependudukanPage />} />
            <Route path="/kontak" element={<KontakPage />} />
            <Route path="/galeri" element={<GaleriPage />} />
            <Route path="/layanan" element={<LayananCatalogPage />} />
            <Route path="/layanan/tracking" element={<TrackingPage />} />
            <Route path="/layanan/:slug" element={<LayananDetailPage />} />

            {/* Berita routes */}
            <Route path="/berita" element={<BeritaListPage />} />
            <Route path="/berita/:slug" element={<BeritaDetailPage />} />

            {/* UMKM routes */}
            <Route path="/umkm" element={<UmkmListPage />} />
            <Route path="/umkm/:slug" element={<UmkmDetailPage />} />

            {/* Potensi routes */}
            <Route path="/potensi" element={<PotensiListPage />} />
            <Route path="/potensi/:slug" element={<PotensiDetailPage />} />

            {/* Transparansi routes */}
            <Route path="/transparansi" element={<TransparansiPage />} />

            {/* Agenda routes */}
            <Route path="/agenda" element={<AgendaListPage />} />

            {/* Halaman dinamis */}
            <Route path="/halaman/:slug" element={<HalamanPage />} />

            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verifikasi" element={<RequestOtpPage />} />

            {/* Admin root redirect */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Protected routes */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AppDashboard />
                </AdminRoute>
              }
            />

            {/* Admin routes */}
            {/* Admin Master Data routes */}
            <Route
              path="/admin/master/penduduk"
              element={
                <AdminRoute>
                  <PendudukPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/master/keluarga"
              element={
                <AdminRoute>
                  <KeluargaPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/master/referensi"
              element={
                <AdminRoute>
                  <ReferensiPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/master/wilayah"
              element={
                <AdminRoute>
                  <WilayahPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/master/identitas-desa"
              element={
                <AdminRoute>
                  <IdentitasDesaPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/master/perangkat-desa"
              element={
                <AdminRoute>
                  <PerangkatDesaPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/surat/templates"
              element={
                <AdminRoute>
                  <TemplateListPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/surat/designer/:id"
              element={
                <AdminRoute>
                  <TemplateDesignerPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/surat/arsip"
              element={
                <AdminRoute>
                  <ArsipSuratPage />
                </AdminRoute>
              }
            />
            {/* Admin Layanan routes */}
            <Route
              path="/admin/layanan"
              element={
                <AdminRoute>
                  <LayananListPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/layanan/:id/fields"
              element={
                <AdminRoute>
                  <LayananFieldsPage />
                </AdminRoute>
              }
            />

            {/* Admin Request routes */}
            <Route
              path="/admin/permintaan"
              element={
                <AdminRoute>
                  <RequestListPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/permintaan/:id"
              element={
                <AdminRoute>
                  <RequestDetailPage />
                </AdminRoute>
              }
            />

            {/* Admin Document routes */}
            <Route
              path="/admin/dokumen"
              element={
                <AdminRoute>
                  <DokumenListPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/dokumen/:id"
              element={
                <AdminRoute>
                  <DokumenDetailPage />
                </AdminRoute>
              }
            />

            {/* Admin Konten routes */}
            <Route
              path="/admin/konten/berita"
              element={
                <AdminRoute>
                  <BeritaAdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/konten/halaman"
              element={
                <AdminRoute>
                  <HalamanAdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/konten/kategori"
              element={
                <AdminRoute>
                  <KategoriAdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/konten/media"
              element={
                <AdminRoute>
                  <MediaAdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/konten/agenda"
              element={
                <AdminRoute>
                  <AgendaAdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/konten/umkm"
              element={
                <AdminRoute>
                  <UmkmAdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/konten/potensi"
              element={
                <AdminRoute>
                  <PotensiAdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/konten/transparansi"
              element={
                <AdminRoute>
                  <TransparansiAdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/dashboard/executive"
              element={
                <AdminRoute>
                  <ExecutiveDashboard />
                </AdminRoute>
              }
            />

            {/* Public verification */}
            <Route path="/verifikasi/:token" element={<VerifyPage />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
