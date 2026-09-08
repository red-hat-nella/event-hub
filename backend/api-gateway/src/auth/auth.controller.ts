import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from './current-user.decorator';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const DEFAULT_ACCESS_TTL_MS = 30 * 60 * 1000;
const DEFAULT_REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Implementa exactamente `contracts/api-gateway.md` § Autenticación.
 */
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.authenticate(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
    };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req as Request & { cookies: Record<string, string> })
      .cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException({
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Tu sesión expiró, vuelve a iniciar sesión.',
        },
      });
    }

    const result = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { status: 'ok' };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.cookieOptions(0));
    res.clearCookie(REFRESH_TOKEN_COOKIE, this.cookieOptions(0));
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.authService.findById(user.id);
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
    };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const accessTtl = Number(
      process.env.ACCESS_TOKEN_TTL_MS ?? DEFAULT_ACCESS_TTL_MS,
    );
    const refreshTtl = Number(
      process.env.REFRESH_TOKEN_TTL_MS ?? DEFAULT_REFRESH_TTL_MS,
    );
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, this.cookieOptions(accessTtl));
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      this.cookieOptions(refreshTtl),
    );
  }

  private cookieOptions(maxAge: number): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    };
  }
}
