/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { Button, Input, Select, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import { safeFetchJson } from '@/lib/fetch';
import styles from './ConfigPage.module.css';

// ============================================
// Types
// ============================================
interface ConfigItem {
  id: string;
  groupName: string;
  key: string;
  value: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  description?: string;
  isSystem: boolean;
}

interface IdentitasDesa {
  id?: number;
  namaDesa: string;

  kodeDesa?: string;
  alamat?: string;
  telepon?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  logoDesaUrl?: string;
  kepalaDesa?: string;
  sekretarisDesa?: string;
}

interface SystemStatus {
  database: { status: string; label: string };
  whatsapp: { status: string; label: string };
  backup: { lastDate: string | null; label: string };
  system: { uptimeLabel: string; memoryMb: number };
}

type TabKey =
  | 'identitas'
  | 'persuratan'
  | 'pengguna'
  | 'notifikasi'
  | 'layanan'
  | 'keamanan'
  | 'backup'
  | 'kependudukan'
  | 'keuangan'
  | 'kesehatan'
  | 'portal'
  | 'bansos';

const TABS: { id: TabKey; label: string; icon: string }[] = [
  { id: 'identitas', label: 'Identitas Desa', icon: '\u{1F3DB}\uFE0F' },
  { id: 'persuratan', label: 'Persuratan', icon: '\u{1F4C4}' },
  { id: 'pengguna', label: 'Pengguna & Role', icon: '\u{1F464}' },
  { id: 'notifikasi', label: 'Notifikasi WA', icon: '\u{1F4F1}' },
  { id: 'keamanan', label: 'Keamanan', icon: '\u{1F512}' },
  { id: 'backup', label: 'Backup & Sistem', icon: '\u{1F4BE}' },
  { id: 'keuangan', label: 'Keuangan', icon: '\u{1F4B0}' },
  { id: 'kesehatan', label: 'Kesehatan', icon: '\u{1F3E5}' },
  { id: 'portal', label: 'Portal Publik', icon: '\u{1F310}' },
  { id: 'bansos', label: 'Bansos & Aduan', icon: '\u{1F91D}' },
];

// ============================================
// Sub-components (defined outside — no hooks)
// ============================================
function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionCardHeader}>
        <h3 className={styles.sectionCardTitle}>{title}</h3>
        {subtitle && <p className={styles.sectionCardSubtitle}>{subtitle}</p>}
      </div>
      <div className={styles.sectionCardBody}>{children}</div>
    </div>
  );
}

function FormRow({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className={styles.formRow}>
      <label className={styles.formLabel}>{label}</label>
      {children}
      {help && <small className={styles.formHelp}>{help}</small>}
    </div>
  );
}

function ExternalLink({ to, label, description }: { to: string; label: string; description?: string }) {
  return (
    <div className={styles.externalLinkCard}>
      <div>
        <strong>{label}</strong>
        {description && <p className={styles.externalLinkDesc}>{description}</p>}
      </div>
      <a href={to} className={styles.externalLinkBtn}>Buka →</a>
    </div>
  );
}

// ============================================
// Main Component
// ============================================
export default function ConfigPage() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = (location.hash.replace('#', '') || 'identitas') as TabKey;

  // Global state
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Identitas
  const [identitas, setIdentitas] = useState<IdentitasDesa | null>(null);
  const [identitasLoading, setIdentitasLoading] = useState(false);
  const [identitasForm, setIdentitasForm] = useState<Partial<IdentitasDesa>>({});

  // Persuratan
  const [suratFormat, setSuratFormat] = useState('');
  const [suratKopAktif, setSuratKopAktif] = useState('true');

  // Pengguna
  const [pendaftaranMandiri, setPendaftaranMandiri] = useState('true');
  const [defaultRole, setDefaultRole] = useState('WARGA');

  // Notifikasi
  const [fonntKey, setFonntKey] = useState('');
  const [waTemplateSubmit, setWaTemplateSubmit] = useState('');
  const [waTemplateSelesai, setWaTemplateSelesai] = useState('');
  const [waTestLoading, setWaTestLoading] = useState(false);
  const [waTestResult, setWaTestResult] = useState<any>(null);

  // Keamanan
  const [maxLogin, setMaxLogin] = useState('5');
  const [sessionExpire, setSessionExpire] = useState('120');

  // Maintenance & System
  const [maintenanceMode, setMaintenanceMode] = useState('false');
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // Keuangan
  const [tahunAnggaranAktif, setTahunAnggaranAktif] = useState(String(new Date().getFullYear()));
  const [formatLaporan, setFormatLaporan] = useState('RINGKAS');

  // Kesehatan
  const [jadwalPosyandu, setJadwalPosyandu] = useState('');
  const [pengingatHmin, setPengingatHmin] = useState('1');

  // Portal
  const [temaWarna, setTemaWarna] = useState('#10b981');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [statusPortal, setStatusPortal] = useState('PUBLIK');

  // Bansos & Aduan
  const [autoReplyAduan, setAutoReplyAduan] = useState('');
  const [maksBansos, setMaksBansos] = useState('1');

  // ------------------------------------------
  // Fetch all configs
  // ------------------------------------------
  const fetchConfigs = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(null);
    try {
      const data = await safeFetchJson(`${API_URL}/config?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        const payload = data.data || {};
        const list: ConfigItem[] = Array.isArray(payload) ? payload : (payload.data || []);
        const items = list.map((item: any) => ({
          ...item,
          valueType: item.valueType || item.value_type || 'STRING',
        }));
        setConfigs(items);

        const cv = (key: string) => items.find((c: ConfigItem) => c.key === key)?.value ?? '';
        setSuratFormat(cv('FORMAT_NOMOR_SURAT'));
        setSuratKopAktif(cv('KOP_SURAT_AKTIF') || 'true');
        setPendaftaranMandiri(cv('PENDAFTARAN_MANDIRI') || 'true');
        setDefaultRole(cv('DEFAULT_WARGA_ROLE') || 'WARGA');
        setFonntKey(cv('FONNTE_API_KEY'));
        setWaTemplateSubmit(cv('TEMPLATE_WA_SUBMIT'));
        setWaTemplateSelesai(cv('TEMPLATE_WA_SELESAI'));
        setMaxLogin(cv('MAX_LOGIN_ATTEMPTS') || '5');
        setSessionExpire(cv('SESSION_EXPIRE_MINUTES') || '120');
        setMaintenanceMode(cv('MAINTENANCE_MODE') || 'false');
        setMaintenanceMsg(cv('MAINTENANCE_MESSAGE'));
        setTahunAnggaranAktif(cv('TAHUN_ANGGARAN_AKTIF') || String(new Date().getFullYear()));
        setFormatLaporan(cv('FORMAT_LAPORAN') || 'RINGKAS');
        setJadwalPosyandu(cv('JADWAL_POSYANDU_DEFAULT'));
        setPengingatHmin(cv('PENGINGAT_POSYANDU_HMIN') || '1');
        setTemaWarna(cv('TEMA_WARNA_UTAMA') || '#10b981');
        setHeroImageUrl(cv('HERO_IMAGE_URL'));
        setStatusPortal(cv('STATUS_PORTAL') || 'PUBLIK');
        setAutoReplyAduan(cv('AUTO_REPLY_ADUAN'));
        setMaksBansos(cv('MAKSIMAL_BANSOS_PER_KK') || '1');
      }
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : 'Gagal memuat konfigurasi');
    } finally {
      setConfigLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  useEffect(() => {
    if (activeTab === 'identitas' && !identitas) {
      setIdentitasLoading(true);
      safeFetchJson(`${API_URL}/identitas`, { headers: { Authorization: `Bearer ${token}` } })
        .then(data => {
          if (data.success) {
            setIdentitas(data.data);
            setIdentitasForm(data.data || {});
          }
        })
        .finally(() => setIdentitasLoading(false));
    }
  }, [activeTab, token, identitas]);

  useEffect(() => {
    if (activeTab === 'backup' && !systemStatus) {
      safeFetchJson(`${API_URL}/config/system-status`, { headers: { Authorization: `Bearer ${token}` } })
        .then(data => { if (data.success) setSystemStatus(data.data); });
    }
  }, [activeTab, token, systemStatus]);

  // ------------------------------------------
  // Helpers
  // ------------------------------------------
  const getConfigValue = (key: string) => configs.find(c => c.key === key)?.value ?? '';

  const showSuccess = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const bulkSave = async (updates: Array<{ key: string; groupName: string; value: string }>) => {
    setIsSaving(true);
    try {
      const res = await safeFetchJson(`${API_URL}/config/bulk`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (res.success) {
        await fetchConfigs();
        showSuccess('Pengaturan berhasil disimpan ke database');
      } else {
        alert('Gagal menyimpan: ' + (res.message || 'Unknown error'));
      }
    } catch { alert('Terjadi kesalahan saat menyimpan'); }
    finally { setIsSaving(false); }
  };

  const testWaConnection = async () => {
    setWaTestLoading(true);
    setWaTestResult(null);
    try {
      const res = await safeFetchJson(`${API_URL}/config/test-wa`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.success) { setWaTestResult(res.data); await fetchConfigs(); }
    } catch { setWaTestResult({ connected: false, message: 'Koneksi gagal' }); }
    finally { setWaTestLoading(false); }
  };

  const saveIdentitasApi = async (data: Partial<IdentitasDesa>) => {
    setIsSaving(true);
    try {
      const res = await safeFetchJson(`${API_URL}/identitas`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.success) {
        setIdentitas(prev => ({ ...prev!, ...data }));
        showSuccess('Identitas desa berhasil disimpan');
      } else { alert('Gagal: ' + (res.message || 'Unknown')); }
    } catch { alert('Terjadi kesalahan'); }
    finally { setIsSaving(false); }
  };

  // ------------------------------------------
  // Tab Renders
  // ------------------------------------------

  // 1. Identitas
  const renderIdentitas = () => {
    if (identitasLoading) return <LoadingState message="Memuat data identitas..." />;
    const updateField = (field: keyof IdentitasDesa, value: string) =>
      setIdentitasForm(prev => ({ ...prev, [field]: value }));

    return (
      <>
        <SectionCard title="Profil & Identitas Desa" subtitle="Tampil di portal publik, kop surat, dan QR verifikasi">
          <div className={styles.formGrid}>
            <FormRow label="Nama Resmi Desa">
              <Input disabled defaultValue={identitasForm.namaDesa || ''} onBlur={e => updateField('namaDesa', e.target.value)} placeholder="Desa Seruni Mumbul" />
            </FormRow>
            <FormRow label="Kode Desa">
              <Input disabled defaultValue={identitasForm.kodeDesa || ''} onBlur={e => updateField('kodeDesa', e.target.value)} placeholder="3504012001" />
            </FormRow>
            <FormRow label="Email Resmi">
              <Input type="email" defaultValue={identitasForm.email || ''} onBlur={e => updateField('email', e.target.value)} placeholder="desa@serunimumbul.go.id" />
            </FormRow>
            <FormRow label="Nomor Telepon">
              <Input defaultValue={identitasForm.telepon || ''} onBlur={e => updateField('telepon', e.target.value)} placeholder="0341-xxxxxx" />
            </FormRow>
            <FormRow label="WhatsApp Kantor">
              <Input defaultValue={identitasForm.whatsapp || ''} onBlur={e => updateField('whatsapp', e.target.value)} placeholder="08xxxxxxxxx" />
            </FormRow>
            <FormRow label="Website" help="Harus diawali https://">
              <Input defaultValue={identitasForm.website || ''} onBlur={e => updateField('website', e.target.value)} placeholder="https://serunimumbul.com" />
            </FormRow>
          </div>
          <FormRow label="Alamat Kantor Desa">
            <textarea className={styles.textarea} defaultValue={identitasForm.alamat || ''} onBlur={e => updateField('alamat', e.target.value)} rows={3} placeholder="Jl. Raya Seruni No.1..." />
          </FormRow>
          <Button color="primary" disabled={isSaving} onClick={() => saveIdentitasApi(identitasForm)} style={{ marginTop: '1rem' }}>
            {isSaving ? 'Menyimpan...' : 'Simpan Identitas Desa'}
          </Button>
        </SectionCard>

        <SectionCard title="Pejabat Desa">
          <div className={styles.formGrid}>
            <FormRow label="Nama Kepala Desa">
              <Input defaultValue={identitasForm.kepalaDesa || ''} onBlur={e => saveIdentitasApi({ ...identitasForm, kepalaDesa: e.target.value })} placeholder="Nama Lengkap" />
            </FormRow>
            <FormRow label="Nama Sekretaris Desa">
              <Input defaultValue={identitasForm.sekretarisDesa || ''} onBlur={e => saveIdentitasApi({ ...identitasForm, sekretarisDesa: e.target.value })} placeholder="Nama Lengkap" />
            </FormRow>
          </div>
          <p className={styles.hint}>Untuk daftar lengkap perangkat desa, gunakan modul Perangkat Desa.</p>
        </SectionCard>

        <SectionCard title="Logo & Branding">
          <FormRow label="URL Logo Desa" help="Logo tampil di kop surat dan header portal publik">
            <Input defaultValue={identitasForm.logoDesaUrl || ''} onBlur={e => saveIdentitasApi({ ...identitasForm, logoDesaUrl: e.target.value })} placeholder="https://..." />
          </FormRow>
          {identitasForm.logoDesaUrl && (
            <div className={styles.logoPreview}>
              <small>Preview:</small>
              <img src={identitasForm.logoDesaUrl} alt="Logo" style={{ height: 60, marginTop: 8, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
        </SectionCard>
      </>
    );
  };

  // 2. Persuratan
  const renderPersuratan = () => {
    const previewNomor = suratFormat
      .replace('{nomor}', '001')
      .replace('{kode_klasifikasi}', '400')
      .replace('{tahun}', String(new Date().getFullYear()));

    return (
      <>
        <SectionCard title="Format Penomoran Surat Otomatis" subtitle="Digunakan saat sistem membuat nomor surat baru">
          <FormRow label="Format Nomor Surat" help="Placeholder: {nomor}, {kode_klasifikasi}, {tahun}">
            <Input value={suratFormat} onChange={e => setSuratFormat(e.target.value)} placeholder="{nomor}/{kode_klasifikasi}/429.114.03/{tahun}" />
          </FormRow>
          {suratFormat && <div className={styles.previewBox}><small>Preview: </small><code>{previewNomor}</code></div>}
          <Button color="primary" disabled={isSaving} onClick={() => bulkSave([{ key: 'FORMAT_NOMOR_SURAT', groupName: 'PERSURATAN', value: suratFormat }])} style={{ marginTop: '0.75rem' }}>
            {isSaving ? 'Menyimpan...' : 'Simpan Format Nomor'}
          </Button>
        </SectionCard>

        <SectionCard title="Kop Surat">
          <FormRow label="Tampilkan Kop Surat pada Cetakan">
            <Select value={suratKopAktif} onChange={e => setSuratKopAktif(e.target.value)}>
              <option value="true">Ya, tampilkan kop surat</option>
              <option value="false">Tidak, tanpa kop surat</option>
            </Select>
          </FormRow>
          <Button color="primary" disabled={isSaving} onClick={() => bulkSave([{ key: 'KOP_SURAT_AKTIF', groupName: 'PERSURATAN', value: suratKopAktif }])} style={{ marginTop: '0.75rem' }}>
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Kop'}
          </Button>
        </SectionCard>

        <SectionCard title="Kelola Persuratan Lanjutan">
          <div className={styles.linkGrid}>
            <ExternalLink to="/admin/surat/blanko" label="Blanko Surat" description="Template kop & header surat" />
            <ExternalLink to="/admin/surat/templates" label="Template Surat" description="Template per jenis layanan" />
            <ExternalLink to="/admin/surat/penandatangan" label="Penandatangan" description="Pejabat penandatangan surat" />
            <ExternalLink to="/admin/surat/penomoran" label="Penomoran Surat" description="Konfigurasi nomor per layanan" />
          </div>
        </SectionCard>
      </>
    );
  };

  // 3. Pengguna
  const renderPengguna = () => (
    <>
      <SectionCard title="Pendaftaran Mandiri Warga" subtitle="Apakah warga dapat membuat akun sendiri melalui portal">
        <FormRow label="Izinkan Pendaftaran Mandiri" help="Jika dimatikan, halaman /register mengembalikan 403">
          <Select value={pendaftaranMandiri} onChange={e => setPendaftaranMandiri(e.target.value)}>
            <option value="true">Ya, warga bisa daftar sendiri</option>
            <option value="false">Tidak, hanya admin yang bisa buat akun</option>
          </Select>
        </FormRow>
        <FormRow label="Role Default Warga Baru">
          <Input value={defaultRole} onChange={e => setDefaultRole(e.target.value)} placeholder="WARGA" />
        </FormRow>
        <Button color="primary" disabled={isSaving} onClick={() => bulkSave([
          { key: 'PENDAFTARAN_MANDIRI', groupName: 'USERS', value: pendaftaranMandiri },
          { key: 'DEFAULT_WARGA_ROLE', groupName: 'USERS', value: defaultRole },
        ])} style={{ marginTop: '0.75rem' }}>
          {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Pengguna'}
        </Button>
      </SectionCard>
      <SectionCard title="Manajemen Akun & Role">
        <div className={styles.linkGrid}>
          <ExternalLink to="/admin/sistem/user-management" label="Kelola Pengguna & Role" description="Tambah/edit akun staf, atur role & permission" />
          <ExternalLink to="/admin/sistem/activity-log" label="Audit Log" description="Rekam jejak seluruh aktivitas admin" />
        </div>
      </SectionCard>
    </>
  );

  // 4. Notifikasi WA
  const renderNotifikasi = () => {
    const waStatus = getConfigValue('WA_GATEWAY_STATUS');
    return (
      <>
        <SectionCard title="WhatsApp Gateway (Fonnte)" subtitle="Konfigurasi API Key dan status koneksi gateway">
          <div className={styles.statusIndicator}>
            <Badge color={waStatus === 'CONNECTED' ? 'success' : 'error'}>
              {waStatus === 'CONNECTED' ? 'Terhubung' : 'Tidak Terhubung'}
            </Badge>
            <small style={{ marginLeft: 8 }}>{waStatus === 'CONNECTED' ? 'Gateway aktif' : 'Masukkan API Key Fonnte yang valid'}</small>
          </div>
          <FormRow label="Fonnte API Key" help="Dari dashboard Fonnte: Devices > Copy Token">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Input type="password" value={fonntKey} onChange={e => setFonntKey(e.target.value)} placeholder="API Key Fonnte..." style={{ flex: 1 }} />
              <Button color="outline" disabled={isSaving} onClick={() => bulkSave([{ key: 'FONNTE_API_KEY', groupName: 'NOTIFICATION', value: fonntKey }])}>Simpan</Button>
            </div>
          </FormRow>
          {waTestResult && (
            <div className={styles.testResult} data-success={waTestResult.connected}>
              {waTestResult.connected ? 'OK' : 'Gagal'}: {waTestResult.message}
            </div>
          )}
          <Button color="primary" disabled={waTestLoading} onClick={testWaConnection} style={{ marginTop: '0.5rem' }}>
            {waTestLoading ? 'Menguji koneksi...' : 'Test Koneksi WA Gateway'}
          </Button>
        </SectionCard>

        <SectionCard title="Template Pesan Notifikasi" subtitle="Template WA yang dikirim otomatis ke pemohon">
          <FormRow label="Template: Permohonan Berhasil Diajukan" help="Placeholder: {nama}, {jenis_surat}">
            <textarea className={styles.textarea} value={waTemplateSubmit} onChange={e => setWaTemplateSubmit(e.target.value)} rows={3} />
          </FormRow>
          {waTemplateSubmit && (
            <div className={styles.previewBox}>
              <small>Preview:</small>
              <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                {waTemplateSubmit.replace('{nama}', 'Budi Santoso').replace('{jenis_surat}', 'Surat Domisili')}
              </div>
            </div>
          )}
          <FormRow label="Template: Permohonan Selesai" help="Dikirim saat surat sudah selesai diproses">
            <textarea className={styles.textarea} value={waTemplateSelesai} onChange={e => setWaTemplateSelesai(e.target.value)} rows={3} style={{ marginTop: '0.5rem' }} />
          </FormRow>
          <Button color="primary" disabled={isSaving} onClick={() => bulkSave([
            { key: 'TEMPLATE_WA_SUBMIT', groupName: 'NOTIFICATION', value: waTemplateSubmit },
            { key: 'TEMPLATE_WA_SELESAI', groupName: 'NOTIFICATION', value: waTemplateSelesai },
          ])} style={{ marginTop: '0.75rem' }}>
            {isSaving ? 'Menyimpan...' : 'Simpan Template WA'}
          </Button>
        </SectionCard>
      </>
    );
  };

  // 5. Keamanan
  const renderKeamanan = () => (
    <>
      <SectionCard title="Batas Login & Sesi" subtitle="Pengaturan keamanan autentikasi akun admin">
        <div className={styles.formGrid}>
          <FormRow label="Maks Percobaan Login" help="Akun dikunci sementara setelah melewati batas ini">
            <Input type="number" value={maxLogin} onChange={e => setMaxLogin(e.target.value)} style={{ maxWidth: 120 }} min={3} max={20} />
          </FormRow>
          <FormRow label="Sesi Expired (Menit)" help="Token login akan expired setelah durasi ini">
            <Input type="number" value={sessionExpire} onChange={e => setSessionExpire(e.target.value)} style={{ maxWidth: 120 }} min={30} />
          </FormRow>
        </div>
        <Button color="primary" disabled={isSaving} onClick={() => bulkSave([
          { key: 'MAX_LOGIN_ATTEMPTS', groupName: 'SECURITY', value: maxLogin },
          { key: 'SESSION_EXPIRE_MINUTES', groupName: 'SECURITY', value: sessionExpire },
        ])} style={{ marginTop: '0.75rem' }}>
          {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Keamanan'}
        </Button>
        <p className={styles.hint}>Efek: Middleware auth backend membaca nilai ini saat validasi setiap login dan token.</p>
      </SectionCard>
      <SectionCard title="Audit Trail">
        <ExternalLink to="/admin/sistem/activity-log" label="Lihat Audit Log" description="Filter berdasarkan waktu, pengguna, dan jenis aksi" />
      </SectionCard>
    </>
  );

  // 7. Backup & Maintenance
  const renderBackup = () => (
    <>
      <SectionCard title="Mode Maintenance" subtitle="Saat aktif, pengunjung non-admin diarahkan ke halaman maintenance">
        <div className={styles.statusIndicator}>
          <Badge color={maintenanceMode === 'true' ? 'error' : 'success'}>
            {maintenanceMode === 'true' ? 'Maintenance AKTIF' : 'Sistem Normal'}
          </Badge>
        </div>
        <FormRow label="Status Mode Maintenance">
          <Select value={maintenanceMode} onChange={e => setMaintenanceMode(e.target.value)}>
            <option value="false">Nonaktif</option>
            <option value="true">Aktif (maintenance)</option>
          </Select>
        </FormRow>
        <FormRow label="Pesan Maintenance">
          <textarea className={styles.textarea} value={maintenanceMsg} onChange={e => setMaintenanceMsg(e.target.value)} rows={3} />
        </FormRow>
        <Button color="primary" disabled={isSaving} onClick={() => bulkSave([
          { key: 'MAINTENANCE_MODE', groupName: 'SYSTEM', value: maintenanceMode },
          { key: 'MAINTENANCE_MESSAGE', groupName: 'SYSTEM', value: maintenanceMsg },
        ])} style={{ marginTop: '0.75rem' }}>
          {isSaving ? 'Menyimpan...' : 'Simpan Mode Maintenance'}
        </Button>
        <p className={styles.hint}>Efek: Middleware backend memeriksa flag ini setiap request dari non-admin.</p>
      </SectionCard>

      <SectionCard title="Status Kesehatan Sistem">
        {systemStatus ? (
          <div className={styles.statusGrid}>
            {[
              { label: 'Database', ok: systemStatus.database.status === 'OK', sub: systemStatus.database.label },
              { label: 'WhatsApp Gateway', ok: systemStatus.whatsapp.status === 'CONNECTED', sub: systemStatus.whatsapp.label },
              { label: 'Backup Terakhir', ok: !!systemStatus.backup.lastDate, sub: systemStatus.backup.label },
              { label: 'Uptime Server', ok: true, sub: `${systemStatus.system.uptimeLabel} | ${systemStatus.system.memoryMb} MB RAM` },
            ].map(item => (
              <div key={item.label} className={styles.statusItem} data-ok={item.ok}>
                <span className={styles.statusIcon}>{item.ok ? 'OK' : 'WARN'}</span>
                <div><strong>{item.label}</strong><small>{item.sub}</small></div>
              </div>
            ))}
          </div>
        ) : <LoadingState message="Memuat status sistem..." />}
        <Button color="outline" onClick={() => {
          setSystemStatus(null);
          safeFetchJson(`${API_URL}/config/system-status`, { headers: { Authorization: `Bearer ${token}` } })
            .then(data => { if (data.success) setSystemStatus(data.data); });
        }} style={{ marginTop: '1rem' }}>
          Refresh Status
        </Button>
      </SectionCard>
    </>
  );

  // 8. Keuangan
  const renderKeuangan = () => (
    <>
      <SectionCard title="Tahun Anggaran & Format Laporan" subtitle="Dashboard keuangan menampilkan data sesuai tahun anggaran ini">
        <div className={styles.formGrid}>
          <FormRow label="Tahun Anggaran Aktif">
            <Input type="number" value={tahunAnggaranAktif} onChange={e => setTahunAnggaranAktif(e.target.value)} style={{ maxWidth: 140 }} min={2020} max={2099} />
          </FormRow>
          <FormRow label="Format Laporan Keuangan">
            <Select value={formatLaporan} onChange={e => setFormatLaporan(e.target.value)}>
              <option value="RINGKAS">Ringkas</option>
              <option value="DETAIL">Detail</option>
            </Select>
          </FormRow>
        </div>
        <Button color="primary" disabled={isSaving} onClick={() => bulkSave([
          { key: 'TAHUN_ANGGARAN_AKTIF', groupName: 'FINANCE', value: tahunAnggaranAktif },
          { key: 'FORMAT_LAPORAN', groupName: 'FINANCE', value: formatLaporan },
        ])} style={{ marginTop: '0.75rem' }}>
          {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Keuangan'}
        </Button>
        <p className={styles.hint}>Efek: Modul APBDes dan Kas Umum memfilter data berdasarkan tahun ini.</p>
      </SectionCard>
      <SectionCard title="Pengelolaan Keuangan">
        <div className={styles.linkGrid}>
          <ExternalLink to="/admin/keuangan/apbdes-entry" label="APBDes" description="Rencana Anggaran Pendapatan & Belanja Desa" />
          <ExternalLink to="/admin/keuangan/kas-umum" label="Kas Umum" description="Buku Kas Umum & Realisasi" />
          <ExternalLink to="/admin/keuangan/buku-bank" label="Buku Bank" description="Rekening bank & rekonsiliasi" />
          <ExternalLink to="/admin/konten/transparansi" label="Transparansi APBDes" description="Data yang dipublikasikan ke portal" />
        </div>
      </SectionCard>
    </>
  );

  // 10. Kesehatan
  const renderKesehatan = () => (
    <>
      <SectionCard title="Pengaturan Posyandu" subtitle="Jadwal dan pengingat WA otomatis">
        <FormRow label="Jadwal Posyandu Default" help="Contoh: Setiap tanggal 15">
          <Input value={jadwalPosyandu} onChange={e => setJadwalPosyandu(e.target.value)} placeholder="Setiap tanggal 15" />
        </FormRow>
        <FormRow label="Pengingat WA H-berapa hari" help="Cron job kirim WA H-N sebelum jadwal ke bumil/balita terdaftar">
          <Input type="number" value={pengingatHmin} onChange={e => setPengingatHmin(e.target.value)} style={{ maxWidth: 120 }} min={0} max={7} />
        </FormRow>
        <Button color="primary" disabled={isSaving} onClick={() => bulkSave([
          { key: 'JADWAL_POSYANDU_DEFAULT', groupName: 'HEALTH', value: jadwalPosyandu },
          { key: 'PENGINGAT_POSYANDU_HMIN', groupName: 'HEALTH', value: pengingatHmin },
        ])} style={{ marginTop: '0.75rem' }}>
          {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Kesehatan'}
        </Button>
        <p className={styles.hint}>Efek: Cron job backend menggunakan jadwal ini untuk mengirim pengingat WA via gateway yang dikonfigurasi di tab Notifikasi.</p>
      </SectionCard>
      <SectionCard title="Standar Gizi">
        <div className={styles.infoBox}>
          <p>Sistem menggunakan <strong>WHO Child Growth Standards 2006</strong>. Parameter tidak dapat diedit manual.</p>
        </div>
      </SectionCard>
      <SectionCard title="Kelola Data Kesehatan">
        <div className={styles.linkGrid}>
          <ExternalLink to="/admin/kesehatan/posyandu" label="Data Posyandu" description="Kunjungan & pengukuran" />
          <ExternalLink to="/admin/kesehatan/bumil" label="Data Ibu Hamil" description="Daftar bumil terdaftar" />
        </div>
      </SectionCard>
    </>
  );

  // 11. Portal Publik
  const renderPortal = () => (
    <>
      <SectionCard title="Tampilan Portal Publik" subtitle="Pengaturan visual portal masyarakat">
        <div className={styles.formGrid}>
          <FormRow label="Warna Tema Utama (hex)" help="Warna primer tombol dan aksen portal">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="color" value={temaWarna} onChange={e => setTemaWarna(e.target.value)} style={{ width: 48, height: 36, padding: 2, borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer' }} />
              <Input value={temaWarna} onChange={e => setTemaWarna(e.target.value)} placeholder="#10b981" style={{ maxWidth: 140 }} />
            </div>
          </FormRow>
          <FormRow label="Status Visibilitas Portal">
            <Select value={statusPortal} onChange={e => setStatusPortal(e.target.value)}>
              <option value="PUBLIK">Publik</option>
              <option value="PRIVAT">Privat (hanya admin)</option>
            </Select>
          </FormRow>
        </div>
        <FormRow label="URL Hero Image" help="Gambar besar di halaman utama portal">
          <Input value={heroImageUrl} onChange={e => setHeroImageUrl(e.target.value)} placeholder="https://..." />
        </FormRow>
        {heroImageUrl && (
          <div className={styles.logoPreview}>
            <img src={heroImageUrl} alt="Hero preview" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', marginTop: 8, borderRadius: 8 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}
        <Button color="primary" disabled={isSaving} onClick={() => bulkSave([
          { key: 'TEMA_WARNA_UTAMA', groupName: 'PORTAL', value: temaWarna },
          { key: 'HERO_IMAGE_URL', groupName: 'PORTAL', value: heroImageUrl },
          { key: 'STATUS_PORTAL', groupName: 'PORTAL', value: statusPortal },
        ])} style={{ marginTop: '0.75rem' }}>
          {isSaving ? 'Menyimpan...' : 'Simpan Tampilan Portal'}
        </Button>
        <p className={styles.hint}>Efek: Warna tema diterapkan pada CSS variabel portal. Logo & nama sinkron otomatis dari Identitas Desa.</p>
      </SectionCard>
      <SectionCard title="Konten Portal">
        <div className={styles.linkGrid}>
          <ExternalLink to="/admin/konten/berita" label="Berita & Pengumuman" description="Terbitkan, edit, arsipkan berita" />
          <ExternalLink to="/admin/konten/agenda" label="Agenda Desa" description="Jadwal kegiatan" />
          <ExternalLink to="/admin/konten/halaman" label="Halaman Statis" description="Profil, visi-misi, dll" />
          <ExternalLink to="/admin/konten/media" label="Galeri Media" description="Foto dan file media" />
          <ExternalLink to="/admin/konten/umkm" label="UMKM" description="Daftar UMKM desa" />
          <ExternalLink to="/admin/konten/potensi" label="Potensi Desa" description="Potensi unggulan desa" />
        </div>
      </SectionCard>
    </>
  );

  // 12. Bansos & Aduan
  const renderBansos = () => (
    <>
      <SectionCard title="Saran & Aduan Masyarakat">
        <FormRow label="Teks Auto-Reply Aduan" help="Dikirim otomatis saat aduan diterima (via WA/email jika gateway aktif)">
          <textarea className={styles.textarea} value={autoReplyAduan} onChange={e => setAutoReplyAduan(e.target.value)} rows={3} placeholder="Terima kasih, aduan Anda telah kami terima..." />
        </FormRow>
        <Button color="primary" disabled={isSaving} onClick={() => bulkSave([
          { key: 'AUTO_REPLY_ADUAN', groupName: 'SOSIAL', value: autoReplyAduan },
        ])} style={{ marginTop: '0.75rem' }}>
          {isSaving ? 'Menyimpan...' : 'Simpan Auto-Reply'}
        </Button>
      </SectionCard>
      <SectionCard title="Batas Pengajuan Bantuan Sosial">
        <FormRow label="Maks Pengajuan Bansos per KK" help="Sistem menolak pengajuan jika KK sudah melebihi batas">
          <Input type="number" value={maksBansos} onChange={e => setMaksBansos(e.target.value)} style={{ maxWidth: 120 }} min={1} max={10} />
        </FormRow>
        <Button color="primary" disabled={isSaving} onClick={() => bulkSave([
          { key: 'MAKSIMAL_BANSOS_PER_KK', groupName: 'SOSIAL', value: maksBansos },
        ])} style={{ marginTop: '0.75rem' }}>
          {isSaving ? 'Menyimpan...' : 'Simpan Batas Bansos'}
        </Button>
        <p className={styles.hint}>Efek: Validasi di backend menolak pengajuan yang melebihi batas per KK.</p>
      </SectionCard>
      <SectionCard title="Kelola Bansos & Aduan">
        <div className={styles.linkGrid}>
          <ExternalLink to="/admin/pemerintahan/saran" label="Saran & Aduan" description="Tindak lanjut aduan masyarakat" />
          <ExternalLink to="/admin/pemerintahan/bansos" label="Bantuan Sosial" description="Data penerima & jenis bansos" />
        </div>
      </SectionCard>
    </>
  );

  // ------------------------------------------
  // Tab router
  // ------------------------------------------
  const renderTabContent = () => {
    if (configLoading) return <LoadingState message="Memuat pengaturan..." fullPage />;
    if (configError) return <ErrorState title="Gagal Memuat" message={configError} onRetry={fetchConfigs} />;
    
    const tabRenderers: Record<string, () => React.ReactNode> = {
      identitas: renderIdentitas,
      persuratan: renderPersuratan,
      pengguna: renderPengguna,
      notifikasi: renderNotifikasi,
      keamanan: renderKeamanan,
      backup: renderBackup,
      keuangan: renderKeuangan,
      kesehatan: renderKesehatan,
      portal: renderPortal,
      bansos: renderBansos,
    };

    const renderFn = tabRenderers[activeTab];
    return renderFn ? renderFn() : null;
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Pengaturan Sistem</h1>
          <p className={styles.subtitle}>Kelola konfigurasi operasional MitraDesa</p>
        </div>
        {saveMessage && <div className={styles.saveToast}>{saveMessage}</div>}
        <div className={styles.tabNav}>
          {TABS.map(tab => (
            <button key={tab.id} className={activeTab === tab.id ? styles.tabActive : styles.tab} onClick={() => navigate(`#${tab.id}`)} title={tab.label}>
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className={styles.content}>{renderTabContent()}</div>
      </div>
    </AdminLayout>
  );
}
