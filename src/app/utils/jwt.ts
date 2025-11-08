
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
