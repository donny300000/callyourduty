import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, groupsTable, groupMembersTable, usersTable, poopLogsTable } from "@workspace/db";
import {
  ListGroupsResponse,
  CreateGroupBody,
  CreateGroupResponse,
  JoinGroupBody,
  JoinGroupResponse,
  GetGroupParams,
  GetGroupResponse,
  ListGroupLogsParams,
  ListGroupLogsResponse,
  GetGroupLeaderboardParams,
  GetGroupLeaderboardResponse,
} from "@workspace/api-zod";
import { generateInviteCode } from "../lib/poopHelpers";

const router: IRouter = Router();

router.get("/groups", async (req, res): Promise<void> => {
  const memberships = await db
    .select()
    .from(groupMembersTable)
    .where(eq(groupMembersTable.userId, req.userId));

  if (memberships.length === 0) {
    res.json(ListGroupsResponse.parse([]));
    return;
  }

  const groupIds = memberships.map((m) => m.groupId);
  const groups = await db.select().from(groupsTable).where(inArray(groupsTable.id, groupIds));

  const allMemberships = await db
    .select()
    .from(groupMembersTable)
    .where(inArray(groupMembersTable.groupId, groupIds));

  const counts = new Map<string, number>();
  for (const m of allMemberships) {
    counts.set(m.groupId, (counts.get(m.groupId) ?? 0) + 1);
  }

  const result = groups.map((g) => ({ ...g, memberCount: counts.get(g.id) ?? 0 }));

  res.json(ListGroupsResponse.parse(result));
});

router.post("/groups", async (req, res): Promise<void> => {
  const parsed = CreateGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let inviteCode = generateInviteCode();
  for (let attempts = 0; attempts < 5; attempts++) {
    const [existing] = await db.select().from(groupsTable).where(eq(groupsTable.inviteCode, inviteCode));
    if (!existing) break;
    inviteCode = generateInviteCode();
  }

  const [group] = await db
    .insert(groupsTable)
    .values({ name: parsed.data.name, inviteCode })
    .returning();

  await db.insert(groupMembersTable).values({ groupId: group!.id, userId: req.userId });

  res.status(201).json(CreateGroupResponse.parse({ ...group, memberCount: 1 }));
});

router.post("/groups/join", async (req, res): Promise<void> => {
  const parsed = JoinGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.inviteCode, parsed.data.inviteCode.toUpperCase()));

  if (!group) {
    res.status(404).json({ error: "Invalid invite code" });
    return;
  }

  const existingMemberships = await db
    .select()
    .from(groupMembersTable)
    .where(eq(groupMembersTable.groupId, group.id));

  const alreadyMember = existingMemberships.some((m) => m.userId === req.userId);
  if (!alreadyMember) {
    await db.insert(groupMembersTable).values({ groupId: group.id, userId: req.userId });
  }

  const memberCount = alreadyMember ? existingMemberships.length : existingMemberships.length + 1;

  res.json(JoinGroupResponse.parse({ ...group, memberCount }));
});

router.get("/groups/:groupId", async (req, res): Promise<void> => {
  const params = GetGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, params.data.groupId));
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  const memberships = await db
    .select()
    .from(groupMembersTable)
    .where(eq(groupMembersTable.groupId, group.id));

  const userIds = memberships.map((m) => m.userId);
  const users = userIds.length > 0 ? await db.select().from(usersTable).where(inArray(usersTable.id, userIds)) : [];
  const usersById = new Map(users.map((u) => [u.id, u]));

  const members = memberships
    .map((m) => {
      const user = usersById.get(m.userId);
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        avatarColor: user.avatarColor,
        joinedAt: m.joinedAt,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  res.json(
    GetGroupResponse.parse({
      id: group.id,
      name: group.name,
      inviteCode: group.inviteCode,
      createdAt: group.createdAt,
      members,
    }),
  );
});

router.get("/groups/:groupId/logs", async (req, res): Promise<void> => {
  const params = ListGroupLogsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const logs = await db
    .select()
    .from(poopLogsTable)
    .where(eq(poopLogsTable.groupId, params.data.groupId))
    .orderBy(poopLogsTable.createdAt);

  const userIds = Array.from(new Set(logs.map((l) => l.userId)));
  const users = userIds.length > 0 ? await db.select().from(usersTable).where(inArray(usersTable.id, userIds)) : [];
  const usersById = new Map(users.map((u) => [u.id, u]));

  const result = logs
    .slice()
    .reverse()
    .map((log) => {
      const user = usersById.get(log.userId);
      return {
        id: log.id,
        userId: log.userId,
        userName: user?.name ?? "Unknown",
        avatarColor: user?.avatarColor ?? "#8B5E3C",
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
    });

  res.json(ListGroupLogsResponse.parse(result));
});

router.get("/groups/:groupId/leaderboard", async (req, res): Promise<void> => {
  const params = GetGroupLeaderboardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const memberships = await db
    .select()
    .from(groupMembersTable)
    .where(eq(groupMembersTable.groupId, params.data.groupId));

  const userIds = memberships.map((m) => m.userId);
  const users = userIds.length > 0 ? await db.select().from(usersTable).where(inArray(usersTable.id, userIds)) : [];
  const usersById = new Map(users.map((u) => [u.id, u]));

  const logs =
    userIds.length > 0
      ? await db.select().from(poopLogsTable).where(eq(poopLogsTable.groupId, params.data.groupId))
      : [];

  const entries = memberships
    .map((m) => {
      const user = usersById.get(m.userId);
      if (!user) return null;
      const userLogs = logs.filter((l) => l.userId === m.userId);
      const totalLogs = userLogs.length;
      const averageOverall =
        totalLogs === 0
          ? null
          : Math.round((userLogs.reduce((sum, l) => sum + l.overallScore, 0) / totalLogs) * 100) / 100;

      return {
        userId: user.id,
        name: user.name,
        avatarColor: user.avatarColor,
        totalLogs,
        averageOverall,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => b.totalLogs - a.totalLogs);

  res.json(GetGroupLeaderboardResponse.parse(entries));
});

export default router;
