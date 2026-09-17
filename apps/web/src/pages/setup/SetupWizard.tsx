import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Container, Button } from '@/components/ui';

export default function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    admin: {
      username: '',
      email: '',
      password: '',
      name: '',
    },
    wilayah: {
      provinsiId: '',
      provinsiNama: '',
      kabupatenId: '',
      kabupatenNama: '',
      kecamatanId: '',
      kecamatanNama: '',
      desaId: '',
      desaNama: '',
    },
  });

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      admin: {
        ...prev.admin,
        [e.target.name]: e.target.value,
      },
    }));
  };

  const handleWilayahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      wilayah: {
        ...prev.wilayah,
        [e.target.name]: e.target.value,
      },
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/setup/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Setup failed');
      }

      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm" style={{ padding: '2rem 0' }}>
        <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <Typography variant="h2" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            Setup Sistem Informasi Desa
          </Typography>
          <Typography variant="body2" color="secondary" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            Inisialisasi sistem untuk penggunaan pertama kali.
          </Typography>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <Typography variant="h3" style={{ marginBottom: '1rem' }}>Data Wilayah (Desa)</Typography>
              
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Kode Provinsi</label>
                  <input name="provinsiId" value={formData.wilayah.provinsiId} onChange={handleWilayahChange} style={inputStyle} placeholder="Contoh: 52" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Nama Provinsi</label>
                  <input name="provinsiNama" value={formData.wilayah.provinsiNama} onChange={handleWilayahChange} style={inputStyle} placeholder="Contoh: NUSA TENGGARA BARAT" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Kode Kabupaten</label>
                  <input name="kabupatenId" value={formData.wilayah.kabupatenId} onChange={handleWilayahChange} style={inputStyle} placeholder="Contoh: 52.03" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Nama Kabupaten</label>
                  <input name="kabupatenNama" value={formData.wilayah.kabupatenNama} onChange={handleWilayahChange} style={inputStyle} placeholder="Contoh: LOMBOK TIMUR" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Kode Kecamatan</label>
                  <input name="kecamatanId" value={formData.wilayah.kecamatanId} onChange={handleWilayahChange} style={inputStyle} placeholder="Contoh: 52.03.08" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Nama Kecamatan</label>
                  <input name="kecamatanNama" value={formData.wilayah.kecamatanNama} onChange={handleWilayahChange} style={inputStyle} placeholder="Contoh: PRINGGABAYA" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Kode Desa</label>
                  <input name="desaId" value={formData.wilayah.desaId} onChange={handleWilayahChange} style={inputStyle} placeholder="Contoh: 52.03.08.2014" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Nama Desa</label>
                  <input name="desaNama" value={formData.wilayah.desaNama} onChange={handleWilayahChange} style={inputStyle} placeholder="Contoh: SERUNI MUMBUL" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" onClick={() => setStep(2)}>Selanjutnya</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <Typography variant="h3" style={{ marginBottom: '1rem' }}>Akun Administrator</Typography>
              
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Nama Lengkap</label>
                  <input name="name" value={formData.admin.name} onChange={handleAdminChange} style={inputStyle} placeholder="Nama Admin" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Email</label>
                  <input name="email" type="email" value={formData.admin.email} onChange={handleAdminChange} style={inputStyle} placeholder="admin@desa.id" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Username</label>
                  <input name="username" value={formData.admin.username} onChange={handleAdminChange} style={inputStyle} placeholder="admin" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Password</label>
                  <input name="password" type="password" value={formData.admin.password} onChange={handleAdminChange} style={inputStyle} placeholder="••••••••" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outline" onClick={() => setStep(1)}>Kembali</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Menyiapkan...' : 'Selesaikan Setup'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box' as const,
};
