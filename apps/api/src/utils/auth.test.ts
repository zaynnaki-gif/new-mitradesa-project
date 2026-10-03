import { getAccountWithDesa, getUserRoles } from './auth';
import { prisma } from '../services/prisma';

// Mock the prisma service
jest.mock('../services/prisma');

describe('Auth Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccountWithDesa', () => {
    it('should return account info with village association', async () => {
      const mockAccount = {
        id: 1n,
        username: 'testuser',
        perangkatDesa: {
          id: 10n,
          penduduk: { id: 100n, namaLengkap: 'John Doe' }
        }
      };

      // @ts-ignore - mockResolvedValue signature is tricky with nested includes in prisma
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);

      const result = await getAccountWithDesa(1n);

      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: 1n },
        include: {
          perangkatDesa: {
            include: {
              penduduk: true,
            },
          },
        },
      });
      expect(result).toEqual(mockAccount);
    });

    it('should return null if account is not found', async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getAccountWithDesa(999n);
      expect(result).toBeNull();
    });
  });

  describe('getUserRoles', () => {
    it('should return an array of role codes for a valid account', async () => {
      const mockAccount = {
        id: 1n,
        accountRoles: [
          { role: { code: 'ADMIN' } },
          { role: { code: 'KEPALA_DESA' } }
        ]
      };

      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);

      const roles = await getUserRoles(1n);

      expect(roles).toEqual(['ADMIN', 'KEPALA_DESA']);
    });

    it('should return an empty array if account is not found', async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      const roles = await getUserRoles(999n);
      expect(roles).toEqual([]);
    });
  });
});
