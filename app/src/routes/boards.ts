import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import type { Board, NewBoard } from "../db/schema";
import { boards } from "../db/schema";
import { now } from "../lib/utils";

export const boardRoutes = new Hono();

// GET /boards — list boards (filters: ownedBy, deleted=true|all)
boardRoutes.get("/", async (c) => {
  const { ownedBy, deleted } = c.req.query();

  const conditions = [];

  if (deleted === "true") {
    conditions.push(gt(boards.deletedAt, ""));
  } else if (deleted !== "all") {
    conditions.push(isNull(boards.deletedAt));
  }

  if (ownedBy) conditions.push(eq(boards.ownedBy, ownedBy));

  const rows = await db
    .select()
    .from(boards)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(boards.updatedAt));

  return c.json({ data: rows, total: rows.length });
});

// GET /boards/:id — get a single board
boardRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const [board] = await db.select().from(boards).where(eq(boards.id, id));
  if (!board) return c.json({ error: "Board not found" }, 404);

  return c.json({ data: board });
});

// POST /boards — create a board
boardRoutes.post("/", async (c) => {
  let body: Partial<NewBoard>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.name?.trim()) return c.json({ error: "name is required" }, 422);
  if (!body.ownedBy?.trim()) return c.json({ error: "ownedBy is required" }, 422);

  const [created] = await db
    .insert(boards)
    .values({
      name: body.name.trim(),
      description: body.description ?? null,
      ownedBy: body.ownedBy.trim(),
    })
    .returning();

  return c.json({ data: created }, 201);
});

// PATCH /boards/:id — update a board
boardRoutes.patch("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  let body: Partial<Pick<Board, "name" | "description">>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const [existing] = await db.select().from(boards).where(eq(boards.id, id));
  if (!existing) return c.json({ error: "Board not found" }, 404);
  if (existing.deletedAt) return c.json({ error: "Cannot update a deleted board" }, 409);

  const updates: Partial<NewBoard> & { updatedAt: string } = { updatedAt: now() };
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.description !== undefined) updates.description = body.description;

  const [updated] = await db
    .update(boards)
    .set(updates)
    .where(eq(boards.id, id))
    .returning();

  return c.json({ data: updated });
});

// DELETE /boards/:id — soft delete
boardRoutes.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const [existing] = await db.select().from(boards).where(eq(boards.id, id));
  if (!existing) return c.json({ error: "Board not found" }, 404);
  if (existing.deletedAt) return c.json({ error: "Board already deleted" }, 409);

  await db
    .update(boards)
    .set({ deletedAt: now(), updatedAt: now() })
    .where(eq(boards.id, id));

  return c.json({ message: "Board deleted", id });
});


