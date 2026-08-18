import type { NextFunction, Request, Response } from "express";
import { eq, gt, and } from "drizzle-orm";
import { db, sessionsTable } from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export const SESSION_COOKIE_NAME = "cyd_session";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (typeof sessionId !== "string") {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.id, sessionId), gt(sessionsTable.expiresAt, new Date())));

  if (!session) {
    res.clearCookie(SESSION_COOKIE_NAME, { path: "/api" });
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  req.userId = session.userId;
  next();
}
