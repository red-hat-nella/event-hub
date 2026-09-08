import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { spawnSync } from 'child_process';
import * as bcrypt from 'bcrypt';
import { bootstrapAdmin } from '../src/bootstrap/admin-bootstrap';
describe('admin bootstrap on disposable PostgreSQL', () => {
  const prisma = new PrismaClient();
  const prefix = `seed-${Date.now()}`;
  const password = randomBytes(24).toString('base64url');
  const email = (key: string) => `${prefix}-${key}@example.test`;
  it('CLI emits only a result code, never configuration or hash', () => {
    const result = spawnSync(
      process.execPath,
      ['-r', 'ts-node/register', 'src/bootstrap/seed-admin.ts'],
      {
        env: {
          ...process.env,
          SEED_ADMIN_EMAIL: email('cli'),
          SEED_ADMIN_PASSWORD: password,
        },
        encoding: 'utf8',
      },
    );
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('ADMIN_CREATED');
    expect(result.stderr).toBe('');
  });
  beforeAll(() => {
    if (!process.env.DATABASE_URL?.includes('/account_experience_test'))
      throw new Error('Disposable database required');
  });
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
    await prisma.$disconnect();
  });
  it('creates once and reuses without modifying hash/profile', async () => {
    expect(
      await bootstrapAdmin(prisma, { email: email('repeat'), password }),
    ).toBe('ADMIN_CREATED');
    const before = await prisma.user.findUniqueOrThrow({
      where: { email: email('repeat') },
    });
    expect(
      await bootstrapAdmin(prisma, { email: email('repeat'), password }),
    ).toBe('ADMIN_REUSED');
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: before.id } }),
    ).toEqual(before);
    expect(await bcrypt.compare(password, before.passwordHash)).toBe(true);
  });
  it('concurrent bootstrap leaves exactly one identity', async () => {
    await Promise.all(
      Array.from({ length: 3 }, () =>
        bootstrapAdmin(prisma, { email: email('race'), password }),
      ),
    );
    expect(await prisma.user.count({ where: { email: email('race') } })).toBe(
      1,
    );
  });
  it('never promotes USER or overwrites a password', async () => {
    const user = await prisma.user.create({
      data: {
        email: email('user'),
        name: 'Existing user',
        role: 'USER',
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
    await expect(
      bootstrapAdmin(prisma, { email: user.email, password }),
    ).rejects.toThrow('ADMIN_IDENTITY_CONFLICT');
    expect(await prisma.user.findUnique({ where: { id: user.id } })).toEqual(
      user,
    );
    await expect(
      bootstrapAdmin(prisma, {
        email: email('repeat'),
        password: 'different-valid-password',
      }),
    ).rejects.toThrow('ADMIN_ACCESS_NOT_VERIFIED');
  });
  it.each([
    {},
    { email: 'invalid', password: 'short' },
    { email: email('missing') },
  ])(
    'rejects invalid configuration without exposing values',
    async (config) => {
      await expect(bootstrapAdmin(prisma, config)).rejects.toThrow(
        'ADMIN_CONFIGURATION_REQUIRED',
      );
    },
  );
});
