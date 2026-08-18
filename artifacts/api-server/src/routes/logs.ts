import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, poopLogsTable, usersTable } from "@workspace/db";
import { ListLogsResponse, CreateLogBody, CreateLogResponse, GetLogParams, GetLogResponse, DeleteLogParams } from "@workspace/api-zod";
import { computeOverallScore } from "../lib/poopHelpers";

const router: IRouter = Router();

function serializeLog(log: typeof poopLogsTable.$inferSelect, userName: string, avatarColor: string) {
  return {
    id: log.id,
    userId: log.userId,
    userName,
    avatarColor,
    groupId: log.groupId,
    lat: log.lat,
    lng: log.lng,
    locationName: log.locationName,
    notes: log.notes,
    ratings: {
      speed: log.ratingSpeed,
      comfort: log.ratingComfort,
      privacy: log.ratingPrivacy,
      ambiance: log.ratingAmbiance,
      relief: log.ratingRelief,
    },
    overallScore: log.overallScore,
    createdAt: log.createdAt,
  };
}

router.get("/logs", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));

  const logs = await db
    .select()
    .from(poopLogsTable)
    .where(eq(poopLogsTable.userId, req.userId))
    .orderBy(poopLogsTable.createdAt);

  const result = logs
    .slice()
    .reverse()
    .map((log) => serializeLog(log, user?.name ?? "Unknown", user?.avatarColor ?? "#8B5E3C"));

  res.json(ListLogsResponse.parse(result));
});

router.post("/logs", async (req, res): Promise<void> => {
  const parsed = CreateLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const overallScore = computeOverallScore(parsed.data.ratings);

  const [log] = await db
    .insert(poopLogsTable)
    .values({
      userId: req.userId,
      groupId: parsed.data.groupId ?? null,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      locationName: parsed.data.locationName ?? null,
      notes: parsed.data.notes ?? null,
      ratingSpeed: parsed.data.ratings.speed,
      ratingComfort: parsed.data.ratings.comfort,
      ratingPrivacy: parsed.data.ratings.privacy,
      ratingAmbiance: parsed.data.ratings.ambiance,
      ratingRelief: parsed.data.ratings.relief,
      overallScore,
    })
    .returning();

  res.status(201).json(CreateLogResponse.parse(serializeLog(log!, user.name, user.avatarColor)));
});

router.get("/logs/:logId", async (req, res): Promise<void> => {
  const params = GetLogParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [log] = await db.select().from(poopLogsTable).where(eq(poopLogsTable.id, params.data.logId));
  if (!log) {
    res.status(404).json({ error: "Log not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, log.userId));

  res.json(GetLogResponse.parse(serializeLog(log, user?.name ?? "Unknown", user?.avatarColor ?? "#8B5E3C")));
});

router.delete("/logs/:logId", async (req, res): Promise<void> => {
  const params = DeleteLogParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [log] = await db.delete(poopLogsTable).where(eq(poopLogsTable.id, params.data.logId)).returning();

  if (!log) {
    res.status(404).json({ error: "Log not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
