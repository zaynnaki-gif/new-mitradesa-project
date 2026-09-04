// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function safeFetchJson(url: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(url, options);
  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage'); // Zustand auth store
      sessionStorage.clear();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    }
    throw new Error(data?.error?.message || data?.message || `Gagal menghubungi server (Status: ${res.status})`);
  }

  if (!data) {
    throw new Error('Format respons dari server tidak dikenali (bukan JSON)');
  }

  return data;
}
