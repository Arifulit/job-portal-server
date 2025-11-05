// import { MongoClient, Db } from 'mongodb';
// import { logger } from '@/app/utils/logger';

// let client: MongoClient | null = null;
// let dbInstance: Db | null = null;

// export const initializeDatabase = async (): Promise<Db> => {
//   if (dbInstance) return dbInstance;

//   const uri = process.env.MONGODB_URI;
//   if (!uri) throw new Error('MONGODB_URI not set');

//   const opts: any = {
//     serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ?? 30000),
//     connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS ?? 30000),
//   };

//   const maxAttempts = Number(process.env.MONGODB_CONNECTION_RETRIES ?? 3);
//   const retryDelayMs = Number(process.env.MONGODB_RETRY_DELAY_MS ?? 2000);

//   let lastErr: any = null;
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       client = new MongoClient(uri, opts);
//       await client.connect();

//       const dbName =
//         process.env.MONGODB_DB ||
//         (() => {
//           try {
//             const u = new URL(uri);
//             return (u.pathname || '').replace(/^\/+/, '') || 'job-portal-api';
//           } catch {
//             return 'job-portal-api';
//           }
//         })();

//       dbInstance = client.db(dbName);

//       // verify connection
//       await dbInstance.admin().ping();

//       logger.info('MongoDB connected', { db: dbName, attempt });
//       return dbInstance;
//     } catch (err: any) {
//       lastErr = err;
//       logger.error(`MongoDB connect attempt ${attempt} failed`, { message: err?.message || err });
//       try { if (client) await client.close(); } catch {}
//       client = null;
//       dbInstance = null;
//       if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, retryDelayMs));
//     }
//   }

//   const hint =
//     'Check MONGODB_URI, network access (Atlas IP whitelist), and proxy env (HTTP_PROXY/HTTPS_PROXY).';
//   throw new Error(`Failed to connect to MongoDB after ${maxAttempts} attempts. ${hint}\nLast error: ${lastErr?.message || lastErr}`);
// };

// export const getDatabase = (): Db => {
//   if (!dbInstance) throw new Error('Database not connected. Call initializeDatabase() first.');
//   return dbInstance;
// };

// export const closeDatabase = async (): Promise<void> => {
//   if (client) await client.close();
//   client = null;
//   dbInstance = null;
// };
import { MongoClient, Db } from 'mongodb';
import { logger } from '@/app/utils/logger';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export const initializeDatabase = async (): Promise<Db> => {
  if (dbInstance) return dbInstance;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  const opts: any = {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ?? 30000),
    connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS ?? 30000),
  };

  client = new MongoClient(uri, opts);
  await client.connect(); // throws on failure
  const dbName =
    process.env.MONGODB_DB ||
    (() => {
      try {
        const u = new URL(uri);
        return (u.pathname || '').replace(/^\/+/, '') || 'job-portal-api';
      } catch {
        return 'job-portal-api';
      }
    })();

  dbInstance = client.db(dbName);
  // verify connection
  await dbInstance.admin().ping();

  logger.info('MongoDB connected', { db: dbName });
  return dbInstance;
};

export const getDatabase = (): Db => {
  if (!dbInstance) throw new Error('Database not connected. Call initializeDatabase() first.');
  return dbInstance;
};

export const closeDatabase = async (): Promise<void> => {
  if (client) await client.close();
  client = null;
  dbInstance = null;
};