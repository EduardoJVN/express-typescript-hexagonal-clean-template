import type { ITokenBlacklist } from '@domain/auth/ports/token-blacklist.port.js';

export class InMemoryTokenBlacklistAdapter implements ITokenBlacklist {
  private readonly store: Map<string, Date> = new Map();

  async add(token: string, expiresAt: Date): Promise<void> {
    this.store.set(token, expiresAt);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    return this.store.has(token);
  }
}
