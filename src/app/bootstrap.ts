// এই ফাইলটি shared bootstrap layer: DB ensure, API handler, এবং local HTTP server starter।
import { createServer, Server } from "http";
import mongoose from "mongoose";
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

	const port = env.PORT;
	httpServer.listen(port, () => {
		console.log(`Server is listening on port ${port}`);
		console.log(`Socket.IO is ready on ws://localhost:${port}`);
	});

	return httpServer;
};