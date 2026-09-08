import { HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import type { Observable } from 'rxjs';
import type { AxiosResponse } from 'axios';

/**
 * Ejecuta una llamada saliente (via HttpService/axios) hacia uno de los
 * servicios internos y normaliza los errores per
 * `contracts/api-gateway.md` § Convenciones:
 * - Si el servicio interno respondió con un error HTTP, se relanza tal cual
 *   (misma envolvente `{error:{code,message,fields}}`, mismo status).
 * - Si no hubo respuesta (timeout/red), se lanza 503 SERVICE_UNAVAILABLE.
 */
export async function callInternalService<T>(
  request: Observable<AxiosResponse<T>>,
): Promise<T> {
  try {
    const response = await firstValueFrom(request);
    return response.data;
  } catch (error) {
    const axiosError = error as {
      response?: { status: number; data: unknown };
    };
    if (axiosError?.response) {
      throw new HttpException(
        axiosError.response.data as Record<string, unknown>,
        axiosError.response.status,
      );
    }
    throw new HttpException(
      {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'El servicio no está disponible temporalmente.',
        },
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export function internalHeaders(token: string): Record<string, string> {
  return { 'X-Internal-Token': token };
}
