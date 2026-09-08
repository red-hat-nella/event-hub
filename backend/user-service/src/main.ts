import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { ValidationError } from 'class-validator';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { JsonLoggerService } from './common/json-logger.service';
import { RequestLoggingInterceptor } from './common/request-logging.interceptor';

/** Aplana los `ValidationError` de class-validator en `{campo: mensaje}`. */
function buildFieldErrors(
  errors: ValidationError[],
  parentPath = '',
): Record<string, string> {
  return errors.reduce<Record<string, string>>((fields, error) => {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      const [firstMessage] = Object.values(error.constraints);
      fields[path] = firstMessage;
    }

    if (error.children && error.children.length > 0) {
      Object.assign(fields, buildFieldErrors(error.children, path));
    }

    return fields;
  }, {});
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: new JsonLoggerService(),
  });

  app.useGlobalInterceptors(new RequestLoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Revisa los campos marcados.',
          fields: buildFieldErrors(errors),
        }),
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

void bootstrap();
