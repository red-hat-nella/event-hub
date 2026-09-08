import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InternalTokenGuard } from '../common/internal-token.guard';
import { AuthenticateDto } from './dto/authenticate.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RefreshDto } from './dto/refresh.dto';
import {
  AuthResult,
  CreatedUser,
  PublicUser,
  UsersService,
} from './users.service';

/**
 * Implementa exactamente `contracts/user-service.md`. Solo accesible desde
 * `api-gateway` vía `X-Internal-Token` (`InternalTokenGuard`).
 */
@Controller('internal/users')
@UseGuards(InternalTokenGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto): Promise<CreatedUser> {
    return this.usersService.create(dto);
  }

  @Post('authenticate')
  @HttpCode(HttpStatus.OK)
  authenticate(@Body() dto: AuthenticateDto): Promise<AuthResult> {
    return this.usersService.authenticate(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body() dto: RefreshDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.usersService.refresh(dto.refreshToken);
  }

  @Get()
  findMany(@Query('ids') ids?: string): Promise<PublicUser[]> {
    const parsedIds = (ids ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (parsedIds.length === 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Revisa los campos marcados.',
        fields: { ids: 'Debes indicar al menos un id.' },
      });
    }

    if (parsedIds.length > UsersService.MAX_BATCH_IDS) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Revisa los campos marcados.',
        fields: {
          ids: `No se pueden solicitar más de ${UsersService.MAX_BATCH_IDS} ids por lote.`,
        },
      });
    }

    return this.usersService.findByIds(parsedIds);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<PublicUser> {
    return this.usersService.findById(id);
  }
}
