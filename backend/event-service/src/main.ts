import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { ValidationError } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { ValidationException } from './common/app-exception';
import { JsonLoggerService } from './common/json-logger.service';
import { RequestLoggingInterceptor } from './common/request-logging.interceptor';

function buildFieldErrors(
  errors: ValidationError[],
  parentPath = '',
): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const error of errors) {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      fields[path] = Object.values(error.constraints)[0];
    }

    if (error.children && error.children.length > 0) {
      Object.assign(fields, buildFieldErrors(error.children, path));
    }
  }

  return fields;
}

async function bootstrap() {
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
        new ValidationException(buildFieldErrors(errors)),
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
