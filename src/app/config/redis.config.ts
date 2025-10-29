// // ...existing code...
// import { promises as dns } from "dns";

// /**
//  * Optional Redis connector with safer error handling.
//  * - Skips if REDIS_HOST not set.
//  * - Performs DNS lookup before connecting.
//  * - On auth failure (WRONGPASS) logs actionable message and tries a one-time fallback without username.
//  * - Does not throw on failure; app continues without Redis.
//  */
// export async function connectRedis(): Promise<void> {
//   const host = process.env.REDIS_HOST;
//   if (!host) {
//     console.log("Redis not configured (REDIS_HOST not set) — skipping Redis connection.");
//     return;
//   }

//   // DNS check
//   try {
//     await dns.lookup(host);
//   } catch (err: any) {
//     console.warn(`⚠️  Redis host DNS lookup failed for "${host}" — skipping Redis connection.`);
//     return;
//   }

//   const tryConnect = async (opts: any) => {
//     const redisPkg: any = await import("redis");
//     const createClient = redisPkg.createClient;
//     const client = createClient(opts);

//     client.on("error", (e: any) => {
//       // log error message only (avoid printing credentials)
//       console.error("Redis Client Error:", e?.message || e);
//     });

//     await client.connect();
//     return client;
//   };

//   const baseOpts = {
//     socket: {
//       host,
//       port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
//     },
//     username: process.env.REDIS_USERNAME || undefined,
//     password: process.env.REDIS_PASSWORD || undefined,
//   };

//   try {
//     const client = await tryConnect(baseOpts);
//     (global as any).redisClient = client;
//     console.log(`✅ Redis connected (${host})`);
//     return;
//   } catch (err: any) {
//     const msg = err?.message || String(err);
//     // Auth error handling
//     if (/WRONGPASS/i.test(msg) || /invalid username-password pair/i.test(msg)) {
//       console.error("❌ Redis authentication failed (WRONGPASS). Check REDIS_USERNAME / REDIS_PASSWORD in your .env.");
//       // one-time fallback: try without username if username was provided
//       if (process.env.REDIS_USERNAME) {
//         console.info("ℹ️  Retrying Redis connection without username (fallback)...");
//         try {
//           const fallbackOpts = {
//             ...baseOpts,
//             username: undefined,
//           };
//           const client2 = await tryConnect(fallbackOpts);
//           (global as any).redisClient = client2;
//           console.log(`✅ Redis connected (fallback without username) — ${host}`);
//           return;
//         } catch (err2: any) {
//           console.error("❌ Redis fallback connection failed:", err2?.message || err2);
//         }
//       }
//     } else {
//       console.error("⚠️  Failed to connect to Redis (continuing without Redis):", msg);
//     }
//     // continue without Redis
//     return;
//   }
// }
// // ...existing code...