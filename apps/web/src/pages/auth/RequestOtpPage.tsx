import { useState } from 'react';
import { Container, Typography, Button, Input } from '../../components/ui';
import { API_URL } from '../../lib/constants';

export function RequestOtpPage() {
  const [nik, setNik] = useState('');
  const [noKk, setNoKk] = useState('');
  const [telepon, setTelepon] = useState('');
  const [cancellationCode, setCancellationCode] = useState('');
  const [step, setStep] = useState<'nik' | 'otp' | 'recover' | 'cancel'>('nik');
  const [challenge, setChallenge] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/citizen/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal meminta kode OTP');
      }

      setChallenge(data.data.challenge);
      setMessage('OTP telah dikirim ke nomor WhatsApp terdaftar Anda');
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/citizen/recover-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik, noKk, telepon }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal memulihkan akses warga');
      }

      setChallenge(data.data.challenge);
      setMessage(data.data.message || 'Nomor WhatsApp berhasil diperbarui. Kode OTP telah dikirimkan.');
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan pemulihan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/citizen/cancel-recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik, cancellationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal membatalkan pemulihan');
      }

      setMessage(data.data.message || 'Pemulihan akses berhasil dibatalkan. Nomor lama telah dipulihkan.');
      setStep('nik');
      setCancellationCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan pembatalan');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/citizen/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal memverifikasi OTP');
      }

      // Store token and redirect
      localStorage.setItem('citizen_token', data.data.token);
      window.location.href = '/layanan';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const resetToNik = () => {
    setStep('nik');
    setChallenge('');
    setOtp('');
    setMessage('');
    setError('');
    setCancellationCode('');
  };

  return (
    <Container maxWidth="sm">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '2rem',
          padding: '2rem 1rem',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Typography variant="h2">
            {step === 'recover'
              ? 'Pemulihan Akses Warga Online'
              : step === 'cancel'
              ? 'Pembatalan Darurat Pemulihan Akun'
              : 'Layanan Mandiri Warga'}
          </Typography>
          <Typography variant="body1" color="secondary" style={{ marginTop: '0.5rem' }}>
            {step === 'nik' && 'Masukkan NIK Anda untuk verifikasi dan login mandiri'}
            {step === 'otp' && 'Masukkan 6 digit kode OTP yang telah dikirim ke WhatsApp Anda'}
            {step === 'recover' && 'Verifikasi NIK dan Nomor Kartu Keluarga (KK) untuk memperbarui nomor WhatsApp'}
            {step === 'cancel' && 'Masukkan NIK dan kode pembatalan yang dikirim ke nomor lama Anda'}
          </Typography>
        </div>

        <form
          onSubmit={
            step === 'nik'
              ? handleRequestOtp
              : step === 'recover'
              ? handleRecoverAccess
              : step === 'cancel'
              ? handleCancelRecovery
              : handleVerifyOtp
          }
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            width: '100%',
            maxWidth: 440,
            padding: '2rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        >
          {message && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.375rem',
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
                fontSize: '0.875rem',
                lineHeight: '1.4',
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.375rem',
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                fontSize: '0.875rem',
                lineHeight: '1.4',
              }}
            >
              {error}
            </div>
          )}

          {step === 'nik' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                NIK (Nomor Induk Kependudukan)
              </label>
              <Input
                type="text"
                value={nik}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNik(e.target.value.replace(/\D/g, ''))}
                placeholder="Masukkan 16 digit NIK"
                maxLength={16}
                required
                autoFocus
              />

              <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <Typography variant="body2" color="secondary" style={{ marginBottom: '0.375rem' }}>
                    Nomor WhatsApp tidak aktif, hilang, atau belum terdaftar?
                  </Typography>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep('recover');
                      setMessage('');
                      setError('');
                    }}
                    style={{ width: '100%', fontSize: '0.875rem' }}
                  >
                    Pulihkan Akun via No. KK (Online)
                  </Button>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('cancel');
                      setMessage('');
                      setError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#b91c1c',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Menerima peringatan pembajakan akun? Batalkan di sini
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'recover' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  fontSize: '0.8125rem',
                  lineHeight: '1.4',
                }}
              >
                Data NIK dan Nomor KK akan dicocokkan dengan basis data resmi desa. Nomor lama akan menerima peringatan keamanan dan jeda pembatalan (Grace Period) 2 jam.
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  NIK (16 Digit)
                </label>
                <Input
                  type="text"
                  value={nik}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNik(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 5203030107460108"
                  maxLength={16}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Nomor Kartu Keluarga / KK (16 Digit)
                </label>
                <Input
                  type="text"
                  value={noKk}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNoKk(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nomor KK di bagian atas Kartu Keluarga"
                  maxLength={16}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Nomor WhatsApp Baru (Aktif)
                </label>
                <Input
                  type="tel"
                  value={telepon}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTelepon(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  maxLength={15}
                  required
                />
              </div>
            </div>
          )}

          {step === 'cancel' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                  fontSize: '0.8125rem',
                  lineHeight: '1.4',
                }}
              >
                Gunakan fitur ini jika nomor WhatsApp Anda dialihkan tanpa izin. Masukkan kode pembatalan yang dikirimkan ke nomor WhatsApp lama Anda untuk segera mengembalikan akun dan memutus sesi penyerang.
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  NIK (16 Digit)
                </label>
                <Input
                  type="text"
                  value={nik}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNik(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 5203030107460108"
                  maxLength={16}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Kode Pembatalan Darurat
                </label>
                <Input
                  type="text"
                  value={cancellationCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCancellationCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: D54B74"
                  maxLength={10}
                  required
                />
              </div>
            </div>
          )}

          {step === 'otp' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Kode OTP (6 Digit)
              </label>
              <Input
                type="text"
                value={otp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Masukkan 6 digit angka OTP"
                maxLength={6}
                required
                autoFocus
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading
                ? 'Memproses...'
                : step === 'nik'
                ? 'Kirim OTP ke WhatsApp'
                : step === 'recover'
                ? 'Verifikasi KK & Kirim OTP Baru'
                : step === 'cancel'
                ? 'Batalkan Pemulihan & Pulihkan Nomor Lama'
                : 'Verifikasi & Masuk Layanan'}
            </Button>

            {step !== 'nik' && (
              <Button
                type="button"
                variant="outline"
                onClick={resetToNik}
                disabled={loading}
                style={{ width: '100%' }}
              >
                Kembali ke Form Awal
              </Button>
            )}
          </div>
        </form>
      </div>
    </Container>
  );
}
