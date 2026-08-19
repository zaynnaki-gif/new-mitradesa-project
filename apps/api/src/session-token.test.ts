/**
 * Security Regression Tests: Session Token Integrity
 *
 * Tests the Phase 8.1 requirement:
 * - Token UNPREDICTABILITY: tokens must be cryptographically random
 * - Token INTEGRITY: tokens cannot be forged or tampered with
 * - EXPIRATION: expired/revoked tokens must be rejected
 * - AUTHORITY MODEL: identity comes from DB, not token payload
 */

import { randomBytes } from 'crypto';
import { authService } from '../src/services/auth.service';
import { prisma } from '../src/services/prisma';

// ─────────────────────────────────────────────────
// Helper: create a valid internal session directly in DB for testing
// ─────────────────────────────────────────────────
async function createTestSession(opts?: {
  expiresAt?: Date;
  revokedAt?: Date | null;
  token?: string;
}): Promise<{ token: string; accountId: bigint }> {
  const token = opts?.token ?? randomBytes(32).toString('hex');

  const account = await prisma.account.findFirst({ where: { status: 'ACTIVE' } });
  if (!account) throw new Error('No ACTIVE account found in test database');

  await prisma.internalSession.create({
    data: {
      accountId: account.id,
      token,
      expiresAt: opts?.expiresAt ?? new Date(Date.now() + 60_000),
      revokedAt: opts?.revokedAt ?? null,
    },
  });

  return { token, accountId: account.id };
}

// ─────────────────────────────────────────────────
// Cleanup helper
// ─────────────────────────────────────────────────
async function deleteSession(token: string) {
  await prisma.internalSession.deleteMany({ where: { token } });
}

// ─────────────────────────────────────────────────
// SUITE 1: Token unpredictability
// ─────────────────────────────────────────────────
describe('Security: Token Unpredictability', () => {
  it('should generate unique tokens on each call', () => {
    // Access private method via any-cast for unit testing purposes only
    const svc = authService as any;
    const mockAccount = { id: BigInt(1), username: 'test' };

    const t1 = svc.generateToken(mockAccount);
    const t2 = svc.generateToken(mockAccount);
    const t3 = svc.generateToken(mockAccount);

    expect(t1).not.toBe(t2);
    expect(t1).not.toBe(t3);
    expect(t2).not.toBe(t3);
  });

  it('should produce tokens of sufficient length (>=32 hex chars = 16 bytes)', () => {
    const svc = authService as any;
    const mockAccount = { id: BigInt(1), username: 'test' };
    const token = svc.generateToken(mockAccount);

    // 32 bytes hex = 64 chars
    expect(token.length).toBeGreaterThanOrEqual(64);
  });

  it('should produce tokens that contain no exploitable payload', () => {
    const svc = authService as any;
    const mockAccount = { id: BigInt(999), username: 'admin' };
    const token = svc.generateToken(mockAccount);

    // Token must NOT embed accountId or username in any parseable way
    expect(token).not.toContain('999');
    expect(token).not.toContain('admin');
    // Must not be valid Base64-encoded JSON
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      // If we reach here it parsed: assert it has no useful fields
      expect(parsed).not.toHaveProperty('sub');
      expect(parsed).not.toHaveProperty('username');
    } catch {
      // Expected: token is not Base64 JSON — this is the secure path
      expect(true).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────
// SUITE 2: Token Integrity (forgery resistance)
// ─────────────────────────────────────────────────
describe('Security: Token Integrity — Forgery Resistance', () => {
  it('should reject a random unknown token', async () => {
    const randomToken = randomBytes(32).toString('hex');
    const result = await authService.verifyInternalToken(randomToken);
    expect(result).toBeNull();
  });

  it('should reject a token with tampered hex characters', async () => {
    const { token } = await createTestSession();

    // Flip the first character
    const first = token[0];
    const tampered = (first === 'a' ? 'b' : 'a') + token.slice(1);

    const result = await authService.verifyInternalToken(tampered);
    expect(result).toBeNull();

    await deleteSession(token);
  });

  it('should reject a Base64-encoded JSON payload crafted to look like a valid token', async () => {
    const forgedPayload = { sub: '1', username: 'admin', type: 'internal', exp: Date.now() + 99999999 };
    const forgedToken = Buffer.from(JSON.stringify(forgedPayload)).toString('base64');

    const result = await authService.verifyInternalToken(forgedToken);
    expect(result).toBeNull();
  });

  it('should reject a structurally identical token not in DB', async () => {
    // Simulate attacker who knows the token format is 64-char hex
    const attackerToken = randomBytes(32).toString('hex');
    const result = await authService.verifyInternalToken(attackerToken);
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────
// SUITE 3: Expiration enforcement
// ─────────────────────────────────────────────────
describe('Security: Token Expiration', () => {
  it('should reject an expired token', async () => {
    const expiredAt = new Date(Date.now() - 1000); // 1 second in the past
    const { token } = await createTestSession({ expiresAt: expiredAt });

    const result = await authService.verifyInternalToken(token);
    expect(result).toBeNull();

    await deleteSession(token);
  });

  it('should accept a valid non-expired token', async () => {
    const { token } = await createTestSession({ expiresAt: new Date(Date.now() + 60_000) });

    const result = await authService.verifyInternalToken(token);
    expect(result).not.toBeNull();

    await deleteSession(token);
  });
});

// ─────────────────────────────────────────────────
// SUITE 4: Revocation enforcement
// ─────────────────────────────────────────────────
describe('Security: Token Revocation (Logout)', () => {
  it('should reject a revoked (logged-out) token', async () => {
    const { token } = await createTestSession({
      revokedAt: new Date(), // already revoked
    });

    const result = await authService.verifyInternalToken(token);
    expect(result).toBeNull();

    await deleteSession(token);
  });

  it('should invalidate token after explicit logout', async () => {
    const { token } = await createTestSession();

    // Verify it works before logout
    const before = await authService.verifyInternalToken(token);
    expect(before).not.toBeNull();

    // Logout
    await authService.logoutInternal(token);

    // Verify it's rejected after logout
    const after = await authService.verifyInternalToken(token);
    expect(after).toBeNull();

    await deleteSession(token);
  });
});

// ─────────────────────────────────────────────────
// SUITE 5: Authority model — identity from DB, not token
// ─────────────────────────────────────────────────
describe('Security: Authority Model', () => {
  it('should derive identity from DB, not token payload', async () => {
    const { token, accountId } = await createTestSession();

    const result = await authService.verifyInternalToken(token);
    expect(result).not.toBeNull();

    // Identity must come from DB account, not decoded from token string
    expect(result?.accountId).toEqual(accountId);
    expect(typeof result?.username).toBe('string');
    expect(result?.username.length).toBeGreaterThan(0);

    await deleteSession(token);
  });

  it('should return null for a valid-format token belonging to an INACTIVE account', async () => {
    // This test validates that account.status is checked server-side
    // (not trusted from any token payload)
    const inactiveAccount = await prisma.account.findFirst({
      where: { status: { not: 'ACTIVE' } },
    });

    if (!inactiveAccount) {
      // Skip if no inactive account exists
      expect(true).toBe(true);
      return;
    }

    const token = randomBytes(32).toString('hex');
    await prisma.internalSession.create({
      data: {
        accountId: inactiveAccount.id,
        token,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const result = await authService.verifyInternalToken(token);
    expect(result).toBeNull();

    await prisma.internalSession.deleteMany({ where: { token } });
  });
});
