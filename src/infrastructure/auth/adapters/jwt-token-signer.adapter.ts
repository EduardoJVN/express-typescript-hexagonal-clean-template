import jwt from 'jsonwebtoken';
import type { ITokenSigner, TokenPayload } from '@domain/auth/ports/token-signer.port.js';

export class JwtTokenSignerAdapter implements ITokenSigner {
  constructor(
    private readonly privateKey: string,
    private readonly publicKey: string,
  ) {}

  sign(payload: TokenPayload, expiresIn: string): string {
    return jwt.sign(payload, this.privateKey, { algorithm: 'RS256', expiresIn } as jwt.SignOptions);
  }

  verify(token: string): TokenPayload {
    return jwt.verify(token, this.publicKey, { algorithms: ['RS256'] }) as TokenPayload;
  }
}
