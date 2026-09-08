import { PrismaClient } from '@prisma/client';
import { AdminBootstrapError, bootstrapAdmin } from './admin-bootstrap';
export async function seedAdminMain(): Promise<void> {
  const prisma = new PrismaClient({ log: [] });
  try {
    const result = await bootstrapAdmin(prisma, {
      email: process.env.SEED_ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD,
    });
    console.log(result);
  } catch (error) {
    console.error(
      error instanceof AdminBootstrapError
        ? error.message
        : 'ADMIN_BOOTSTRAP_FAILED',
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
if (require.main === module) void seedAdminMain();
