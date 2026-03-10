import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger } from '../pino-logger.adapter.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePinoSpy(logger: Logger): {
  traceSpy: ReturnType<typeof vi.fn>;
} {
  // Access the private pino instance via casting to reach the internal logger
  const internal = (logger as unknown as { logger: { trace: unknown } }).logger;
  const traceSpy = vi.fn();
  internal.trace = traceSpy;
  return { traceSpy };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Logger (pino adapter)', () => {
  let logger: Logger;

  beforeEach(() => {
    // Use 'trace' level so the trace method is not silenced
    logger = new Logger('trace');
  });

  it('trace() calls pino at trace level without context', () => {
    const { traceSpy } = makePinoSpy(logger);

    logger.trace('a trace message');

    expect(traceSpy).toHaveBeenCalledOnce();
    expect(traceSpy).toHaveBeenCalledWith('a trace message');
  });

  it('trace() passes context as first arg to pino when context is provided', () => {
    const { traceSpy } = makePinoSpy(logger);
    const context = { requestId: 'abc', status: 200 };

    logger.trace('a trace message', context);

    expect(traceSpy).toHaveBeenCalledOnce();
    expect(traceSpy).toHaveBeenCalledWith(context, 'a trace message');
  });
});
