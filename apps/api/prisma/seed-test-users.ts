import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed test users for database-dependent tests
 * Run with: npx tsx prisma/seed-test-users.ts
 */

async function seedTestUsers() {
  console.log('==========================================');
  console.log('Seeding Test Users');
  console.log('==========================================\n');

  try {
    const BCRYPT_ROUNDS = 12;
    const testPassword = 'admin123';

    // Create test admin account
    console.log('Creating test admin account...');
    const passwordHash = await bcrypt.hash(testPassword, BCRYPT_ROUNDS);

    const existingAccount = await prisma.account.findUnique({
      where: { username: 'testadmin' }
    });

    if (!existingAccount) {
      const account = await prisma.account.create({
        data: {
          username: 'testadmin',
          email: 'admin@test.com',
          passwordHash,
          status: 'ACTIVE',
        }
      });
      console.log(`  Created account: ${account.username} (id: ${account.id})`);

      // Create ADMIN role if not exists
      let adminRole = await prisma.role.findUnique({
        where: { code: 'ADMIN' }
      });

      if (!adminRole) {
        adminRole = await prisma.role.create({
          data: {
            name: 'Administrator',
            roleCode: 'ADMIN',
            description: 'System Administrator',
            isSystem: true,
          }
        });
        console.log(`  Created role: ${adminRole.name}`);

        // Create permissions
        const permissions = [
          { name: 'Manage Penduduk', code: 'penduduk:read' },
          { name: 'Create Penduduk', code: 'penduduk:create' },
          { name: 'Update Penduduk', code: 'penduduk:update' },
          { name: 'Delete Penduduk', code: 'penduduk:delete' },
          { name: 'Manage Keluarga', code: 'keluarga:read' },
          { name: 'Create Keluarga', code: 'keluarga:create' },
          { name: 'Update Keluarga', code: 'keluarga:update' },
          { name: 'Delete Keluarga', code: 'keluarga:delete' },
          { name: 'Manage Perangkat', code: 'perangkat:read' },
          { name: 'Create Perangkat', code: 'perangkat:create' },
          { name: 'Update Perangkat', code: 'perangkat:update' },
          { name: 'Delete Perangkat', code: 'perangkat:delete' },
          { name: 'Manage Reference', code: 'reference:read' },
          { name: 'Update Reference', code: 'reference:update' },
          { name: 'Manage Audit Log', code: 'audit:read' },
          { name: 'Manage Configuration', code: 'config:read' },
          { name: 'Update Configuration', code: 'config:update' },
        ];

        for (const perm of permissions) {
          const existingPerm = await prisma.permission.findUnique({
            where: { code: perm.code }
          });

          if (!existingPerm) {
            const created = await prisma.permission.create({
              data: {
                name: perm.name,
                permissionCode: perm.code,
                groupName: perm.code.split(':')[0],
              }
            });

            // Assign permission to ADMIN role
            await prisma.rolePermission.create({
              data: {
                roleId: adminRole.id,
                permissionId: created.id,
              }
            });
          }
        }
        console.log(`  Created ${permissions.length} permissions`);
      }

      // Assign ADMIN role to testadmin
      const roleAccount = await prisma.role.findUnique({
        where: { code: 'ADMIN' }
      });

      if (roleAccount) {
        const existingAccountRole = await prisma.accountRole.findUnique({
          where: {
            accountId_roleId: {
              accountId: account.id,
              roleId: roleAccount.id,
            }
          }
        });

        if (!existingAccountRole) {
          await prisma.accountRole.create({
            data: {
              accountId: account.id,
              roleId: roleAccount.id,
            }
          });
          console.log(`  Assigned ADMIN role to testadmin`);
        }
      }

      console.log('\nTest admin credentials:');
      console.log('  Username: testadmin');
      console.log('  Password: admin123');
    } else {
      console.log(`  Account testadmin already exists (id: ${existingAccount.id})`);
    }

    console.log('\n==========================================');
    console.log('Test users seeded successfully!');
    console.log('==========================================');

  } catch (error) {
    console.error('Error seeding test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestUsers();
