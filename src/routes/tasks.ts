import { and, asc, desc, eq, gt, isNull, lt, or } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { NewTask, Priority, Status, tasks } from "../db/schema";

export const taskRoutes = new Hono();

function now(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// GET /tasks — list tasks with optional filters
taskRoutes.get("/", async (c) => {
  const { status, priority, createdBy, upcoming, deleted } = c.req.query();

  const filters: ReturnType<typeof eq>[] = [];

  // By default exclude soft-deleted tasks
  if (deleted === "true") {
    // show only deleted
    filters.push(
      and(isNull(tasks.deletedAt))! // trick: we want non-null; rewrite below
    );
  }

  // Build conditions properly
  const conditions = [];

  if (deleted === "true") {
    conditions.push(
      and(eq(tasks.deletedAt, tasks.deletedAt))! // placeholder — replaced below
    );
  } else if (deleted !== "all") {
    conditions.push(isNull(tasks.deletedAt));
  }

  if (status) conditions.push(eq(tasks.status, status));
  if (priority) conditions.push(eq(tasks.priority, priority));
  if (createdBy) conditions.push(eq(tasks.createdBy, createdBy));

  // upcoming: tasks whose endDate is within the next N days
  if (upcoming) {
    const days = parseInt(upcoming, 10) || 7;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const today = now().slice(0, 10);
    const future = futureDate.toISOString().slice(0, 10);

    conditions.push(
      and(gt(tasks.endDate, today), lt(tasks.endDate, future))!
    );
  }

  let rows;

  if (deleted === "true") {
    // Fetch only deleted tasks — reconstruct query without isNull
    const allConditions = [];
    if (status) allConditions.push(eq(tasks.status, status));
    if (priority) allConditions.push(eq(tasks.priority, priority));
    if (createdBy) allConditions.push(eq(tasks.createdBy, createdBy));

    rows = await db
      .select()
      .from(tasks)
      .where(
        and(
          // deletedAt IS NOT NULL — use a workaround
          or(
            gt(tasks.deletedAt, ""),
          ),
          ...(allConditions.length ? [and(...allConditions)!] : [])
        )
      )
      .orderBy(desc(tasks.updatedAt));
  } else {
    rows = await db
      .select()
      .from(tasks)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(tasks.updatedAt));
  }

  return c.json({ data: rows, total: rows.length });
});

// GET /tasks/:id — get single task
taskRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) return c.json({ error: "Task not found" }, 404);

  return c.json({ data: task });
});

// POST /tasks — create task
taskRoutes.post("/", async (c) => {
  let body: Partial<NewTask>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.title?.trim()) {
    return c.json({ error: "title is required" }, 422);
  }
  if (!body.createdBy?.trim()) {
    return c.json({ error: "createdBy is required" }, 422);
  }
  if (body.priority && !Object.values(Priority).includes(body.priority)) {
    return c.json({ error: `priority must be one of: ${Object.values(Priority).join(", ")}` }, 422);
  }
  if (body.status && !Object.values(Status).includes(body.status)) {
    return c.json({ error: `status must be one of: ${Object.values(Status).join(", ")}` }, 422);
  }

  const [created] = await db
    .insert(tasks)
    .values({
      title: body.title.trim(),
      description: body.description ?? null,
      createdBy: body.createdBy.trim(),
      priority: body.priority ?? "medium",
      status: body.status ?? "backlog",
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
    })
    .returning();

  return c.json({ data: created }, 201);
});

// PATCH /tasks/:id — update task fields
taskRoutes.patch("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  let body: Partial<NewTask>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const [existing] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!existing) return c.json({ error: "Task not found" }, 404);
  if (existing.deletedAt) return c.json({ error: "Cannot update a deleted task" }, 409);

  if (body.priority && !Object.values(Priority).includes(body.priority)) {
    return c.json({ error: `priority must be one of: ${Object.values(Priority).join(", ")}` }, 422);
  }
  if (body.status && !Object.values(Status).includes(body.status)) {
    return c.json({ error: `status must be one of: ${Object.values(Status).join(", ")}` }, 422);
  }

  const updates: Partial<NewTask> & { updatedAt: string } = {
    updatedAt: now(),
  };

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
    .where(eq(tasks.id, id))
    .returning();

  return c.json({ data: updated });
});

// PATCH /tasks/:id/status — move task to a different status (convenience)
taskRoutes.patch("/:id/status", async (c) => {
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

  const [existing] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!existing) return c.json({ error: "Task not found" }, 404);
  if (existing.deletedAt) return c.json({ error: "Cannot update a deleted task" }, 409);

  const [updated] = await db
    .update(tasks)
    .set({ status: body.status as Status, updatedAt: now() })
    .where(eq(tasks.id, id))
    .returning();

  return c.json({ data: updated });
});

// DELETE /tasks/:id — soft delete
taskRoutes.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const [existing] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!existing) return c.json({ error: "Task not found" }, 404);
  if (existing.deletedAt) return c.json({ error: "Task already deleted" }, 409);

  await db
    .update(tasks)
    .set({ deletedAt: now(), updatedAt: now() })
    .where(eq(tasks.id, id));

  return c.json({ message: "Task deleted", id });
});

// POST /tasks/:id/restore — restore soft-deleted task
taskRoutes.post("/:id/restore", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const [existing] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!existing) return c.json({ error: "Task not found" }, 404);
  if (!existing.deletedAt) return c.json({ error: "Task is not deleted" }, 409);

  const [restored] = await db
    .update(tasks)
    .set({ deletedAt: null, updatedAt: now() })
    .where(eq(tasks.id, id))
    .returning();

  return c.json({ data: restored });
});
