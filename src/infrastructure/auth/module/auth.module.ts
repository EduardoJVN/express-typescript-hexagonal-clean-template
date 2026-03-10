import { ENV } from '@infra/config/env.config.js';
import { InMemoryTokenBlacklistAdapter } from '@infra/auth/adapters/in-memory-token-blacklist.adapter.js';
import { JwtTokenSignerAdapter } from '@infra/auth/adapters/jwt-token-signer.adapter.js';
import type { ITokenSigner } from '@domain/auth/ports/token-signer.port.js';
import type { ITokenBlacklist } from '@domain/auth/ports/token-blacklist.port.js';

export interface AuthModule {
  tokenSigner: ITokenSigner;
  tokenBlacklist: ITokenBlacklist;
}

export async function createAuthModule(): Promise<AuthModule> {
  // --- Adapters ---
  const tokenBlacklist = new InMemoryTokenBlacklistAdapter();
  const tokenSigner = new JwtTokenSignerAdapter(
    ENV.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ENV.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'),
  );

  return { tokenSigner, tokenBlacklist };
}
