import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Sondas de la plataforma (`contracts/user-service.md`). No llevan
 * `InternalTokenGuard`: deben responder sin cabecera especial para que
 * `livenessProbe`/`readinessProbe` de OpenShift funcionen.
 */
@Controller('internal')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('healthz')
  healthz(): { status: string } {
    return { status: 'ok' };
  }

  @Get('readyz')
  async readyz(): Promise<{ status: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException({
        code: 'NOT_READY',
        message: 'La base de datos db-users no está disponible.',
      });
    }
  }
}
