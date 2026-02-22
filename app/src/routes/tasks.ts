import { and, desc, eq, gt, isNull, lt } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import type { NewTask } from "../db/schema";
import { boards, Priority, Status, tasks } from "../db/schema";
import { now } from "../lib/utils";

// Mounted at /boards/:boardId/tasks — boardId comes from the parent router via param
export const taskRoutes = new Hono<{ Variables: { boardId: number } }>();

// Middleware: resolve + validate boardId for every task route
taskRoutes.use("/*", async (c, next) => {
  const boardId = parseInt(c.req.param("boardId") ?? "0", 10);
  if (isNaN(boardId)) return c.json({ error: "Invalid boardId" }, 400);

  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) return c.json({ error: "Board not found" }, 404);
  if (board.deletedAt) return c.json({ error: "Board is deleted" }, 410);

  c.set("boardId", boardId);
  await next();
});

// GET /boards/:boardId/tasks
taskRoutes.get("/", async (c) => {
  const boardId = c.get("boardId");
  const { status, priority, createdBy, upcoming, deleted } = c.req.query();

  const conditions = [eq(tasks.boardId, boardId)];

  if (deleted === "true") {
    conditions.push(gt(tasks.deletedAt, ""));
  } else if (deleted !== "all") {
    conditions.push(isNull(tasks.deletedAt));
  }

  if (status) conditions.push(eq(tasks.status, status as Status));
  if (priority) conditions.push(eq(tasks.priority, priority as Priority));
  if (createdBy) conditions.push(eq(tasks.createdBy, createdBy));

  if (upcoming) {
    const days = parseInt(upcoming, 10) || 7;
    const today = now().slice(0, 10);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const future = futureDate.toISOString().slice(0, 10);
    conditions.push(gt(tasks.endDate, today));
    conditions.push(lt(tasks.endDate, future));
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.updatedAt));

  return c.json({ data: rows, total: rows.length });
});

// GET /boards/:boardId/tasks/:id
taskRoutes.get("/:id", async (c) => {
  const boardId = c.get("boardId");
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.boardId, boardId)));
  if (!task) return c.json({ error: "Task not found" }, 404);

  return c.json({ data: task });
});

// POST /boards/:boardId/tasks
taskRoutes.post("/", async (c) => {
  const boardId = c.get("boardId");

  let body: Partial<Omit<NewTask, "boardId">>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.title?.trim()) return c.json({ error: "title is required" }, 422);
  if (!body.createdBy?.trim()) return c.json({ error: "createdBy is required" }, 422);
  if (body.priority && !Object.values(Priority).includes(body.priority as Priority)) {
    return c.json({ error: `priority must be one of: ${Object.values(Priority).join(", ")}` }, 422);
  }
  if (body.status && !Object.values(Status).includes(body.status as Status)) {
    return c.json({ error: `status must be one of: ${Object.values(Status).join(", ")}` }, 422);
  }

  const [created] = await db
    .insert(tasks)
    .values({
      boardId,
      title: body.title.trim(),
      description: body.description ?? null,
      createdBy: body.createdBy.trim(),
      priority: body.priority ?? Priority.MEDIUM,
      status: body.status ?? Status.BACKLOG,
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
    })
    .returning();

  return c.json({ data: created }, 201);
});

// PATCH /boards/:boardId/tasks/:id
taskRoutes.patch("/:id", async (c) => {
  const boardId = c.get("boardId");
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  let body: Partial<Omit<NewTask, "boardId">>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const [existing] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.boardId, boardId)));
  if (!existing) return c.json({ error: "Task not found" }, 404);
  if (existing.deletedAt) return c.json({ error: "Cannot update a deleted task" }, 409);

  if (body.priority && !Object.values(Priority).includes(body.priority as Priority)) {
    return c.json({ error: `priority must be one of: ${Object.values(Priority).join(", ")}` }, 422);
  }
  if (body.status && !Object.values(Status).includes(body.status as Status)) {
    return c.json({ error: `status must be one of: ${Object.values(Status).join(", ")}` }, 422);
  }

  const updates: Partial<NewTask> & { updatedAt: string } = { updatedAt: now() };
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description;
  if (body.createdBy !== undefined) updates.createdBy = body.createdBy.trim();
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.status !== undefined) updates.status = body.status;
  if (body.startDate !== undefined) updates.startDate = body.startDate;
  if (body.endDate !== undefined) updates.endDate = body.endDate;

  const [updated] = await db
    .update(tasks)
    .set(updates)
    .where(and(eq(tasks.id, id), eq(tasks.boardId, boardId)))
    .returning();

  return c.json({ data: updated });
});

// PATCH /boards/:boardId/tasks/:id/status — move task between columns
taskRoutes.patch("/:id/status", async (c) => {
  const boardId = c.get("boardId");
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  let body: { status: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.status || !Object.values(Status).includes(body.status as Status)) {
    return c.json({ error: `status must be one of: ${Object.values(Status).join(", ")}` }, 422);
  }

  const [existing] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.boardId, boardId)));
  if (!existing) return c.json({ error: "Task not found" }, 404);
  if (existing.deletedAt) return c.json({ error: "Cannot update a deleted task" }, 409);

  const [updated] = await db
    .update(tasks)
    .set({ status: body.status as Status, updatedAt: now() })
    .where(and(eq(tasks.id, id), eq(tasks.boardId, boardId)))
    .returning();

  return c.json({ data: updated });
});

// DELETE /boards/:boardId/tasks/:id — soft delete
taskRoutes.delete("/:id", async (c) => {
  const boardId = c.get("boardId");
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const [existing] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.boardId, boardId)));
  if (!existing) return c.json({ error: "Task not found" }, 404);
  if (existing.deletedAt) return c.json({ error: "Task already deleted" }, 409);

  await db
    .update(tasks)
    .set({ deletedAt: now(), updatedAt: now() })
    .where(and(eq(tasks.id, id), eq(tasks.boardId, boardId)));

  return c.json({ message: "Task deleted", id });
});


