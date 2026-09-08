import { ConsoleLogger, LogLevel } from '@nestjs/common';

/**
 * Logger JSON estructurado (research.md §18, plan.md §13). Cada línea es un
 * objeto JSON con timestamp/nivel/contexto/mensaje, apto para agregación por
 * la plataforma sin depender de un stack de observabilidad propio.
 */
export class JsonLoggerService extends ConsoleLogger {
  protected formatMessage(
    level: LogLevel,
    message: unknown,
    context: string,
  ): string {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message: typeof message === 'string' ? message : JSON.stringify(message),
    };
    return JSON.stringify(entry) + '\n';
  }

  protected printMessages(
    messages: unknown[],
    context = '',
    logLevel: LogLevel = 'log',
  ): void {
    for (const message of messages) {
      process.stdout.write(this.formatMessage(logLevel, message, context));
    }
  }
}
