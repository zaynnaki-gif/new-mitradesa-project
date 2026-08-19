import { prisma } from '../services/prisma.js';

/**
 * Get desa ID from account ID
 * Uses the account's associated perangkatDesa to find the village
 */
export async function getDesaIdFromAccount(accountId: bigint): Promise<bigint> {
  const perangkat = await prisma.perangkatDesa.findFirst({
    where: {
      accountId,
      status: 'AKTIF',
    },
    include: {
      penduduk: true,
    },
  });

  if (!perangkat) {
    // Fallback for System Admin / Developer who don't have PerangkatDesa record
    const desa = await prisma.identitasDesa.findFirst();
    if (desa) return desa.id;
    throw new Error('Akun tidak terkait dengan desa manapun dan belum ada profil desa');
  }

  return perangkat.desaId;
}

/**
 * Get account info with village association
 */
export async function getAccountWithDesa(accountId: bigint) {
  return prisma.account.findUnique({
    where: { id: accountId },
    include: {
      perangkatDesa: {
        include: {
          penduduk: true,
          desa: {
            include: {
              kecamatan: {
                include: {
                  kabupaten: {
                    include: {
                      provinsi: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Check if account has access to specific village
 */
export async function hasAccessToDesa(
  accountId: bigint,
  desaId: bigint
): Promise<boolean> {
  const perangkat = await prisma.perangkatDesa.findFirst({
    where: {
      accountId,
      desaId,
      status: 'AKTIF',
    },
  });

  return !!perangkat;
}

/**
 * Get user's role codes
 */
export async function getUserRoles(accountId: bigint): Promise<string[]> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      accountRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!account) {
    return [];
  }

  return account.accountRoles.map((ar) => ar.role.code);
}
