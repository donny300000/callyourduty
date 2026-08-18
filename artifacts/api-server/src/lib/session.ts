import type { Response } from "express";
import { db, sessionsTable } from "@workspace/db";
import { SESSION_COOKIE_NAME } from "../middleware/requireAuth";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/api",
};

export async function createSession(res: Response, userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const [session] = await db.insert(sessionsTable).values({ userId, expiresAt }).returning();

  res.cookie(SESSION_COOKIE_NAME, session!.id, { ...COOKIE_OPTIONS, expires: expiresAt });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, { path: COOKIE_OPTIONS.path });
}
