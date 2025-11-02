

import bcrypt from "bcrypt";

export const PasswordService = {
  async hash(plain: string, rounds?: number): Promise<string> {
    if (typeof plain !== "string" || plain.length === 0) {
      throw new Error("Password must be a non-empty string");
    }

    const envRounds =
      typeof process.env.BCRYPT_SALT_ROUND !== "undefined"
        ? Number(process.env.BCRYPT_SALT_ROUND)
        : typeof process.env.BCRYPT_ROUNDS !== "undefined"
        ? Number(process.env.BCRYPT_ROUNDS)
        : undefined;

    let r = typeof rounds === "number" ? rounds : envRounds;
    if (!Number.isFinite(r) || r <= 0) r = 10;

    return bcrypt.hash(plain, r);
  },

  async compare(plain: string, hashed: string): Promise<boolean> {
    if (typeof plain !== "string" || typeof hashed !== "string") return false;
    return bcrypt.compare(plain, hashed);
  },

  validate(password: string) {
    const errors: string[] = [];
    if (!password || password.length < 8) errors.push("Password must be at least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("Require uppercase");
    if (!/[a-z]/.test(password)) errors.push("Require lowercase");
    if (!/[0-9]/.test(password)) errors.push("Require number");
    return { valid: errors.length === 0, errors };
  },
};

export default PasswordService;