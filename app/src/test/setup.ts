import { beforeEach, vi } from "vitest";
import { testDb, sqlite } from "./db";

vi.mock("../db", async () => {
  const actual = await vi.importActual("../db");
  return {
    ...actual,
    db: testDb,
    getDb: () => sqlite,
  };
});
