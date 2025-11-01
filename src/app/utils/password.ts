

// import bcrypt from "bcrypt";

// /**
//  * Password helper with safe defaults.
//  * Ensures salt rounds is a valid number (default 10) and never undefined.
//  */
// export const PasswordService = {
//   async hash(plain: string, rounds?: number): Promise<string> {
//     if (typeof plain !== "string" || plain.length === 0) {
//       throw new Error("Password must be a non-empty string");
//     }

//     // priority: explicit arg -> env BCRYPT_SALT_ROUND -> env BCRYPT_ROUNDS -> 10
//     const envRounds =
//       typeof process.env.BCRYPT_SALT_ROUND !== "undefined"
//         ? Number(process.env.BCRYPT_SALT_ROUND)
//         : typeof process.env.BCRYPT_ROUNDS !== "undefined"
//         ? Number(process.env.BCRYPT_ROUNDS)
//         : undefined;

//     let r = typeof rounds === "number" ? rounds : envRounds;
//     // ensure r is a finite positive number; use default if undefined/invalid
//     if (!Number.isFinite(r ?? NaN) || (r ?? 0) <= 0) r = 10; // safe default

//     const roundsToUse: number = Number.isFinite(r ?? NaN) && (r ?? 0) > 0 ? Number(r) : 10;

//     try {
//       return await bcrypt.hash(plain, roundsToUse);
//     } catch (err: any) {
//       // wrap with clearer message for controller logs
//       throw new Error(`Password hashing failed: ${err?.message || String(err)}`);
//     }
//   },

//   async compare(plain: string, hashed: string): Promise<boolean> {
//     if (typeof plain !== "string" || typeof hashed !== "string") return false;
//     try {
//       return await bcrypt.compare(plain, hashed);
//     } catch (err: any) {
//       // on error, return false (caller will treat as invalid credentials)
//       return false;
//     }
//   },
// };

// export default PasswordService;

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