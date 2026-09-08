import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function createHost(): {
  host: ArgumentsHost;
  status: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const res = { status };
  const host = {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => ({}),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('pasa tal cual una excepción ya en la envolvente {error:{code,message}} (relanzada desde un servicio interno)', () => {
    const { host, status, json } = createHost();
    const exception = new HttpException(
      {
        error: {
          code: 'CAPACITY_EXCEEDED',
          message: 'El evento alcanzó su capacidad máxima.',
        },
      },
      HttpStatus.CONFLICT,
    );

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'CAPACITY_EXCEEDED',
        message: 'El evento alcanzó su capacidad máxima.',
      },
    });
  });

  it('preserva `fields` cuando viene en la envolvente (400 VALIDATION_ERROR)', () => {
    const { host, status, json } = createHost();
    const exception = new BadRequestException({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Revisa los campos marcados.',
        fields: { email: 'Formato de correo inválido' },
      },
    });

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Revisa los campos marcados.',
        fields: { email: 'Formato de correo inválido' },
      },
    });
  });

  it('genera UNAUTHENTICATED cuando la excepción ya trae la envolvente propia (guards del Gateway)', () => {
    const { host, status, json } = createHost();
    const exception = new UnauthorizedException({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Inicia sesión para continuar.',
      },
    });

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Inicia sesión para continuar.',
      },
    });
  });

  it('genera VALIDATION_ERROR razonable para un BadRequestException por defecto de Nest', () => {
    const { host, status, json } = createHost();
    const exception = new BadRequestException('email must be an email');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    const payload = json.mock.calls[0][0];
    expect(payload.error.code).toBe('VALIDATION_ERROR');
  });

  it('genera INTERNAL_ERROR para una excepción no controlada (no HttpException)', () => {
    const { host, status, json } = createHost();

    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocurrió un error inesperado.',
      },
    });
  });
});
