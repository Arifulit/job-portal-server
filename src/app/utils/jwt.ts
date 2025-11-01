// import jwt, { SignOptions } from 'jsonwebtoken';
// import { env } from '@/app/config/env';
// import { TokenPayload } from '@/app/types';
// import { UnauthorizedError } from './errors';

// export class JWTService {
//   static generateAccessToken(payload: TokenPayload): string {
//     return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
//       expiresIn: env.JWT_ACCESS_EXPIRY as string,
//     } as SignOptions);
//   }

//   static generateRefreshToken(payload: TokenPayload): string {
//     return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
//       expiresIn: env.JWT_REFRESH_EXPIRY as string,
//     } as SignOptions);
//   }

//   static verifyAccessToken(token: string): TokenPayload {
//     try {
//       return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
//     } catch (error) {
//       throw new UnauthorizedError('Invalid or expired access token');
//     }
//   }

//   static verifyRefreshToken(token: string): TokenPayload {
//     try {
//       return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
//     } catch (error) {
//       throw new UnauthorizedError('Invalid or expired refresh token');
//     }
//   }

//   static generateTokenPair(payload: TokenPayload) {
//     return {
//       accessToken: this.generateAccessToken(payload),
//       refreshToken: this.generateRefreshToken(payload),
//     };
//   }
// }

import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { UnauthorizedError } from './errors'; 

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "change_this_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "change_this_refresh_secret";
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "1d";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "30d";

function normalizeExpires(value: unknown): string | number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) return value;
  return "1d";
}

export const JWTService = {
  generateAccessToken(payload: object) {
    return jwt.sign(
      payload,
      ACCESS_SECRET as Secret,
      { expiresIn: normalizeExpires(ACCESS_EXPIRES) as SignOptions['expiresIn'] }
    );
  },

  generateRefreshToken(payload: object) {
    return jwt.sign(
      payload,
      REFRESH_SECRET as Secret,
      { expiresIn: normalizeExpires(REFRESH_EXPIRES) as SignOptions['expiresIn'] }
    );
  },

  generateTokenPair(payload: object) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    return { accessToken, refreshToken };
  },

 verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (err: any) {
    throw new UnauthorizedError('Invalid or expired access token');
  }
},

 verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (err: any) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
},
};

export default JWTService;
