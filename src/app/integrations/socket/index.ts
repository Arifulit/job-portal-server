import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { getJobRecommendations } from "../openai/jobRecommender";
import logger from "../../utils/logger";

let ioRef: SocketIOServer | null = null;

export function emitToUser(userId: string, event: string, payload: unknown): void {
  if (!ioRef) return;
  ioRef.to(`user:${userId}`).emit(event, payload);
}

// Extend SocketData so Socket.data picks up the typed user property
declare module "socket.io" {
  interface SocketData {
    user: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
    // Allow the client to send the token in auth or as a query param
    transports: ["websocket", "polling"],
  });

  ioRef = io;

  // -------------------------------------------------------------------------
  // Socket.IO auth middleware — verifies JWT before any event is processed
  // -------------------------------------------------------------------------
  io.use((socket: Socket, next) => {
    const token =
      (socket.handshake.auth?.token as string) ||
      (socket.handshake.query?.token as string);

    if (!token) {
      return next(new Error("Authentication required: no token provided"));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as Record<string, unknown>;
      if (!decoded.id) {
        return next(new Error("Invalid token: missing user id"));
      }

      let role = (String(decoded.role || "candidate")).toLowerCase().trim();
      if (role === "user") role = "candidate";
      if (role === "super_admin") role = "admin";

      socket.data.user = {
        id: String(decoded.id),
        email: String(decoded.email || ""),
        role,
      };

      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  // -------------------------------------------------------------------------
  // Connection handler
  // -------------------------------------------------------------------------
  io.on("connection", (socket: Socket) => {
    const { id, role } = socket.data.user;
    logger.info(`[Socket] connected  user=${id}  role=${role}  sid=${socket.id}`);

    // Join a per-user room for private realtime events (chat, notifications, etc.)
    socket.join(`user:${id}`);

    // Candidates get recommendation events; recruiters/admin stay connected for chat.
    if (role === "candidate") {
      // Auto-push recommendations immediately on connect
      pushRecommendations(socket);

      // Client can request a manual refresh (e.g. after updating profile)
      socket.on("get_recommendations", () => {
        logger.info(`[Socket] get_recommendations requested  user=${id}`);
        pushRecommendations(socket);
      });
    }

    socket.on("disconnect", (reason) => {
      logger.info(`[Socket] disconnected  user=${id}  reason=${reason}`);
    });
  });

  return io;
}

// ---------------------------------------------------------------------------
// Helper — run the recommendation pipeline and emit the result
// ---------------------------------------------------------------------------
async function pushRecommendations(socket: Socket): Promise<void> {
  const candidateUserId = socket.data.user.id;

  try {
    socket.emit("recommendations_loading", true);

    const jobs = await getJobRecommendations(candidateUserId, 10);

    socket.emit("job_recommendations", {
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to generate recommendations";

    logger.error(`[Socket] recommendation error  user=${candidateUserId}: ${message}`);

    socket.emit("job_recommendations", {
      success: false,
      message,
      data: [],
    });
  } finally {
    socket.emit("recommendations_loading", false);
  }
}
