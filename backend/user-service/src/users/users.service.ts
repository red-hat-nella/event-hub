import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

const BCRYPT_COST = 12;
const ACCESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = '7d';
const MAX_BATCH_IDS = 100;
// Hash bcrypt fijo (contraseña arbitraria, sin significado) usado únicamente
// para que `authenticate` consuma un tiempo de cómputo similar cuando el
// correo no existe, evitando distinguir por temporización si la cuenta
// existe o no.
const DUMMY_PASSWORD_HASH =
  '$2b$12$wGwBzdiC2r01E7BokPcfS.cOQ.HLkshxWzBgPrg5VuMkCgL7lW0IO';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface CreatedUser extends PublicUser {
  createdAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

interface RefreshTokenPayload {
  sub: string;
  tokenUse: 'refresh';
}

/** Violación de restricción única de Prisma (índice `email`). */
const PRISMA_UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class UsersService {
  static readonly MAX_BATCH_IDS = MAX_BATCH_IDS;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async create(dto: CreateUserDto): Promise<CreatedUser> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
        },
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      };
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === PRISMA_UNIQUE_VIOLATION
      ) {
        throw new ConflictException({
          code: 'EMAIL_IN_USE',
          message: 'El correo ya está en uso.',
        });
      }

      throw error;
    }
  }

  async authenticate(email: string, password: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    const passwordMatches = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Correo o contraseña incorrectos.',
      });
    }

    const publicUser: PublicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return {
      user: publicUser,
      ...this.issueTokenPair(publicUser),
    };
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: RefreshTokenPayload;

    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'La sesión expiró. Inicia sesión nuevamente.',
      });
    }

    if (payload.tokenUse !== 'refresh') {
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'La sesión expiró. Inicia sesión nuevamente.',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'La sesión expiró. Inicia sesión nuevamente.',
      });
    }

    return this.issueTokenPair({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }

  async findById(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Usuario no encontrado.',
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async findByIds(ids: string[]): Promise<PublicUser[]> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids.slice(0, MAX_BATCH_IDS) } },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  }

  private issueTokenPair(user: PublicUser): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessTokenPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      sub: user.id,
      tokenUse: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: process.env.JWT_SECRET,
      expiresIn: ACCESS_TOKEN_TTL,
    });

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: process.env.JWT_SECRET,
      expiresIn: REFRESH_TOKEN_TTL,
    });

    return { accessToken, refreshToken };
  }
}
