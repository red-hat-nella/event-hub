import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed idempotente de la cuenta administradora inicial (research.md §19,
 * contracts/user-service.md). Se ejecuta con `npm run db:seed` /
 * `prisma db seed`. Requiere SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en el
 * entorno; si faltan, falla explícitamente en lugar de sembrar datos
 * inválidos.
 */
async function main(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD son obligatorias para sembrar la cuenta administradora',
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Administrador',
      email,
      passwordHash,
      role: 'ADMIN',
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Seed admin listo: ${admin.email} (id=${admin.id})`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Error al sembrar la cuenta administradora:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
