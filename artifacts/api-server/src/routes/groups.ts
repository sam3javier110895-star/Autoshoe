import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, groupsTable, tasksTable } from "@workspace/db";
import {
  ListGroupsResponse,
  CreateGroupBody,
  GetGroupParams,
  GetGroupResponse,
  UpdateGroupParams,
  UpdateGroupBody,
  UpdateGroupResponse,
  DeleteGroupParams,
  GetGroupStatsParams,
  GetGroupStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/groups", async (_req, res): Promise<void> => {
  const groups = await db.select().from(groupsTable).orderBy(groupsTable.createdAt);
  res.json(ListGroupsResponse.parse(groups));
});

router.post("/groups", async (req, res): Promise<void> => {
  const parsed = CreateGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [group] = await db.insert(groupsTable).values(parsed.data).returning();
  res.status(201).json(GetGroupResponse.parse(group));
});

router.get("/groups/:id", async (req, res): Promise<void> => {
  const params = GetGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, params.data.id));
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }
  res.json(GetGroupResponse.parse(group));
});

router.patch("/groups/:id", async (req, res): Promise<void> => {
  const params = UpdateGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [group] = await db.update(groupsTable).set(parsed.data).where(eq(groupsTable.id, params.data.id)).returning();
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }
  res.json(UpdateGroupResponse.parse(group));
});

router.delete("/groups/:id", async (req, res): Promise<void> => {
  const params = DeleteGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [group] = await db.delete(groupsTable).where(eq(groupsTable.id, params.data.id)).returning();
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/groups/:id/stats", async (req, res): Promise<void> => {
  const params = GetGroupStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.groupId, params.data.id));
  const total = tasks.length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const completed = tasks.filter((t) => t.status === "completed").length;

  res.json(
    GetGroupStatsResponse.parse({
      groupId: params.data.id,
      total,
      pending,
      inProgress,
      completed,
    })
  );
});

export default router;
