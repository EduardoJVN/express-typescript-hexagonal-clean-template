import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('env.config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  const prodEnv = () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_PRIVATE_KEY = 'my-private-key';
    process.env.JWT_PUBLIC_KEY = 'my-public-key';
    process.env.DATABASE_URL =
      'postgresql://testuser:testpass@localhost:6543/testdb?pgbouncer=true';
    process.env.DIRECT_URL = 'postgresql://testuser:testpass@localhost:5432/testdb';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  };

  it('populates JWT_PRIVATE_KEY and JWT_PUBLIC_KEY when both are present', async () => {
    prodEnv();

    const { ENV } = await import('@infra/config/env.config.js');

    expect(ENV.JWT_PRIVATE_KEY).toBe('my-private-key');
    expect(ENV.JWT_PUBLIC_KEY).toBe('my-public-key');
  });

  it('populates DATABASE_URL and DIRECT_URL when both are present', async () => {
    prodEnv();

    const { ENV } = await import('@infra/config/env.config.js');

    expect(ENV.DATABASE_URL).toBe(
      'postgresql://testuser:testpass@localhost:6543/testdb?pgbouncer=true',
    );
    expect(ENV.DIRECT_URL).toBe('postgresql://testuser:testpass@localhost:5432/testdb');
  });

  it('throws when JWT_PRIVATE_KEY is missing in non-test env', async () => {
    prodEnv();
    delete process.env.JWT_PRIVATE_KEY;

    await expect(import('@infra/config/env.config.js')).rejects.toThrow(
      'Missing required environment variable: JWT_PRIVATE_KEY',
    );
  });

  it('throws when JWT_PUBLIC_KEY is missing in non-test env', async () => {
    prodEnv();
    delete process.env.JWT_PUBLIC_KEY;

    await expect(import('@infra/config/env.config.js')).rejects.toThrow(
      'Missing required environment variable: JWT_PUBLIC_KEY',
    );
  });

  it('throws when DATABASE_URL is missing in non-test env', async () => {
    prodEnv();
    delete process.env.DATABASE_URL;

    await expect(import('@infra/config/env.config.js')).rejects.toThrow(
      'Missing required environment variable: DATABASE_URL',
    );
  });

  it('throws when DIRECT_URL is missing in non-test env', async () => {
    prodEnv();
    delete process.env.DIRECT_URL;

    await expect(import('@infra/config/env.config.js')).rejects.toThrow(
      'Missing required environment variable: DIRECT_URL',
    );
  });

  it('throws when FRONTEND_URL is missing in non-test env', async () => {
    prodEnv();
    delete process.env.FRONTEND_URL;

    await expect(import('@infra/config/env.config.js')).rejects.toThrow(
      'Missing required environment variable: FRONTEND_URL',
    );
  });

  it('throws when FRONTEND_URL is not a valid URL in non-test env', async () => {
    prodEnv();
    process.env.FRONTEND_URL = 'not-a-url';

    await expect(import('@infra/config/env.config.js')).rejects.toThrow(
      'Missing required environment variable: FRONTEND_URL',
    );
  });

  it('defaults LOG_LEVEL to "info" when not set', async () => {
    prodEnv();
    delete process.env.LOG_LEVEL;

    const { ENV } = await import('@infra/config/env.config.js');

    expect(ENV.LOG_LEVEL).toBe('info');
  });

  it('accepts all valid LOG_LEVEL values', async () => {
    const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;

    for (const level of validLevels) {
      prodEnv();
      process.env.LOG_LEVEL = level;
      vi.resetModules();

      const { ENV } = await import('@infra/config/env.config.js');
      expect(ENV.LOG_LEVEL).toBe(level);
      vi.resetModules();
    }
  });

  it('throws when LOG_LEVEL has an invalid value', async () => {
    prodEnv();
    process.env.LOG_LEVEL = 'verbose';

    await expect(import('@infra/config/env.config.js')).rejects.toThrow(
      'Missing required environment variable: LOG_LEVEL',
    );
  });
});
