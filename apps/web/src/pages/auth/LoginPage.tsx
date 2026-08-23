import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/auth.store';
import styles from './LoginPage.module.css';

// SVG Icons
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  
  // View states
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Register specific states
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const response = await authApi.login(data.username, data.password);
      return response;
    },
    onSuccess: (data) => {
      // In a real app, 'rememberMe' would set token in localStorage vs sessionStorage
      setAuth(data.token, data.user);
      navigate('/admin/dashboard');
    },
    onError: (err: Error) => {
      setError(err.message || 'Gagal masuk. Periksa kembali kredensial Anda.');
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isRegister) {
      if (password !== regConfirmPassword) {
        setError('Konfirmasi password tidak cocok.');
        return;
      }
      if (!regFullName || !username || !regEmail || !password) {
        setError('Mohon lengkapi semua data pendaftaran.');
        return;
      }
      // Mock registration success
      setSuccessMsg('Pendaftaran berhasil! (Simulasi). Silahkan masuk.');
      setTimeout(() => {
        setIsRegister(false);
        setPassword('');
        setRegConfirmPassword('');
      }, 1500);
    } else {
      if (!username || !password) {
        setError('Username dan password harus diisi.');
        return;
      }
      loginMutation.mutate({ username, password });
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setSuccessMsg('');
    setPassword('');
  };

  return (
    <div className={styles.container}>
      {/* Left Pane - Branding / Decorative */}
      <div className={styles.leftPane}>
        <div className={styles.decoration}></div>
        <div className={styles.decoration2}></div>
        
        <div className={styles.brandInfo}>
          <h1 className={styles.brandTitle}>Sistem<br/>Informasi Desa</h1>
          <p className={styles.brandDesc}>
            Platform digital terintegrasi untuk mendukung tata kelola administrasi, pelayanan publik, dan transparansi informasi di tingkat desa.
          </p>
        </div>
        
        <div className={styles.brandInfo} style={{ opacity: 0.6, fontSize: '0.875rem' }}>
          &copy; {new Date().getFullYear()} Mitradesa. Hak cipta dilindungi.
        </div>
      </div>

      {/* Right Pane - Auth Form */}
      <div className={styles.rightPane}>
        <div className={styles.formContainer}>
          <div className={styles.header}>
            <h2 className={styles.title}>{isRegister ? 'Daftar Akun Baru' : 'Selamat Datang'}</h2>
            <p className={styles.subtitle}>
              {isRegister 
                ? 'Lengkapi formulir di bawah ini untuk mendaftarkan akun' 
                : 'Masuk ke akun internal sistem desa Anda'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className={styles.errorBox}>
                <AlertIcon />
                <span>{error}</span>
              </div>
            )}
            
            {successMsg && (
              <div className={styles.errorBox} style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                <span>{successMsg}</span>
              </div>
            )}

            {isRegister && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nama Lengkap</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Masukkan nama lengkap"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="nama@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Masukkan username Anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Konfirmasi Password</label>
                <div className={styles.inputWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={styles.input}
                    placeholder="Ulangi password Anda"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {!isRegister && (
              <div className={styles.optionsRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Ingat Akun</span>
                </label>
                <a href="#" className={styles.forgotLink} onClick={(e) => e.preventDefault()}>
                  Lupa Password?
                </a>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending 
                ? 'Memproses...' 
                : (isRegister ? 'Daftar Sekarang' : 'Masuk')}
            </button>
          </form>

          <div className={styles.toggleText}>
            {isRegister ? 'Sudah punya akun?' : 'Belum memiliki akun?'}
            <button
              type="button"
              className={styles.toggleLink}
              onClick={toggleMode}
            >
              {isRegister ? 'Masuk di sini' : 'Daftar sekarang'}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
