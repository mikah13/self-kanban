import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { getDb } from "../db";
import { boardRoutes } from "../routes/boards";
import { taskRoutes } from "../routes/tasks";

export function createTestApp() {
  const app = new Hono();

  app.use("*", logger());
  app.use("*", cors());
  app.use("*", prettyJSON());

  app.get("/", (c) =>
    c.json({
      app: "self-kanban-test",
      version: "0.2.0",
      status: "ok",
    })
  );

  app.route("/boards", boardRoutes);
  app.route("/boards/:boardId/tasks", taskRoutes);

  app.notFound((c) => c.json({ error: "Not found" }, 404));

  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "Internal server error" }, 500);
  });

  return app;
}
