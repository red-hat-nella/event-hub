import { PrismaClient, User } from '@prisma/client';
import { isEmail } from 'class-validator';
import * as bcrypt from 'bcrypt';

export class AdminBootstrapError extends Error {}
export async function bootstrapAdmin(
  prisma: PrismaClient,
  config: { email?: string; password?: string },
): Promise<'ADMIN_CREATED' | 'ADMIN_REUSED'> {
  const { email, password } = config;
  // Login/registro existentes usan coincidencia exacta. No cambiar identidades
  // históricas mediante lower-case ni promover una variante de otra cuenta.
  if (!email || !isEmail(email) || !password || password.length < 8) {
    throw new AdminBootstrapError('ADMIN_CONFIGURATION_REQUIRED');
  }
  async function verify(user: User) {
    if (user.role !== 'ADMIN')
      throw new AdminBootstrapError('ADMIN_IDENTITY_CONFLICT');
    if (!(await bcrypt.compare(password!, user.passwordHash)))
      throw new AdminBootstrapError('ADMIN_ACCESS_NOT_VERIFIED');
    return 'ADMIN_REUSED' as const;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return verify(existing);
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await prisma.user.create({
      data: { name: 'Administrador', email, passwordHash, role: 'ADMIN' },
    });
    return 'ADMIN_CREATED';
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      const winner = await prisma.user.findUnique({ where: { email } });
      if (winner) return verify(winner);
    }
    throw error;
  }
}
