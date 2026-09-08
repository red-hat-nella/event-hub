import { Controller, Get } from '@nestjs/common';

/**
 * `api-gateway` es stateless: `/healthz` y `/readyz` no dependen de ninguna
 * conexión externa (no tiene base de datos propia).
 */
@Controller()
export class HealthController {
  @Get('healthz')
  healthz(): { status: string } {
    return { status: 'ok' };
  }

  @Get('readyz')
  readyz(): { status: string } {
    return { status: 'ok' };
  }
}
