import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Container, Typography, Button, Input } from '../../components/ui';
import { authApi } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/auth.store';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const response = await authApi.login(data.username, data.password);
      return response;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate('/admin/dashboard');
    },
    onError: (err: Error) => {
      setError(err.message || 'Login failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ username, password });
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
          <Typography variant="h2">Login</Typography>
          <Typography variant="body1" color="secondary" style={{ marginTop: '0.5rem' }}>
            Masuk ke akun internal sistem desa
          </Typography>
        </div>

        <form
          onSubmit={handleSubmit}
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

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Username
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loginMutation.isPending}
            style={{ marginTop: '1rem', width: '100%' }}
          >
            {loginMutation.isPending ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        <Typography variant="caption" color="secondary">
          Development accounts: admin, pimpinan, developer
        </Typography>
      </div>
    </Container>
  );
}
