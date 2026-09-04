import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts';
import { Button, Input, Select, Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/states';
import { Pagination } from '@/components/Pagination';
import { useAuthStore } from '@/stores/auth.store';
import { API_URL } from '@/lib/constants';
import styles from './UserManagementPage.module.css';
import { safeFetchJson } from '@/lib/fetch';

// ============================================
// Types
// ============================================

interface UserRole {
  id: string;
  name: string;
  code: string;
}

interface Account {
  id: string;
  username: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLoginAt?: string;
  createdAt: string;
  roles: UserRole[];
}

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'INACTIVE', label: 'Nonaktif' },
];

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function UserManagementPage() {
  const { token } = useAuthStore();

  // ============================================
  // State
  // ============================================
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    roleIds: [] as string[],
  });

  // ============================================
  // Fetch Data
  // ============================================
  const fetchAccounts = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const data = await safeFetchJson(`${API_URL}/accounts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (data.success) {
        setAccounts(data.data || []);
        setPagination(data.meta || null);
      } else {
        throw new Error(data.message || 'Gagal mengambil data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await safeFetchJson(`${API_URL}/accounts/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (data.success) {
        setRoles(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAccounts();
      fetchRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAccounts(1);
  };

  const handlePageChange = (page: number) => {
    fetchAccounts(page);
  };

  // ============================================
  // Modal Handlers
  // ============================================
  const openCreateModal = () => {
    setEditingAccount(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      status: 'ACTIVE',
      roleIds: [],
    });
    setShowModal(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      username: account.username,
      email: account.email,
      password: '',
      status: account.status,
      roleIds: account.roles.map(r => r.id),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url = editingAccount
        ? `${API_URL}/accounts/${editingAccount.id}`
        : `${API_URL}/accounts`;

      const method = editingAccount ? 'PATCH' : 'POST';

      const payload: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
        username: formData.username,
        email: formData.email,
        roleIds: formData.roleIds,
      };

      if (editingAccount) {
        payload.status = formData.status;
        if (formData.password) {
          payload.password = formData.password;
        }
      } else {
        payload.password = formData.password;
      }

      const data = await safeFetchJson(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (data.success) {
        setShowModal(false);
        fetchAccounts(pagination?.page || 1);
      } else {
        alert(data.message || 'Gagal menyimpan data');
      }
    } catch {
      alert('Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (account: Account) => {
    const newStatus = account.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'mengaktifkan' : 'menonaktifkan';

    if (!confirm(`Yakin ingin ${action} akun "${account.username}"?`)) return;

    try {
      await safeFetchJson(`${API_URL}/accounts/${account.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      fetchAccounts(pagination?.page || 1);
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  const handleDelete = async (account: Account) => {
    if (!confirm(`Yakin ingin menghapus akun "${account.username}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      const data = await safeFetchJson(`${API_URL}/accounts/${account.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (data.success) {
        fetchAccounts(pagination?.page || 1);
      } else {
        alert(data.message || 'Gagal menghapus');
      }
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  const toggleRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Manajemen User</h1>
            <p className={styles.subtitle}>
              {pagination?.total || 0} total akun
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button color="primary" onClick={openCreateModal}>
              + Tambah User
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <Input
              placeholder="Cari username atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: 150 }}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            <Button type="submit">Cari</Button>
          </form>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState message="Memuat data user..." fullPage />
        ) : error ? (
          <ErrorState
            title="Gagal Memuat Data"
            message={error}
            onRetry={() => fetchAccounts()}
          />
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Login Terakhir</th>
                    <th>Created</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.empty}>
                        Tidak ada akun user
                      </td>
                    </tr>
                  ) : (
                    accounts.map((account) => (
                      <tr key={account.id}>
                        <td className={styles.username}>{account.username}</td>
                        <td className={styles.email}>{account.email}</td>
                        <td>
                          <div className={styles.roles}>
                            {account.roles.map(role => (
                              <Badge key={role.id} color="secondary" >
                                {role.name}
                              </Badge>
                            ))}
                            {account.roles.length === 0 && (
                              <span className={styles.noRole}>-</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge color={account.status === 'ACTIVE' ? 'success' : 'error'}>
                            {account.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </td>
                        <td className={styles.date}>{formatDate(account.lastLoginAt || '')}</td>
                        <td className={styles.date}>{formatDate(account.createdAt)}</td>
                        <td className={styles.actions}>
                          <Button color="outline"  onClick={() => openEditModal(account)}>
                            Edit
                          </Button>
                          <Button
                            color="outline"
                            
                            onClick={() => handleToggleStatus(account)}
                          >
                            {account.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                          </Button>
                          <Button
                            color="outline"
                            
                            onClick={() => handleDelete(account)}
                            style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                          >
                            Hapus
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                disabled={loading}
              />
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{editingAccount ? 'Edit User' : 'Tambah User Baru'}</h2>
                <button onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                  <Input
                    label="Username *"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    disabled={!!editingAccount}
                  />
                  <Input
                    label="Email *"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                  <Input
                    label={editingAccount ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingAccount}
                    autoComplete="new-password"
                  />
                  {editingAccount && (
                    <Select
                      label="Status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    >
                      <option value="ACTIVE">Aktif</option>
                      <option value="INACTIVE">Nonaktif</option>
                    </Select>
                  )}
                </div>

                <div className={styles.rolesSection}>
                  <label className={styles.rolesLabel}>Roles</label>
                  <div className={styles.rolesGrid}>
                    {roles.length === 0 ? (
                      <p className={styles.noRoles}>Tidak ada roles tersedia</p>
                    ) : (
                      roles.map(role => (
                        <label key={role.id} className={styles.roleCheckbox}>
                          <input
                            type="checkbox"
                            checked={formData.roleIds.includes(role.id)}
                            onChange={() => toggleRole(role.id)}
                          />
                          <span>
                            <strong>{role.name}</strong>
                            {role.description && <small>{role.description}</small>}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className={styles.formActions}>
                  <Button type="button" color="outline" onClick={() => setShowModal(false)}>Batal</Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
