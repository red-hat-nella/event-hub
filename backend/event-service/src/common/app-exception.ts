import { HttpException, HttpStatus } from '@nestjs/common';

export type ErrorFields = Record<string, string>;

/**
 * Excepción base del servicio. Su `getResponse()` siempre trae `{code, message, fields?}`,
 * que `HttpExceptionFilter` traduce a la envolvente uniforme `{error:{code,message,fields?}}`.
 */
export class AppException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus,
    public readonly fields?: ErrorFields,
  ) {
    super({ code, message, ...(fields ? { fields } : {}) }, status);
  }
}

export class ValidationException extends AppException {
  constructor(fields: ErrorFields, message = 'Revisa los campos marcados.') {
    super('VALIDATION_ERROR', message, HttpStatus.BAD_REQUEST, fields);
  }
}

export class NotFoundAppException extends AppException {
  constructor(message = 'Este recurso ya no está disponible.') {
    super('NOT_FOUND', message, HttpStatus.NOT_FOUND);
  }
}

export class CapacityExceededException extends AppException {
  constructor() {
    super(
      'CAPACITY_EXCEEDED',
      'El evento alcanzó su capacidad máxima.',
      HttpStatus.CONFLICT,
    );
  }
}

export class EventAlreadyStartedException extends AppException {
  constructor() {
    super(
      'EVENT_ALREADY_STARTED',
      'Las inscripciones para este evento están cerradas.',
      HttpStatus.CONFLICT,
    );
  }
}

export class CapacityBelowActiveRegistrationsException extends AppException {
  constructor() {
    super(
      'CAPACITY_BELOW_ACTIVE_REGISTRATIONS',
      'La nueva capacidad es menor que los inscritos activos.',
      HttpStatus.CONFLICT,
    );
  }
}

export class UnauthorizedInternalException extends AppException {
  constructor() {
    super(
      'UNAUTHORIZED',
      'Token de servicio inválido.',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
