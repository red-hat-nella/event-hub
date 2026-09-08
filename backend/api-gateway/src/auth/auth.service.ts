import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  callInternalService,
  internalHeaders,
} from '../common/internal-http.util';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthenticateResult {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

/**
 * Cliente HTTP hacia `user-service`. Toda llamada saliente agrega la
 * cabecera `X-Internal-Token` (`research.md §7`).
 */
@Injectable()
export class AuthService {
  private readonly baseUrl: string;
  private readonly internalToken: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('USER_SERVICE_URL') ?? '';
    this.internalToken =
      this.config.get<string>('INTERNAL_SERVICE_TOKEN') ?? '';
  }

  private headers() {
    return { headers: internalHeaders(this.internalToken) };
  }

  register(dto: RegisterDto): Promise<UserProfile & { createdAt: string }> {
    return callInternalService(
      this.http.post(`${this.baseUrl}/internal/users`, dto, this.headers()),
    );
  }

  authenticate(dto: LoginDto): Promise<AuthenticateResult> {
    return callInternalService(
      this.http.post(
        `${this.baseUrl}/internal/users/authenticate`,
        dto,
        this.headers(),
      ),
    );
  }

  refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return callInternalService(
      this.http.post(
        `${this.baseUrl}/internal/users/refresh`,
        { refreshToken },
        this.headers(),
      ),
    );
  }

  findById(id: string): Promise<UserProfile> {
    return callInternalService(
      this.http.get(`${this.baseUrl}/internal/users/${id}`, this.headers()),
    );
  }
}
