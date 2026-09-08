import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';

/**
 * Módulo global con las dependencias transversales que todos los módulos de
 * dominio (`auth`, `events`, `registrations`) necesitan: cliente HTTP hacia
 * los servicios internos y `JwtService` para verificar el `access_token`.
 */
@Global()
@Module({
  imports: [
    HttpModule.register({ timeout: 5000, maxRedirects: 0 }),
    JwtModule.register({}),
  ],
  exports: [HttpModule, JwtModule],
})
export class CommonModule {}
