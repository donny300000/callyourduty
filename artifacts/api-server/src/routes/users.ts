import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, groupMembersTable, poopLogsTable } from "@workspace/db";
import {
  CreateUserBody,
  CreateUserResponse,
  GetUserParams,
  GetUserResponse,
  GetUserSummaryParams,
  GetUserSummaryResponse,
} from "@workspace/api-zod";
import { randomAvatarColor, computeLongestStreakDays } from "../lib/poopHelpers";

const router: IRouter = Router();

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({ name: parsed.data.name, avatarColor: randomAvatarColor() })
    .returning();

  res.status(201).json(CreateUserResponse.parse(user));
});

router.get("/users/:userId", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetUserResponse.parse(user));
});

router.get("/users/:userId/summary", async (req, res): Promise<void> => {
  const params = GetUserSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const logs = await db
    .select()
    .from(poopLogsTable)
    .where(eq(poopLogsTable.userId, params.data.userId));

  const groupMemberships = await db
    .select()
    .from(groupMembersTable)
    .where(eq(groupMembersTable.userId, params.data.userId));

  const totalLogs = logs.length;
  const averageOverall =
    totalLogs === 0
      ? null
      : Math.round((logs.reduce((sum, l) => sum + l.overallScore, 0) / totalLogs) * 100) / 100;

  const spotCounts = new Map<string, number>();
  for (const log of logs) {
    if (log.locationName) {
      spotCounts.set(log.locationName, (spotCounts.get(log.locationName) ?? 0) + 1);
    }
  }
  let favoriteSpot: string | null = null;
  let bestCount = 0;
  for (const [spot, count] of spotCounts) {
    if (count > bestCount) {
      favoriteSpot = spot;
      bestCount = count;
    }
  }

  const longestStreakDays = computeLongestStreakDays(logs.map((l) => l.createdAt));

  res.json(
    GetUserSummaryResponse.parse({
      totalLogs,
      averageOverall,
      longestStreakDays,
      favoriteSpot,
      groupCount: groupMemberships.length,
    }),
  );
});

export default router;
