export interface TokenPayload {
  sub: string;
  email: string;
}

export interface ITokenSigner {
  sign(payload: TokenPayload, expiresIn: string): string;
  verify(token: string): TokenPayload; // throws if invalid/expired
}
