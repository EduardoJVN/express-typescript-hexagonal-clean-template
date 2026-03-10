export interface IErrorReporter {
  report(error: unknown, context?: Record<string, unknown>): void;
}
