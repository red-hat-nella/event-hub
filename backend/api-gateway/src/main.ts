import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { JsonLoggerService } from './common/json-logger.service';
import { RequestLoggingInterceptor } from './common/request-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new JsonLoggerService(),
  });

  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const fields: Record<string, string> = {};
        for (const error of errors) {
          if (error.constraints) {
            fields[error.property] = Object.values(error.constraints)[0];
          }
        }
        return new BadRequestException({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Revisa los campos marcados.',
            fields,
          },
        });
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // Mismo origen vía Nginx (frontend proxya /api/*): no se requiere CORS.

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
