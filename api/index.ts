// এই ফাইলটি Vercel serverless entry point; request এ shared app handler execute করে।
import { createApiHandler } from "../src/app/bootstrap";

export default async function handler(req: any, res: any) {
	try {
		return await createApiHandler(req, res);
	} catch (error) {
		console.error("Vercel bootstrap error:", error);
		if (!res.headersSent) {
			return res.status(500).json({
				success: false,
				message: "Server initialization failed",
			});
		}
		return undefined;
	}
}