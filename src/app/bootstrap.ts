// এই ফাইলটি shared bootstrap layer: DB ensure, API handler, এবং local HTTP server starter।
import { createServer, Server } from "http";
import mongoose from "mongoose";
import type { AddressInfo } from "net";
import app from "../app";
import { connectDB } from "./config/database";
import { env } from "./config/env";
import { initSocketServer } from "./integrations/socket";

const isHealthRequest = (url?: string) => {
	if (!url) return false;
	return url === "/health" || url === "/api/v1/health";
};

export const ensureMongoConnection = async () => {
	if (mongoose.connection.readyState === 1) {
		return;
	}

	await connectDB();
};

export const createApiHandler = async (req: any, res: any) => {
	if (!isHealthRequest(req?.url)) {
		await ensureMongoConnection();
	}

	return app(req, res);
};

export const startHttpServer = async (): Promise<Server> => {
	await ensureMongoConnection();

	const httpServer = createServer(app);
	initSocketServer(httpServer);

	const basePort = env.PORT;
	const maxAttempts = 10;

	const listenWithFallback = (port: number, attempt = 0): Promise<void> =>
		new Promise((resolve, reject) => {
			const onListening = () => {
				httpServer.off("error", onError);
				const address = httpServer.address() as AddressInfo | null;
				const activePort = address?.port ?? port;
				console.log(`Server is listening on port ${activePort}`);
				console.log(`Socket.IO is ready on ws://localhost:${activePort}`);
				resolve();
			};

			const onError = (error: NodeJS.ErrnoException) => {
				httpServer.off("listening", onListening);
				if (error.code === "EADDRINUSE" && attempt < maxAttempts) {
					const nextPort = port + 1;
					console.warn(
						`Port ${port} is busy. Retrying on port ${nextPort}...`,
					);
					setImmediate(() => {
						void listenWithFallback(nextPort, attempt + 1)
							.then(resolve)
							.catch(reject);
					});
					return;
				}
				reject(error);
			};

			httpServer.once("listening", onListening);
			httpServer.once("error", onError);
			httpServer.listen(port);
		});

	await listenWithFallback(basePort);

	return httpServer;
};