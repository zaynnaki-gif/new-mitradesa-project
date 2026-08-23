import { useState } from 'react';
import { Container, Typography, Button, Input } from '../../components/ui';
import { API_URL } from '../../lib/constants';

export function RequestOtpPage() {
  const [nik, setNik] = useState('');
  const [step, setStep] = useState<'nik' | 'otp'>('nik');
  const [challenge, setChallenge] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/citizen/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to request OTP');
      }

      setChallenge(data.data.challenge);
      setMessage('OTP telah dikirim ke nomor telepon Anda');
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/citizen/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to verify OTP');
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
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Typography variant="h2">Verifikasi Warga</Typography>
          <Typography variant="body1" color="secondary" style={{ marginTop: '0.5rem' }}>
            {step === 'nik'
              ? 'Masukkan NIK Anda untuk verifikasi'
              : 'Masukkan kode OTP yang dikirim ke nomor telepon Anda'}
          </Typography>
        </div>

        <form
          onSubmit={step === 'nik' ? handleRequestOtp : handleVerifyOtp}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%',
            maxWidth: 400,
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          {message && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: '#f0fdf4',
                color: 'var(--color-success)',
                fontSize: '0.875rem',
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: '#fef2f2',
                color: 'var(--color-error)',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          {step === 'nik' ? (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                NIK (Nomor Induk Kependudukan)
              </label>
              <Input
                type="text"
                value={nik}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNik(e.target.value)}
                placeholder="Masukkan 16 digit NIK"
                maxLength={16}
                required
              />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Kode OTP
              </label>
              <Input
                type="text"
                value={otp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                placeholder="Masukkan 6 digit OTP"
                maxLength={6}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep('nik');
                  setChallenge('');
                  setOtp('');
                  setMessage('');
                }}
                style={{ marginTop: '1rem' }}
              >
                Kembali
              </Button>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ marginTop: '1rem', width: '100%' }}
          >
            {loading ? 'Memproses...' : step === 'nik' ? 'Kirim OTP' : 'Verifikasi'}
          </Button>
        </form>
      </div>
    </Container>
  );
}
