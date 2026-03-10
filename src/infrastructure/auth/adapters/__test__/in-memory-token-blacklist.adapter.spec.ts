import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryTokenBlacklistAdapter } from '@infra/auth/adapters/in-memory-token-blacklist.adapter.js';

describe('InMemoryTokenBlacklistAdapter', () => {
  let adapter: InMemoryTokenBlacklistAdapter;

  beforeEach(() => {
    adapter = new InMemoryTokenBlacklistAdapter();
  });

  it('returns false for a token that has not been blacklisted', async () => {
    const result = await adapter.isBlacklisted('some-token');
    expect(result).toBe(false);
  });

  it('returns true for a token that has been added to the blacklist', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    await adapter.add('my-token', expiresAt);

    const result = await adapter.isBlacklisted('my-token');
    expect(result).toBe(true);
  });

  it('adding multiple tokens blacklists each independently', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    await adapter.add('token-a', expiresAt);
    await adapter.add('token-b', expiresAt);

    expect(await adapter.isBlacklisted('token-a')).toBe(true);
    expect(await adapter.isBlacklisted('token-b')).toBe(true);
    expect(await adapter.isBlacklisted('token-c')).toBe(false);
  });
});
