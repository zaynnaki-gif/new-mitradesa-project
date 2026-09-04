import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { prisma } from './prisma.js';
import { AuditService } from './audit.service.js';
import { ApiError } from '../utils/response.js';

const BCRYPT_ROUNDS = 12;

/**
 * Standalone hash password function for testing
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export interface AccountWithRoles {
  id: bigint;
  username: string;
  email: string;
  status: string | null;
  lastLoginAt: Date | null;
  accountRoles: {
    role: {
      id: bigint;
      code: string;
      name: string;
      rolePermissions: {
        permission: {
          code: string;
        };
      }[];
    };
  }[];
}

export class AuthService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Authenticate internal account with username/password
   */
  async loginInternal(
    username: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ token: string; account: AccountWithRoles }> {
    // Find account
    const account = await prisma.account.findUnique({
      where: { username },
      include: {
        accountRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!account) {
      await this.auditService.log({
        entityType: 'account',
        entityId: BigInt(0),
        action: 'LOGIN_FAILED',
        actorType: 'USER',
        actorIp: ipAddress,
        actorAgent: userAgent,
        metadata: { username, reason: 'ACCOUNT_NOT_FOUND' },
      });

      // Use generic error message
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Check account status
    if (account.status !== 'ACTIVE') {
      await this.auditService.log({
        entityType: 'account',
        entityId: account.id,
        action: 'LOGIN_FAILED',
        actorType: 'USER',
        actorIp: ipAddress,
        actorAgent: userAgent,
        metadata: { reason: 'ACCOUNT_INACTIVE' },
      });

      throw ApiError.unauthorized('Account is inactive');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, account.passwordHash);

    if (!isValid) {
      await this.auditService.log({
        entityType: 'account',
        entityId: account.id,
        action: 'LOGIN_FAILED',
        actorType: 'USER',
        actorIp: ipAddress,
        actorAgent: userAgent,
        metadata: { reason: 'INVALID_PASSWORD' },
      });

      throw ApiError.unauthorized('Invalid credentials');
    }

    // Revoke previous active sessions to prevent session fixation and concurrent login hijack
    await prisma.internalSession.updateMany({
      where: {
        accountId: account.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // Generate token
    const token = this.generateToken(account);

    // Create session
    await prisma.internalSession.create({
      data: {
        accountId: account.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        ipAddress,
        userAgent,
      },
    });

    // Update last login
    await prisma.account.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit successful login
    await this.auditService.log({
      entityType: 'account',
      entityId: account.id,
      action: 'LOGIN_SUCCESS',
      actorId: account.id,
      actorType: 'USER',
      actorIp: ipAddress,
      actorAgent: userAgent,
    });

    // Strip sensitive information
    const { passwordHash: _passwordHash, ...accountWithoutPassword } = account;

    return { token, account: accountWithoutPassword as unknown as AccountWithRoles };
  }

  /**
   * Logout internal account
   */
  async logoutInternal(token: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const session = await prisma.internalSession.findUnique({
      where: { token },
      include: { account: true },
    });

    if (session) {
      await prisma.internalSession.update({
        where: { token },
        data: { revokedAt: new Date() },
      });

      await this.auditService.log({
        entityType: 'account',
        entityId: session.accountId,
        action: 'LOGOUT',
        actorId: session.accountId,
        actorType: 'USER',
        actorIp: ipAddress,
        actorAgent: userAgent,
      });
    }
  }

  /**
   * Verify internal token
   */
  async verifyInternalToken(token: string): Promise<{
    accountId: bigint;
    username: string;
    email: string;
    permissions: string[];
    roles: string[];
  } | null> {
    const session = await prisma.internalSession.findUnique({
      where: { token },
      include: {
        account: {
          include: {
            accountRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
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

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return null;
    }

    const { account } = session;

    // Check account status
    if (account.status !== 'ACTIVE') {
      return null;
    }

    // Collect permissions
    const permissions = new Set<string>();
    const roles = new Set<string>();

    for (const accountRole of account.accountRoles) {
      roles.add(accountRole.role.code);
      for (const rp of accountRole.role.rolePermissions) {
        permissions.add(rp.permission.code);
      }
    }

    return {
      accountId: account.id,
      username: account.username,
      email: account.email,
      permissions: Array.from(permissions),
      roles: Array.from(roles),
    };
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /**
   * Generate a cryptographically random opaque session token.
   *
   * Token is 32 bytes of random data (256-bit entropy) encoded as hex.
   * It carries NO payload — identity and expiration are resolved exclusively
   * via server-side DB lookup in verifyInternalToken().
   * This prevents token forging even if the token format is known.
   */
  private generateToken(_account: AccountWithRoles): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Get account by ID
   */
  async getAccountById(accountId: bigint) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        accountRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!account) return null;

    const { passwordHash: _passwordHash, ...accountWithoutPassword } = account;
    return accountWithoutPassword;
  }
}

export const authService = new AuthService();
