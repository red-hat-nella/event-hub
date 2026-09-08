import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from './common/common.module';
import { HealthController } from './common/health.controller';
import { validateEnv } from './common/env.validation';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { RegistrationsModule } from './registrations/registrations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        // 100 req/min por IP (T007 de plan.md / instrucciones del workload).
        ttl: 60_000,
        limit: 100,
      },
    ]),
    CommonModule,
    AuthModule,
    EventsModule,
    RegistrationsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
