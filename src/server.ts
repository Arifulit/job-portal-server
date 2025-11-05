// // ...existing code...
// import dotenv from 'dotenv';
// dotenv.config();

// import { validateEnv } from './app/config/validateEnv';
// validateEnv(); // validate env before anything else

// import app from './app';
// import { initializeDatabase } from './app/config/database';

// const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

// let server: ReturnType<typeof app.listen> | null = null;

// const startServer = async () => {
//   try {
//     // Connect to DB (must complete before mounting routes that use db)
//     await initializeDatabase();

//     server = app.listen(PORT, () => {
//       console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'production'} mode`);
//       console.log(`📡 API Base URL: http://localhost:${PORT}/api/v1`);
//     });

//     // Graceful shutdown handlers
//     const shutdown = (signal?: string, err?: any) => {
//       console.log(`\n🛑 Received ${signal || 'shutdown'}, closing server...`);
//       if (server) {
//         server.close(() => {
//           console.log('Server closed');
//           process.exit(err ? 1 : 0);
//         });
//       } else {
//         process.exit(err ? 1 : 0);
//       }
//       // fallback timeout
//       setTimeout(() => process.exit(1), 10000).unref();
//     };

//     process.on('SIGINT', () => shutdown('SIGINT'));
//     process.on('SIGTERM', () => shutdown('SIGTERM'));

//     // Unhandled rejections / exceptions
//     process.on('unhandledRejection', (reason: any) => {
//       console.error('❌ Unhandled Promise Rejection:', reason?.message || reason);
//       shutdown('unhandledRejection', reason);
//     });

//     process.on('uncaughtException', (err: any) => {
//       console.error('❌ Uncaught Exception:', err?.message || err);
//       shutdown('uncaughtException', err);
//     });
//   } catch (error: any) {
//     console.error('❌ Failed to start server:', error?.message || error);
//     process.exit(1);
//   }
// };

// startServer();
// // ...existing code...

import dotenv from 'dotenv';
dotenv.config();

import { validateEnv } from './app/config/validateEnv';
validateEnv(); // validate env before anything else

import { initializeDatabase } from './app/config/database';

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

let server: ReturnType<() => any> | null = null;

const startServer = async () => {
  try {
    // MUST initialize DB before importing/using app (so handlers using getDatabase() run after connect)
    await initializeDatabase();

    // import app AFTER DB is initialized to avoid handlers/services running DB ops at module-load time
    const app = (await import('./app')).default;

    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'production'} mode`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api/v1`);
    });

    const shutdown = (signal?: string, err?: any) => {
      console.log(`\n🛑 Received ${signal || 'shutdown'}, closing server...`);
      if (server) server.close(() => process.exit(err ? 1 : 0));
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('unhandledRejection', (reason: any) => {
      console.error('❌ Unhandled Promise Rejection:', reason?.message || reason);
      shutdown('unhandledRejection', reason);
    });

    process.on('uncaughtException', (err: any) => {
      console.error('❌ Uncaught Exception:', err?.message || err);
      shutdown('uncaughtException', err);
    });
  } catch (error: any) {
    console.error('❌ Failed to start server:', error?.message || error);
    process.exit(1);
  }
};

startServer();