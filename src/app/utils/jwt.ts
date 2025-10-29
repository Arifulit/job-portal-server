import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/app/config/env';
import { TokenPayload } from '@/app/types';
import { UnauthorizedError } from './errors';

export class JWTService {
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY as string,
    } as SignOptions);
  }

  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY as string,
    } as SignOptions);
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  static generateTokenPair(payload: TokenPayload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }
}
