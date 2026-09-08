import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * `GET /internal/healthz` y `GET /internal/readyz` (T025) — mismo patrón
 * que los otros servicios internos. Sin `InternalTokenGuard`: las sondas de
 * OpenShift (`livenessProbe`/`readinessProbe`) llaman directamente al Pod
 * sin cabeceras adicionales.
 */
@Controller('internal')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('healthz')
  healthz(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('readyz')
  async readyz(): Promise<{ status: 'ok' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException({
        code: 'NOT_READY',
        message: 'La base de datos db-registrations no está disponible.',
      });
    }
  }
}
