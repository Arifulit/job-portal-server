
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
    // socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS ?? 360000),
    // TLS is automatic for mongodb+srv URIs; keep options minimal and let driver handle SRV
  };

  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      client = new MongoClient(uri, opts);
      await client.connect();
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
      logger.info('MongoDB connected', { db: dbName, attempt });
      return dbInstance;
    } catch (err: any) {
      logger.warn(`MongoDB connect attempt ${attempt} failed: ${err?.message || err}`);
      if (client) {
        try {
          await client.close();
        } catch {}
        client = null;
      }
      if (attempt >= maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }

  // unreachable
  throw new Error('Failed to initialize MongoDB');
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
