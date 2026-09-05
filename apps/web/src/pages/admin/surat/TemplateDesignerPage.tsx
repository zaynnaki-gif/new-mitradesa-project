import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import styles from './TemplateDesignerPage.module.css';
import { safeFetchJson } from '@/lib/fetch';

type ElementType = 'text' | 'field' | 'divider' | 'spacer' | 'page_break';

interface Element {
  id: string;
  type: ElementType;
  content?: string;
  binding?: string;
  label?: string;
  formatter?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: string;
  lineHeight?: number;
  height?: number;
  style?: string;
  thickness?: number;
  /** 'inline' = "Label: Nilai", 'column' = 3-kolom standar surat dinas */
  layout?: 'inline' | 'column';
  /** Lebar kolom label dalam mm (default 45) untuk layout column */
  labelWidth?: number;
}

interface TemplateVersion {
  id: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  content: {
    metadata: { name: string; description?: string };
    elements: Element[];
  };
  kopConfig?: Record<string, unknown>;
  signatureConfig?: Record<string, unknown>;
  createdAt: string;
  creator?: { username: string };
}

interface BindingOption {
  path: string;
  category: string;
  label: string;
}

interface FormatterOption {
  name: string;
  label: string;
}



export interface KopConfigState {
  pemdaVisible: boolean;
  pemdaText: string;
  kecamatanVisible: boolean;
  kecamatanText: string;
  desaVisible: boolean;
  desaText: string;
  alamatVisible: boolean;
  alamatText: string;
  dividerStyle: 'double' | 'single' | 'none';
  logoDesaVisible: boolean;
  logoKabupatenVisible: boolean;
}

export interface SignatureConfigState {
  mode: 'online_tte' | 'offline_physical';
  dateLocation: string;
  officialTitle: string;
  officialName: string;
  officialNip: string;
  applicantTitle: string;
  applicantName: string;
  showStampSpace: boolean;
  enableQrCode: boolean;
}

const defaultKopConfig: KopConfigState = {
  pemdaVisible: true,
  pemdaText: 'PEMERINTAH KABUPATEN LOMBOK TIMUR',
  kecamatanVisible: true,
  kecamatanText: 'KECAMATAN PRINGGABAYA',
  desaVisible: true,
  desaText: 'DESA SERUNI MUMBUL',
  alamatVisible: true,
  alamatText: 'Jalan Raya Labuhan Lombok Km. 7 Kode Pos 83654 | Email: desa.serunimumbul@mitradesa.id',
  dividerStyle: 'double',
  logoDesaVisible: true,
  logoKabupatenVisible: true,
};

const defaultSignatureConfig: SignatureConfigState = {
  mode: 'online_tte',
  dateLocation: 'Seruni Mumbul, ......................... 20...',
  officialTitle: 'Kepala Desa Seruni Mumbul',
  officialName: 'H. Tajuddin',
  officialNip: '197508122005011003',
  applicantTitle: 'Yang Menyatakan / Pemohon,',
  applicantName: '',
  showStampSpace: true,
  enableQrCode: true,
};

export default function TemplateDesignerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuthStore();

  const [version, setVersion] = useState<TemplateVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [elements, setElements] = useState<Element[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const [kopConfig, setKopConfig] = useState<KopConfigState>(defaultKopConfig);
  const [signatureConfig, setSignatureConfig] = useState<SignatureConfigState>(defaultSignatureConfig);

  const [bindings, setBindings] = useState<BindingOption[]>([]);
  const [formatters, setFormatters] = useState<FormatterOption[]>([]);

  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showKopEditor, setShowKopEditor] = useState(false);
  const [showSignatory, setShowSignatory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('DEVELOPER');

  const applyPreset = (presetType: 'keterangan' | 'pengantar' | 'domisili_usaha') => {
    const genId = () => Math.random().toString(36).substring(2, 9);
    let newElements: Element[] = [];

    if (presetType === 'keterangan') {
      newElements = [
        {
          id: genId(),
          type: 'text',
          content: 'SURAT KETERANGAN',
          fontSize: 12,
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: 1.3,
        },
        {
          id: genId(),
          type: 'text',
          content: 'Nomor: 470 / ........ / 20...',
          fontSize: 10,
          fontWeight: 'normal',
          textAlign: 'center',
          lineHeight: 1.3,
        },
        {
          id: genId(),
          type: 'spacer',
          height: 12,
        },
        {
          id: genId(),
          type: 'text',
          content: 'Yang bertanda tangan di bawah ini Kepala Desa Seruni Mumbul, Kecamatan Pringgabaya, Kabupaten Lombok Timur, dengan ini menerangkan bahwa:',
          fontSize: 11,
          fontWeight: 'normal',
          textAlign: 'justify',
          lineHeight: 1.4,
        },
        {
          id: genId(),
          type: 'spacer',
          height: 6,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'penduduk.namaLengkap',
          label: 'Nama Lengkap',
          fontSize: 11,
          layout: 'column',
          labelWidth: 45,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'penduduk.nik',
          label: 'NIK',
          fontSize: 11,
          layout: 'column',
          labelWidth: 45,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'penduduk.tempatTanggalLahir',
          label: 'Tempat/Tgl Lahir',
          fontSize: 11,
          layout: 'column',
          labelWidth: 45,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'penduduk.jenisKelamin',
          label: 'Jenis Kelamin',
          fontSize: 11,
          layout: 'column',
          labelWidth: 45,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'penduduk.agama',
          label: 'Agama',
          fontSize: 11,
          layout: 'column',
          labelWidth: 45,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'penduduk.pekerjaan',
          label: 'Pekerjaan',
          fontSize: 11,
          layout: 'column',
          labelWidth: 45,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'penduduk.alamat',
          label: 'Alamat / Tempat Tinggal',
          fontSize: 11,
          layout: 'column',
          labelWidth: 45,
        },
        {
          id: genId(),
          type: 'spacer',
          height: 8,
        },
        {
          id: genId(),
          type: 'text',
          content: 'Orang tersebut di atas adalah benar-benar warga penduduk Desa Seruni Mumbul yang berdomisili di alamat tersebut dan menurut catatan kami berkelakuan baik.',
          fontSize: 11,
          fontWeight: 'normal',
          textAlign: 'justify',
          lineHeight: 1.4,
        },
        {
          id: genId(),
          type: 'spacer',
          height: 6,
        },
        {
          id: genId(),
          type: 'text',
          content: 'Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.',
          fontSize: 11,
          fontWeight: 'normal',
          textAlign: 'justify',
          lineHeight: 1.4,
        },
      ];
    } else if (presetType === 'domisili_usaha') {
      newElements = [
        {
          id: genId(),
          type: 'text',
          content: 'SURAT KETERANGAN DOMISILI USAHA',
          fontSize: 12,
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: 1.3,
        },
        {
          id: genId(),
          type: 'text',
          content: 'Nomor: 510 / ........ / 20...',
          fontSize: 10,
          fontWeight: 'normal',
          textAlign: 'center',
          lineHeight: 1.3,
        },
        {
          id: genId(),
          type: 'spacer',
          height: 12,
        },
        {
          id: genId(),
          type: 'text',
          content: 'Yang bertanda tangan di bawah ini Kepala Desa Seruni Mumbul, Kecamatan Pringgabaya, Kabupaten Lombok Timur, menerangkan dengan sebenarnya bahwa:',
          fontSize: 11,
          fontWeight: 'normal',
          textAlign: 'justify',
          lineHeight: 1.4,
        },
        {
          id: genId(),
          type: 'spacer',
          height: 6,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'penduduk.namaLengkap',
          label: 'Nama Pemilik',
          fontSize: 11,
          layout: 'column',
          labelWidth: 48,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'penduduk.nik',
          label: 'NIK',
          fontSize: 11,
          layout: 'column',
          labelWidth: 48,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'penduduk.alamat',
          label: 'Alamat Pemilik',
          fontSize: 11,
          layout: 'column',
          labelWidth: 48,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'formData.namaUsaha',
          label: 'Nama Usaha',
          fontSize: 11,
          layout: 'column',
          labelWidth: 48,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'formData.jenisUsaha',
          label: 'Jenis / Bidang Usaha',
          fontSize: 11,
          layout: 'column',
          labelWidth: 48,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'formData.alamatUsaha',
          label: 'Alamat / Lokasi Usaha',
          fontSize: 11,
          layout: 'column',
          labelWidth: 48,
        },
        {
          id: genId(),
          type: 'spacer',
          height: 8,
        },
        {
          id: genId(),
          type: 'text',
          content: 'Bahwa usaha tersebut di atas benar-benar berlokasi dan beroperasi di wilayah Desa Seruni Mumbul, Kecamatan Pringgabaya, Kabupaten Lombok Timur hingga saat surat ini dikeluarkan.',
          fontSize: 11,
          fontWeight: 'normal',
          textAlign: 'justify',
          lineHeight: 1.4,
        },
        {
          id: genId(),
          type: 'spacer',
          height: 6,
        },
        {
          id: genId(),
          type: 'text',
          content: 'Demikian surat keterangan domisili usaha ini diberikan untuk dapat dipergunakan sebagai kelengkapan persyaratan administrasi perizinan usaha.',
          fontSize: 11,
          fontWeight: 'normal',
          textAlign: 'justify',
          lineHeight: 1.4,
        },
      ];
    } else {
      newElements = [
        {
          id: genId(),
          type: 'text',
          content: 'SURAT PENGANTAR',
          fontSize: 12,
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: 1.3,
        },
        {
          id: genId(),
          type: 'text',
          content: 'Nomor: 470 / ........ / 20...',
          fontSize: 10,
          fontWeight: 'normal',
          textAlign: 'center',
          lineHeight: 1.3,
        },
        {
          id: genId(),
          type: 'spacer',
          height: 12,
        },
        {
          id: genId(),
          type: 'text',
          content: 'Yang bertanda tangan di bawah ini Kepala Desa Seruni Mumbul, Kecamatan Pringgabaya, Kabupaten Lombok Timur, memberikan pengantar kepada:',
          fontSize: 11,
          fontWeight: 'normal',
          textAlign: 'justify',
          lineHeight: 1.4,
        },
        {
          id: genId(),
          type: 'spacer',
          height: 6,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'penduduk.namaLengkap',
          label: 'Nama Lengkap',
          fontSize: 11,
          layout: 'column',
          labelWidth: 45,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'penduduk.nik',
          label: 'NIK',
          fontSize: 11,
          layout: 'column',
          labelWidth: 45,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'penduduk.tempatTanggalLahir',
          label: 'Tempat/Tgl Lahir',
          fontSize: 11,
          layout: 'column',
          labelWidth: 45,
        },
        {
          id: genId(),
          type: 'field',
          binding: 'penduduk.alamat',
          label: 'Alamat',
          fontSize: 11,
          layout: 'column',
          labelWidth: 45,
        },
        {
          id: genId(),
          type: 'spacer',
          height: 8,
        },
        {
          id: genId(),
          type: 'text',
          content: 'Surat pengantar ini diberikan untuk keperluan pengurusan administrasi pada instansi yang bersangkutan.',
          fontSize: 11,
          fontWeight: 'normal',
          textAlign: 'justify',
          lineHeight: 1.4,
        },
        {
          id: genId(),
          type: 'spacer',
          height: 6,
        },
        {
          id: genId(),
          type: 'text',
          content: 'Demikian surat pengantar ini diberikan agar pihak yang berkepentingan maklum adanya.',
          fontSize: 11,
          fontWeight: 'normal',
          textAlign: 'justify',
          lineHeight: 1.4,
        },
      ];
    }

    setElements(newElements);
    setShowPresetModal(false);
    setSuccessMessage(`Berhasil memuat preset: ${presetType === 'keterangan' ? 'Surat Keterangan Umum' : presetType === 'domisili_usaha' ? 'Surat Keterangan Domisili Usaha' : 'Surat Pengantar'}`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const loadVersion = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError('');
    try {
      const data = await safeFetchJson(`${API_URL}/template-designer/versions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setVersion(data.data);

      const content = data.data.content;
      if (content?.elements && Array.isArray(content.elements)) {
        setElements(content.elements);
      } else {
        setElements([]);
      }

      if (data.data.kopConfig) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const k = data.data.kopConfig as any;
        const inst = k.institutionNames || {};
        setKopConfig({
          pemdaVisible: inst.pemda?.visible !== false,
          pemdaText: inst.pemda?.text || defaultKopConfig.pemdaText,
          kecamatanVisible: inst.kecamatan?.visible !== false,
          kecamatanText: inst.kecamatan?.text || defaultKopConfig.kecamatanText,
          desaVisible: inst.desa?.visible !== false,
          desaText: inst.desa?.text || defaultKopConfig.desaText,
          alamatVisible: k.addressBlock?.enabled !== false,
          alamatText: (k.addressBlock?.lines && k.addressBlock.lines[0]) || defaultKopConfig.alamatText,
          dividerStyle: k.divider?.style || 'double',
          logoDesaVisible: k.logoDesa?.visible !== false,
          logoKabupatenVisible: k.logoKabupaten?.visible !== false,
        });
      }

      if (data.data.signatureConfig) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = data.data.signatureConfig as any;
        setSignatureConfig({
          mode: s.mode || 'online_tte',
          dateLocation: s.dateLocation || defaultSignatureConfig.dateLocation,
          officialTitle: s.title?.text || s.signatory?.title || defaultSignatureConfig.officialTitle,
          officialName: s.signatory?.name || defaultSignatureConfig.officialName,
          officialNip: s.signatory?.nip || defaultSignatureConfig.officialNip,
          applicantTitle: s.applicantTitle || defaultSignatureConfig.applicantTitle,
          applicantName: s.applicantName || defaultSignatureConfig.applicantName,
          showStampSpace: s.showStampSpace !== false,
          enableQrCode: s.qrCode?.enabled !== false,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  const loadRegistry = useCallback(async () => {
    try {
      const data = await safeFetchJson(`${API_URL}/template-designer/registry`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBindings(data.data?.bindings || []);
      setFormatters(data.data?.formatters || []);
    } catch {
      console.error('Failed to load registry');
    }
  }, [token]);

  useEffect(() => {
    loadVersion();
    loadRegistry();
  }, [loadVersion, loadRegistry]);

  const addElement = (type: ElementType) => {
    const newElement: Element = {
      id: crypto.randomUUID(),
      type,
    };

    switch (type) {
      case 'text':
        newElement.content = 'Teks baru';
        newElement.fontSize = 11;
        newElement.fontWeight = 'normal';
        newElement.textAlign = 'justify'; // default justify sesuai standar surat resmi
        newElement.lineHeight = 1.5;
        break;
      case 'field':
        newElement.binding = 'penduduk.namaLengkap';
        newElement.label = '';
        newElement.fontSize = 11;
        newElement.textAlign = 'left';
        newElement.layout = 'column'; // default 3-kolom standar surat dinas
        newElement.labelWidth = 45;  // 45mm lebar label
        break;
      case 'divider':
        newElement.style = 'solid';
        newElement.thickness = 1;
        break;
      case 'spacer':
        newElement.height = 20;
        break;
    }

    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const updateElement = (elementId: string, updates: Partial<Element>) => {
    setElements(
      elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = (elementId: string) => {
    setElements(elements.filter((el) => el.id !== elementId));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  const moveElement = (elementId: string, direction: 'up' | 'down') => {
    const index = elements.findIndex((el) => el.id === elementId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= elements.length) return;

    const newElements = [...elements];
    [newElements[index], newElements[newIndex]] = [newElements[newIndex], newElements[index]];
    setElements(newElements);
  };

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    setError('');
    try {
      const content = {
        metadata: {
          name: version?.content?.metadata?.name || 'Template',
          description: '',
          createdAt: new Date().toISOString(),
          version: version?.version || 1,
        },
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        elements,
      };

      const formattedKopConfig = {
        institutionNames: {
          pemda: { visible: kopConfig.pemdaVisible, text: kopConfig.pemdaText },
          kecamatan: { visible: kopConfig.kecamatanVisible, text: kopConfig.kecamatanText },
          desa: { visible: kopConfig.desaVisible, text: kopConfig.desaText },
        },
        addressBlock: {
          enabled: kopConfig.alamatVisible,
          lines: [kopConfig.alamatText],
        },
        divider: {
          style: kopConfig.dividerStyle,
          thickness: kopConfig.dividerStyle === 'single' ? 1.5 : 2,
        },
        logoDesa: {
          visible: kopConfig.logoDesaVisible,
          size: 24,
        },
        logoKabupaten: {
          visible: kopConfig.logoKabupatenVisible,
        },
      };

      const formattedSigConfig = {
        mode: signatureConfig.mode,
        dateLocation: signatureConfig.dateLocation,
        applicantTitle: signatureConfig.applicantTitle,
        applicantName: signatureConfig.applicantName,
        showStampSpace: signatureConfig.showStampSpace,
        title: {
          enabled: true,
          text: signatureConfig.officialTitle,
          align: signatureConfig.mode === 'offline_physical' ? 'center' : 'right',
        },
        signatory: {
          name: signatureConfig.officialName,
          title: signatureConfig.officialTitle,
          nip: signatureConfig.officialNip || undefined,
        },
        qrCode: {
          enabled: signatureConfig.enableQrCode,
        },
      };

      await safeFetchJson(`${API_URL}/template-designer/versions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          kopConfig: formattedKopConfig,
          signatureConfig: formattedSigConfig,
          changelog: 'Update template blanko & format surat',
        }),
      });

      setSuccessMessage('Template & Blanko berhasil disimpan');
      setTimeout(() => setSuccessMessage(''), 3000);

      loadVersion();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPreview = async () => {
    setShowPreview(true);
    setLoadingPreview(true);
    try {
      const data = await safeFetchJson(`${API_URL}/template-designer/versions/${id}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      setPreviewHtml(data.data?.html || '');
    } catch (e) {
      console.error('Failed to load preview:', e);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleValidate = async () => {
    if (!id) return;

    try {
      const data = await safeFetchJson(`${API_URL}/template-designer/versions/${id}/validate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setValidationResult(data.data);
    } catch {
      console.error('Failed to validate');
    }
  };

  const handlePublish = async () => {
    if (!id) return;

    try {
      await safeFetchJson(`${API_URL}/template-designer/versions/${id}/publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccessMessage('Template berhasil dipublikasikan');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadVersion();
    } catch {
      setError('Failed to publish');
    }
  };

  const insertBinding = (path: string, formatter?: string) => {
    if (selectedElementId) {
      updateElement(selectedElementId, { binding: path, formatter });
    } else {
      addElement('field');
    }
    setShowFieldPicker(false);
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  if (authLoading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Memuat data pengguna...</div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className={styles.noAccess}>
          Anda tidak memiliki akses ke halaman ini.
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Memuat template...</div>
      </AdminLayout>
    );
  }

  if (error && !version) {
    return (
      <AdminLayout>
        <div className={styles.error}>{error}</div>
      </AdminLayout>
    );
  }

  const getStatusClass = () => {
    switch (version?.status) {
      case 'PUBLISHED': return styles.statusPublished;
      case 'ARCHIVED': return styles.statusArchived;
      default: return styles.statusDraft;
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={() => navigate('/admin/surat/templates')}>
              ← Kembali
            </button>
            <div className={styles.templateInfo}>
              <h1 className={styles.templateTitle}>
                {version?.content?.metadata?.name || 'Template Designer'}
              </h1>
              <p className={styles.templateMeta}>
                Versi {version?.version} • Status:{' '}
                <span className={`${styles.statusBadge} ${getStatusClass()}`}>
                  {version?.status}
                </span>
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={`${styles.button} ${styles.buttonOutline}`} onClick={handleOpenPreview}>
              Preview
            </button>
            <button className={`${styles.button} ${styles.buttonOutline}`} onClick={handleValidate}>
              Validasi
            </button>
            <button
              className={`${styles.button} ${styles.buttonOutline}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            {version?.status === 'DRAFT' && (
              <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={handlePublish}>
                Publikasi
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            {error}
          </div>
        )}

        {/* Success banner */}
        {successMessage && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            {successMessage}
          </div>
        )}

        {/* Validation result */}
        {validationResult && (
          <div className={`${styles.alert} ${validationResult.valid ? styles.alertSuccess : styles.alertError}`}>
            {validationResult.valid
              ? '✓ Template valid dan siap dipublikasi'
              : `✗ ${validationResult.errors.length} error ditemukan`}
          </div>
        )}

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Left Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarTitle}>Elemen</div>
              <div className={styles.sidebarButtons}>
                <button className={styles.sidebarButton} onClick={() => addElement('text')}>
                  <span>T</span> Teks
                </button>
                <button className={styles.sidebarButton} onClick={() => addElement('field')}>
                  <span>{'{}'}</span> Field Data
                </button>
                <button className={styles.sidebarButton} onClick={() => addElement('divider')}>
                  <span>—</span> Garis
                </button>
                <button className={styles.sidebarButton} onClick={() => addElement('spacer')}>
                  <span>↕</span> Spasi
                </button>
                <button className={styles.sidebarButton} onClick={() => addElement('page_break')}>
                  <span>⏹</span> Page Break
                </button>
              </div>
            </div>

            <div className={styles.sidebarDivider} />

            <div className={styles.sidebarSection}>
              <div className={styles.sidebarTitle}>Konfigurasi</div>
              <div className={styles.sidebarButtons}>
                <button className={styles.sidebarButton} onClick={() => setShowFieldPicker(true)}>
                  📋 Insert Field
                </button>
                <button className={styles.sidebarButton} onClick={() => setShowPresetModal(true)}>
                  ⚡ Muat Format Preset
                </button>
                <button className={styles.sidebarButton} onClick={() => setShowKopEditor(true)}>
                  🏛️ Kop Surat
                </button>
                <button className={styles.sidebarButton} onClick={() => setShowSignatory(true)}>
                  ✍️ Tanda Tangan
                </button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className={styles.canvas}>
            <div className={styles.canvasPaper}>
              <div className={styles.paper}>
                <div className={styles.paperContent}>
                  {/* Canvas WYSIWYG Kop Surat Header */}
                  <div
                    style={{
                      textAlign: 'center',
                      borderBottom: kopConfig.dividerStyle === 'double' ? '3px double #000' : kopConfig.dividerStyle === 'single' ? '1.5px solid #000' : 'none',
                      paddingBottom: '8px',
                      marginBottom: '16px',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onClick={() => setShowKopEditor(true)}
                    title="Klik untuk mengedit Kop Surat"
                  >
                    <div style={{ position: 'absolute', right: 0, top: 0, fontSize: '10px', color: '#4f46e5', background: '#eef2ff', padding: '2px 6px', borderRadius: '4px' }}>
                      Edit Kop ⚙️
                    </div>
                    {kopConfig.pemdaVisible && (
                      <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {kopConfig.pemdaText}
                      </div>
                    )}
                    {kopConfig.kecamatanVisible && (
                      <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {kopConfig.kecamatanText}
                      </div>
                    )}
                    {kopConfig.desaVisible && (
                      <div style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {kopConfig.desaText}
                      </div>
                    )}
                    {kopConfig.alamatVisible && (
                      <div style={{ fontSize: '9px', color: '#4b5563', marginTop: '3px' }}>
                        {kopConfig.alamatText}
                      </div>
                    )}
                  </div>

                  {elements.length === 0 ? (
                    <div className={styles.canvasEmpty}>
                      <p className={styles.canvasEmptyTitle}>
                        Klik elemen di sidebar untuk menambahkan
                      </p>
                      <p className={styles.canvasEmptyHint}>
                        atau gunakan "Insert Field" untuk menambahkan field data
                      </p>
                    </div>
                  ) : (
                    elements.map((element) => (
                      <div
                        key={element.id}
                        className={`${styles.element} ${selectedElementId === element.id ? styles.elementSelected : ''}`}
                        onClick={() => setSelectedElementId(element.id)}
                      >
                        {/* Controls */}
                        <div className={styles.elementControls}>
                          <button
                            className={styles.elementControl}
                            onClick={(e) => { e.stopPropagation(); moveElement(element.id, 'up'); }}
                          >
                            ↑
                          </button>
                          <button
                            className={styles.elementControl}
                            onClick={(e) => { e.stopPropagation(); moveElement(element.id, 'down'); }}
                          >
                            ↓
                          </button>
                          <button
                            className={`${styles.elementControl} ${styles.elementControlDelete}`}
                            onClick={(e) => { e.stopPropagation(); deleteElement(element.id); }}
                          >
                            ✕
                          </button>
                        </div>

                        {/* Element content */}
                        {element.type === 'text' && (
                          <div
                            className={styles.textElement}
                            style={{
                              fontFamily: "'Times New Roman', Times, serif",
                              fontSize: `${element.fontSize || 11}px`,
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              fontWeight: element.fontWeight as any || 'normal',
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              textAlign: element.textAlign as any || 'justify',
                              lineHeight: element.lineHeight || 1.5,
                            }}
                          >
                            {element.content}
                          </div>
                        )}

                        {element.type === 'field' && (
                          <div
                            className={styles.fieldElement}
                            style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: `${element.fontSize || 11}px` }}
                          >
                            {element.layout === 'column' && element.label ? (
                              <div style={{ display: 'flex', lineHeight: '1.4' }}>
                                <span style={{ width: '40%', flexShrink: 0, fontWeight: element.fontWeight || 'normal' }}>{element.label}</span>
                                <span style={{ width: '24px', flexShrink: 0, textAlign: 'center' }}>:</span>
                                <span style={{ flex: 1, color: '#6b7280', fontStyle: 'italic' }}>{element.binding}{element.formatter && ` | ${element.formatter}`}</span>
                              </div>
                            ) : (
                              <>
                                {element.label && <span className={styles.fieldLabel}>{element.label}: </span>}
                                <span className={styles.fieldBinding}>
                                  {element.binding}{element.formatter && ` | ${element.formatter}`}
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {element.type === 'divider' && (
                          <hr
                            className={styles.dividerElement}
                            style={{
                              borderTopWidth: element.thickness || 1,
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              borderStyle: element.style as any || 'solid',
                            }}
                          />
                        )}

                        {element.type === 'spacer' && (
                          <div className={styles.spacerElement} style={{ height: element.height || 20 }} />
                        )}

                        {element.type === 'page_break' && (
                          <div className={styles.pageBreakElement}>
                            — Page Break —
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {/* Canvas WYSIWYG Signature Block */}
                  <div
                    style={{
                      marginTop: '28px',
                      paddingTop: '12px',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onClick={() => setShowSignatory(true)}
                    title="Klik untuk mengedit Konfigurasi Tanda Tangan"
                  >
                    <div style={{ position: 'absolute', right: 0, top: 0, fontSize: '10px', color: '#4f46e5', background: '#eef2ff', padding: '2px 6px', borderRadius: '4px' }}>
                      Edit Tanda Tangan ⚙️
                    </div>

                    {signatureConfig.mode === 'offline_physical' ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '10px' }}>
                        <div style={{ width: '45%', textAlign: 'center' }}>
                          <div style={{ height: '16px' }}></div>
                          <div style={{ fontWeight: 'bold' }}>{signatureConfig.applicantTitle}</div>
                          <div style={{ height: '55px' }}></div>
                          <div style={{ fontWeight: 'bold' }}>
                            {signatureConfig.applicantName ? `( ${signatureConfig.applicantName} )` : '( .................................................... )'}
                          </div>
                        </div>
                        <div style={{ width: '45%', textAlign: 'center' }}>
                          <div>{signatureConfig.dateLocation}</div>
                          <div style={{ fontWeight: 'bold', marginTop: '2px' }}>{signatureConfig.officialTitle}</div>
                          <div style={{ height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {signatureConfig.showStampSpace && (
                              <div style={{ border: '1px dashed #9ca3af', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: '#6b7280' }}>
                                [ STEMPEL ]
                              </div>
                            )}
                          </div>
                          <div style={{ fontWeight: 'bold' }}>
                            {signatureConfig.officialName ? `( ${signatureConfig.officialName} )` : '( .................................................... )'}
                          </div>
                          {signatureConfig.officialNip && (
                            <div style={{ fontSize: '9.5px', color: '#4b5563', marginTop: '2px' }}>
                              NIP. {signatureConfig.officialNip}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px', marginTop: '10px' }}>
                        <div style={{ width: '35%' }}>
                          {signatureConfig.enableQrCode && (
                            <div style={{ display: 'inline-block', padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#f9fafb', fontSize: '8px', color: '#4b5563', textAlign: 'center' }}>
                              <div style={{ width: '44px', height: '44px', margin: '0 auto', background: '#e5e7eb', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '8px', color: '#374151' }}>
                                QR CODE
                              </div>
                              <div style={{ marginTop: '2px', fontSize: '7px' }}>Verifikasi Digital</div>
                            </div>
                          )}
                        </div>
                        <div style={{ width: '55%', textAlign: 'center' }}>
                          <div>{signatureConfig.dateLocation}</div>
                          <div style={{ fontWeight: 'bold', marginTop: '2px' }}>{signatureConfig.officialTitle}</div>
                          <div style={{ border: '1px solid #2563eb', borderRadius: '4px', padding: '4px 8px', margin: '6px auto', width: 'fit-content', background: '#eff6ff' }}>
                            <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#1d4ed8' }}>DITANDATANGANI ELEKTRONIK</div>
                            <div style={{ fontSize: '7px', color: '#4b5563' }}>Sistem Mitradesa</div>
                          </div>
                          <div style={{ fontWeight: 'bold', marginTop: '3px' }}>
                            ( {signatureConfig.officialName} )
                          </div>
                          {signatureConfig.officialNip && (
                            <div style={{ fontSize: '9.5px', color: '#4b5563', marginTop: '2px' }}>
                              NIP. {signatureConfig.officialNip}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          <div className={styles.properties}>
            {selectedElement ? (
              <div>
                <div className={styles.propertiesTitle}>
                  Properties: {selectedElement.type.toUpperCase()}
                </div>

                {selectedElement.type === 'text' && (
                  <div className={styles.propertyGroup}>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Konten</label>
                      <textarea
                        value={selectedElement.content || ''}
                        onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                        className={`${styles.propertyInput} ${styles.propertyTextarea}`}
                      />
                    </div>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Ukuran Font</label>
                      <input
                        type="number"
                        value={selectedElement.fontSize || 11}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 11 })}
                        className={styles.propertyInput}
                      />
                    </div>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Style</label>
                      <select
                        value={selectedElement.fontWeight || 'normal'}
                        onChange={(e) => updateElement(selectedElement.id, { fontWeight: e.target.value })}
                        className={styles.propertyInput}
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Alignment</label>
                      <select
                        value={selectedElement.textAlign || 'justify'}
                        onChange={(e) => updateElement(selectedElement.id, { textAlign: e.target.value })}
                        className={styles.propertyInput}
                      >
                        <option value="justify">Justify (Rata Kanan-Kiri)</option>
                        <option value="left">Kiri</option>
                        <option value="center">Tengah</option>
                        <option value="right">Kanan</option>
                      </select>
                    </div>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Line Height</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="3"
                        value={selectedElement.lineHeight || 1.5}
                        onChange={(e) => updateElement(selectedElement.id, { lineHeight: parseFloat(e.target.value) || 1.5 })}
                        className={styles.propertyInput}
                      />
                    </div>
                  </div>
                )}

                {selectedElement.type === 'field' && (
                  <div className={styles.propertyGroup}>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Binding</label>
                      <input
                        value={selectedElement.binding || ''}
                        onChange={(e) => updateElement(selectedElement.id, { binding: e.target.value })}
                        className={styles.propertyInput}
                        style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}
                      />
                    </div>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Label</label>
                      <input
                        value={selectedElement.label || ''}
                        onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })}
                        className={styles.propertyInput}
                      />
                    </div>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Layout</label>
                      <select
                        value={selectedElement.layout || 'column'}
                        onChange={(e) => updateElement(selectedElement.id, { layout: e.target.value as 'inline' | 'column' })}
                        className={styles.propertyInput}
                      >
                        <option value="column">Kolom (Label : Nilai) — Standar surat dinas</option>
                        <option value="inline">Inline (Label: Nilai)</option>
                      </select>
                    </div>
                    {(selectedElement.layout === 'column' || !selectedElement.layout) && (
                      <div className={styles.propertyField}>
                        <label className={styles.propertyLabel}>Lebar Label (mm)</label>
                        <input
                          type="number"
                          min="20"
                          max="100"
                          value={selectedElement.labelWidth || 45}
                          onChange={(e) => updateElement(selectedElement.id, { labelWidth: parseInt(e.target.value) || 45 })}
                          className={styles.propertyInput}
                        />
                      </div>
                    )}
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Formatter</label>
                      <select
                        value={selectedElement.formatter || ''}
                        onChange={(e) => updateElement(selectedElement.id, { formatter: e.target.value || undefined })}
                        className={styles.propertyInput}
                      >
                        <option value="">Tanpa formatter</option>
                        {formatters.map(f => (
                          <option key={f.name} value={f.name}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {selectedElement.type === 'divider' && (
                  <div className={styles.propertyGroup}>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Style</label>
                      <select
                        value={selectedElement.style || 'solid'}
                        onChange={(e) => updateElement(selectedElement.id, { style: e.target.value })}
                        className={styles.propertyInput}
                      >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                      </select>
                    </div>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Tebal</label>
                      <input
                        type="number"
                        value={selectedElement.thickness || 1}
                        onChange={(e) => updateElement(selectedElement.id, { thickness: parseInt(e.target.value) || 1 })}
                        className={styles.propertyInput}
                      />
                    </div>
                  </div>
                )}

                {selectedElement.type === 'spacer' && (
                  <div className={styles.propertyGroup}>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Tinggi (px)</label>
                      <input
                        type="number"
                        value={selectedElement.height || 20}
                        onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 20 })}
                        className={styles.propertyInput}
                      />
                    </div>
                  </div>
                )}

                <div className={styles.propertyDivider} />

                <button
                  onClick={() => deleteElement(selectedElement.id)}
                  className={styles.deleteButton}
                >
                  Hapus Elemen
                </button>
              </div>
            ) : (
              <div className={styles.emptyProperties}>
                <p>Pilih elemen untuk mengedit</p>
              </div>
            )}
          </div>
        </div>

        {/* Field Picker Modal */}
        {showFieldPicker && (
          <div className={styles.modal} onClick={() => setShowFieldPicker(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Pilih Field</h2>
              </div>
              <div className={styles.modalBody}>
                {Object.entries(
                  bindings.reduce<Record<string, BindingOption[]>>((acc, binding) => {
                    const cat = binding.category;
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(binding);
                    return acc;
                  }, {})
                ).map(([category, items]) => (
                  <div key={category} className={styles.fieldCategory}>
                    <div className={styles.fieldCategoryTitle}>{category}</div>
                    <div className={styles.fieldList}>
                      {items.map((binding) => (
                        <button
                          key={binding.path}
                          onClick={() => insertBinding(binding.path)}
                          className={styles.fieldItem}
                        >
                          <div className={styles.fieldItemLabel}>{binding.label}</div>
                          <div className={styles.fieldItemPath}>{binding.path}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowFieldPicker(false)}
                  className={`${styles.modalButton} ${styles.modalButtonOutline}`}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kop Editor Modal */}
        {showKopEditor && (
          <div className={styles.modal} onClick={() => setShowKopEditor(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Konfigurasi Kop Surat</h2>
              </div>
              <div className={styles.modalBody}>
                {/* Logo info banner */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px 12px', marginBottom: '14px', fontSize: '12px', color: '#166534', lineHeight: '1.4' }}>
                  💡 <strong>Informasi Logo:</strong> Logo Desa dan Logo Kabupaten secara otomatis diambil dari data Profil Desa & Pamong. Kotak centang di bawah ini mengatur visibilitasnya pada Kop Surat.
                </div>

                {/* Logo toggles */}
                <div className={styles.propertyGroup}>
                  <div className={styles.propertyField}>
                    <label className={styles.propertyLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={kopConfig.logoDesaVisible} onChange={e => setKopConfig(p => ({ ...p, logoDesaVisible: e.target.checked }))} />
                      Tampilkan Logo Desa
                    </label>
                  </div>
                  <div className={styles.propertyField}>
                    <label className={styles.propertyLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={kopConfig.logoKabupatenVisible} onChange={e => setKopConfig(p => ({ ...p, logoKabupatenVisible: e.target.checked }))} />
                      Tampilkan Logo Kabupaten
                    </label>
                  </div>
                </div>

                {/* Institution names */}
                <div className={styles.propertyGroup}>
                  <div className={styles.propertyField}>
                    <label className={styles.propertyLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={kopConfig.pemdaVisible} onChange={e => setKopConfig(p => ({ ...p, pemdaVisible: e.target.checked }))} />
                      Pemerintah Daerah
                    </label>
                    {kopConfig.pemdaVisible && (
                      <input
                        value={kopConfig.pemdaText}
                        onChange={e => setKopConfig(p => ({ ...p, pemdaText: e.target.value }))}
                        className={styles.propertyInput}
                        style={{ marginTop: '4px' }}
                      />
                    )}
                  </div>
                  <div className={styles.propertyField}>
                    <label className={styles.propertyLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={kopConfig.kecamatanVisible} onChange={e => setKopConfig(p => ({ ...p, kecamatanVisible: e.target.checked }))} />
                      Kecamatan
                    </label>
                    {kopConfig.kecamatanVisible && (
                      <input
                        value={kopConfig.kecamatanText}
                        onChange={e => setKopConfig(p => ({ ...p, kecamatanText: e.target.value }))}
                        className={styles.propertyInput}
                        style={{ marginTop: '4px' }}
                      />
                    )}
                  </div>
                  <div className={styles.propertyField}>
                    <label className={styles.propertyLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={kopConfig.desaVisible} onChange={e => setKopConfig(p => ({ ...p, desaVisible: e.target.checked }))} />
                      Nama Desa
                    </label>
                    {kopConfig.desaVisible && (
                      <input
                        value={kopConfig.desaText}
                        onChange={e => setKopConfig(p => ({ ...p, desaText: e.target.value }))}
                        className={styles.propertyInput}
                        style={{ marginTop: '4px' }}
                      />
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className={styles.propertyGroup}>
                  <div className={styles.propertyField}>
                    <label className={styles.propertyLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={kopConfig.alamatVisible} onChange={e => setKopConfig(p => ({ ...p, alamatVisible: e.target.checked }))} />
                      Tampilkan Alamat
                    </label>
                    {kopConfig.alamatVisible && (
                      <textarea
                        value={kopConfig.alamatText}
                        onChange={e => setKopConfig(p => ({ ...p, alamatText: e.target.value }))}
                        className={`${styles.propertyInput} ${styles.propertyTextarea}`}
                        rows={2}
                        style={{ marginTop: '4px' }}
                      />
                    )}
                  </div>
                </div>

                {/* Divider style */}
                <div className={styles.propertyGroup}>
                  <div className={styles.propertyField}>
                    <label className={styles.propertyLabel}>Garis Pembatas</label>
                    <select
                      value={kopConfig.dividerStyle}
                      onChange={e => setKopConfig(p => ({ ...p, dividerStyle: e.target.value as KopConfigState['dividerStyle'] }))}
                      className={styles.propertyInput}
                    >
                      <option value="double">Ganda (Double)</option>
                      <option value="single">Tunggal (Single)</option>
                      <option value="none">Tanpa Garis</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowKopEditor(false)}
                  className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Signatory Modal */}
        {showSignatory && (
          <div className={styles.modal} onClick={() => setShowSignatory(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Konfigurasi Tanda Tangan</h2>
              </div>
              <div className={styles.modalBody}>
                {/* Mode */}
                <div className={styles.propertyGroup}>
                  <div className={styles.propertyField}>
                    <label className={styles.propertyLabel}>Mode Tanda Tangan</label>
                    <select
                      value={signatureConfig.mode}
                      onChange={e => setSignatureConfig(p => ({ ...p, mode: e.target.value as SignatureConfigState['mode'] }))}
                      className={styles.propertyInput}
                    >
                      <option value="online_tte">Online — TTE Elektronik</option>
                      <option value="offline_physical">Offline — Tanda Tangan Fisik</option>
                    </select>
                  </div>
                </div>

                {/* Date / location */}
                <div className={styles.propertyGroup}>
                  <div className={styles.propertyField}>
                    <label className={styles.propertyLabel}>Tempat &amp; Tanggal</label>
                    <input
                      value={signatureConfig.dateLocation}
                      onChange={e => setSignatureConfig(p => ({ ...p, dateLocation: e.target.value }))}
                      className={styles.propertyInput}
                    />
                  </div>
                </div>

                {/* Official */}
                <div className={styles.propertyGroup}>
                  <div className={styles.sidebarTitle} style={{ fontSize: '11px', marginBottom: '8px', color: '#6b7280' }}>Penandatangan Resmi</div>
                  <div className={styles.propertyField}>
                    <label className={styles.propertyLabel}>Jabatan</label>
                    <input
                      value={signatureConfig.officialTitle}
                      onChange={e => setSignatureConfig(p => ({ ...p, officialTitle: e.target.value }))}
                      className={styles.propertyInput}
                    />
                  </div>
                  <div className={styles.propertyField}>
                    <label className={styles.propertyLabel}>Nama Lengkap</label>
                    <input
                      value={signatureConfig.officialName}
                      onChange={e => setSignatureConfig(p => ({ ...p, officialName: e.target.value }))}
                      className={styles.propertyInput}
                    />
                  </div>
                  <div className={styles.propertyField}>
                    <label className={styles.propertyLabel}>NIP (opsional)</label>
                    <input
                      value={signatureConfig.officialNip}
                      onChange={e => setSignatureConfig(p => ({ ...p, officialNip: e.target.value }))}
                      className={styles.propertyInput}
                      placeholder="Kosongkan jika tidak ada NIP"
                    />
                  </div>
                </div>

                {/* Applicant (offline only) */}
                {signatureConfig.mode === 'offline_physical' && (
                  <div className={styles.propertyGroup}>
                    <div className={styles.sidebarTitle} style={{ fontSize: '11px', marginBottom: '8px', color: '#6b7280' }}>Pemohon / Warga</div>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Label Pemohon</label>
                      <input
                        value={signatureConfig.applicantTitle}
                        onChange={e => setSignatureConfig(p => ({ ...p, applicantTitle: e.target.value }))}
                        className={styles.propertyInput}
                      />
                    </div>
                    <div className={styles.propertyField}>
                      <label className={styles.propertyLabel}>Nama Pemohon (kosong = blanko)</label>
                      <input
                        value={signatureConfig.applicantName}
                        onChange={e => setSignatureConfig(p => ({ ...p, applicantName: e.target.value }))}
                        className={styles.propertyInput}
                        placeholder="Biarkan kosong untuk blanko dinamis"
                      />
                    </div>
                  </div>
                )}

                {/* Optional flags */}
                <div className={styles.propertyGroup}>
                  <div className={styles.propertyField}>
                    <label className={styles.propertyLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={signatureConfig.showStampSpace}
                        onChange={e => setSignatureConfig(p => ({ ...p, showStampSpace: e.target.checked }))}
                      />
                      Tampilkan Ruang Stempel
                    </label>
                  </div>
                  <div className={styles.propertyField}>
                    <label className={styles.propertyLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={signatureConfig.enableQrCode}
                        onChange={e => setSignatureConfig(p => ({ ...p, enableQrCode: e.target.checked }))}
                      />
                      Tampilkan QR Code Verifikasi
                    </label>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowSignatory(false)}
                  className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preset Selector Modal */}
        {showPresetModal && (
          <div className={styles.modal} onClick={() => setShowPresetModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', width: '92vw' }}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>⚡ Muat Format Preset Standar</h2>
              </div>
              <div className={styles.modalBody}>
                <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '16px', lineHeight: '1.5' }}>
                  Pilih salah satu format standar resmi pemerintah desa di bawah ini. Format akan dimuat dengan tata letak baku, font serif Times New Roman, perataan justify, dan susunan identitas 3-kolom standar.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div
                    onClick={() => applyPreset('keterangan')}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      background: '#fff',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1f2937' }}>📄 Surat Keterangan Umum (SK)</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', lineHeight: '1.4' }}>
                      Format baku untuk Surat Keterangan Domisili, Keterangan Belum Menikah, Keterangan Kelakuan Baik, dll. Disertai 7 field identitas tabular.
                    </div>
                  </div>

                  <div
                    onClick={() => applyPreset('domisili_usaha')}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      background: '#fff',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1f2937' }}>🏪 Surat Keterangan Domisili Usaha (SKU)</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', lineHeight: '1.4' }}>
                      Format untuk legalitas izin usaha mikro/kecil. Dilengkapi identitas pemilik usaha, nama usaha, jenis usaha, dan lokasi usaha.
                    </div>
                  </div>

                  <div
                    onClick={() => applyPreset('pengantar')}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      background: '#fff',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1f2937' }}>✉️ Surat Pengantar Umum</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', lineHeight: '1.4' }}>
                      Format pengantar warga ke instansi luar (KUA, Disdukcapil, Polsek/Polres, Kecamatan, dll).
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowPresetModal(false)}
                  className={`${styles.modalButton} ${styles.modalButtonOutline}`}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className={styles.modal} onClick={() => setShowPreview(false)}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '680px', width: '96vw' }}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Preview Template</h2>
              </div>
              <div className={styles.modalBody} style={{ padding: 0, overflowY: 'auto', maxHeight: '75vh' }}>
                {loadingPreview ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                    Memuat preview...
                  </div>
                ) : previewHtml ? (
                  <div
                    style={{
                      backgroundColor: '#f3f4f6',
                      padding: '1rem',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: 'white',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)',
                        width: '595px',
                        minHeight: '842px',
                        margin: '0 auto',
                        fontFamily: 'Times New Roman, serif',
                      }}
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                ) : (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                    Tidak ada preview tersedia. Coba simpan template terlebih dahulu.
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowPreview(false)}
                  className={`${styles.modalButton} ${styles.modalButtonOutline}`}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
