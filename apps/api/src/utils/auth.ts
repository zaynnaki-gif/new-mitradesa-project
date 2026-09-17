import { prisma } from '../services/prisma.js';


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
        },
      },
    },
  });
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
