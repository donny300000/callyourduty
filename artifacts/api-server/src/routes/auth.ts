import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, usersTable, sessionsTable } from "@workspace/db";
import { SignupBody, SignupResponse, LoginBody, LoginResponse, GetCurrentUserResponse } from "@workspace/api-zod";
import { randomAvatarColor } from "../lib/poopHelpers";
import { createSession, clearSessionCookie } from "../lib/session";
import { requireAuth, SESSION_COOKIE_NAME } from "../middleware/requireAuth";

const router: IRouter = Router();
const PASSWORD_HASH_ROUNDS = 12;

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email));
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, PASSWORD_HASH_ROUNDS);

  const [user] = await db
    .insert(usersTable)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      avatarColor: randomAvatarColor(),
    })
    .returning();

  await createSession(res, user!.id);

  res.status(201).json(SignupResponse.parse(user));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email));
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  await createSession(res, user.id);

  res.json(LoginResponse.parse(user));
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (typeof sessionId === "string") {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
  }

  clearSessionCookie(res);
  res.sendStatus(204);
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json(GetCurrentUserResponse.parse(user));
});

export default router;
