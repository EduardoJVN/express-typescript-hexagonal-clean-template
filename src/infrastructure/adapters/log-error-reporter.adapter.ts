import type { IErrorReporter } from '@domain/ports/error-reporter.port.js';
import type { ILogger } from '@domain/ports/logger.port.js';

export class LogErrorReporter implements IErrorReporter {
  constructor(private readonly logger: ILogger) {}

  report(error: unknown, context?: Record<string, unknown>): void {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    this.logger.error(message, { stack, ...context });
  }
}
