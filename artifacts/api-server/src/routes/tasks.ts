import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, tasksTable, groupsTable } from "@workspace/db";
import {
  ListTasksQueryParams,
  ListTasksResponse,
  CreateTaskBody,
  GetTaskParams,
  GetTaskResponse,
  UpdateTaskParams,
  UpdateTaskBody,
  UpdateTaskResponse,
  DeleteTaskParams,
  CompleteTaskParams,
  CompleteTaskResponse,
  GetDashboardSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tasks", async (req, res): Promise<void> => {
  const query = ListTasksQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.groupId != null) conditions.push(eq(tasksTable.groupId, query.data.groupId));
  if (query.data.status != null) conditions.push(eq(tasksTable.status, query.data.status));
  if (query.data.priority != null) conditions.push(eq(tasksTable.priority, query.data.priority));

  const tasks =
    conditions.length > 0
      ? await db
          .select()
          .from(tasksTable)
          .where(and(...conditions))
          .orderBy(tasksTable.createdAt)
      : await db.select().from(tasksTable).orderBy(tasksTable.createdAt);

  res.json(ListTasksResponse.parse(tasks));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [task] = await db.insert(tasksTable).values(parsed.data).returning();
  res.status(201).json(GetTaskResponse.parse(task));
});

router.get("/tasks/:id", async (req, res): Promise<void> => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, params.data.id));
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(GetTaskResponse.parse(task));
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [task] = await db
    .update(tasksTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(tasksTable.id, params.data.id))
    .returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(UpdateTaskResponse.parse(task));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [task] = await db.delete(tasksTable).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.sendStatus(204);
});

router.patch("/tasks/:id/complete", async (req, res): Promise<void> => {
  const params = CompleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [task] = await db
    .update(tasksTable)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(tasksTable.id, params.data.id))
    .returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(CompleteTaskResponse.parse(task));
});

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [groups, tasks] = await Promise.all([
    db.select().from(groupsTable),
    db.select().from(tasksTable),
  ]);

  const totalGroups = groups.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  res.json(
    GetDashboardSummaryResponse.parse({
      totalGroups,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      completionRate,
    })
  );
});

export default router;
