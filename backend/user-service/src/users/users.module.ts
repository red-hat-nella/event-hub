import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  // El secreto y el TTL se especifican explícitamente en cada llamada a
  // `sign`/`verify` dentro de `UsersService` (permite usar TTL distinto para
  // accessToken/refreshToken con el mismo módulo).
  imports: [JwtModule.register({})],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
