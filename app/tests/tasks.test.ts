import { describe, expect, it } from "vitest";
import { createTestApp } from "../src/test/app";

const app = createTestApp();

async function createBoard(name = "Test Board", ownedBy = "user1") {
  const res = await app.request("/boards", {
    method: "POST",
    body: JSON.stringify({ name, ownedBy }),
  });
  const { data } = await res.json();
  return data;
}

async function createTask(boardId: number, title = "Test Task", createdBy = "user1") {
  const res = await app.request(`/boards/${boardId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ title, createdBy }),
  });
  const { data } = await res.json();
  return data;
}

describe("Task Endpoints", () => {
  describe("GET /boards/:boardId/tasks", () => {
    it("should return empty array when no tasks exist", async () => {
      const board = await createBoard();

      const res = await app.request(`/boards/${board.id}/tasks`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("should return tasks for a board", async () => {
      const board = await createBoard();
      await createTask(board.id, "Task 1");
      await createTask(board.id, "Task 2");

      const res = await app.request(`/boards/${board.id}/tasks`);
      const body = await res.json();
      expect(body.data).toHaveLength(2);
    });

    it("should filter tasks by status", async () => {
      const board = await createBoard();
      await createTask(board.id, "Task 1");
      await app.request(`/boards/${board.id}/tasks/1`, {
        method: "PATCH",
        body: JSON.stringify({ status: "done" }),
      });

      const res = await app.request(`/boards/${board.id}/tasks?status=done`);
      const body = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].status).toBe("done");
    });

    it("should filter tasks by priority", async () => {
      const board = await createBoard();
      await app.request(`/boards/${board.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title: "High Priority", createdBy: "user1", priority: "high" }),
      });
      await app.request(`/boards/${board.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title: "Low Priority", createdBy: "user1", priority: "low" }),
      });

      const res = await app.request(`/boards/${board.id}/tasks?priority=high`);
      const body = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].priority).toBe("high");
    });

    it("should return 404 for non-existent board", async () => {
      const res = await app.request("/boards/9999/tasks");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /boards/:boardId/tasks", () => {
    it("should create a task with valid data", async () => {
      const board = await createBoard();

      const res = await app.request(`/boards/${board.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title: "New Task", createdBy: "user1" }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.title).toBe("New Task");
      expect(body.data.status).toBe("backlog");
      expect(body.data.priority).toBe("medium");
    });

    it("should allow setting priority and status", async () => {
      const board = await createBoard();

      const res = await app.request(`/boards/${board.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title: "Priority Task",
          createdBy: "user1",
          priority: "urgent",
          status: "in_progress",
        }),
      });
      const body = await res.json();
      expect(body.data.priority).toBe("urgent");
      expect(body.data.status).toBe("in_progress");
    });

    it("should return 422 when title is missing", async () => {
      const board = await createBoard();

      const res = await app.request(`/boards/${board.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({ createdBy: "user1" }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toContain("title");
    });

    it("should return 422 when createdBy is missing", async () => {
      const board = await createBoard();

      const res = await app.request(`/boards/${board.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title: "Task" }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toContain("createdBy");
    });

    it("should return 422 for invalid priority", async () => {
      const board = await createBoard();

      const res = await app.request(`/boards/${board.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title: "Task", createdBy: "user1", priority: "invalid" }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toContain("priority");
    });
  });

  describe("GET /boards/:boardId/tasks/:id", () => {
    it("should return a task by id", async () => {
      const board = await createBoard();
      const task = await createTask(board.id, "Test Task");

      const res = await app.request(`/boards/${board.id}/tasks/${task.id}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.id).toBe(task.id);
      expect(body.data.title).toBe("Test Task");
    });

    it("should return 404 for non-existent task", async () => {
      const board = await createBoard();

      const res = await app.request(`/boards/${board.id}/tasks/9999`);
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /boards/:boardId/tasks/:id", () => {
    it("should update a task", async () => {
      const board = await createBoard();
      const task = await createTask(board.id, "Original");

      const res = await app.request(`/boards/${board.id}/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.title).toBe("Updated");
    });

    it("should return 404 for non-existent task", async () => {
      const board = await createBoard();

      const res = await app.request(`/boards/${board.id}/tasks/9999`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      });
      expect(res.status).toBe(404);
    });

    it("should return 409 for deleted task", async () => {
      const board = await createBoard();
      const task = await createTask(board.id, "To Delete");

      await app.request(`/boards/${board.id}/tasks/${task.id}`, { method: "DELETE" });

      const res = await app.request(`/boards/${board.id}/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      });
      expect(res.status).toBe(409);
    });
  });

  describe("PATCH /boards/:boardId/tasks/:id/status", () => {
    it("should update task status", async () => {
      const board = await createBoard();
      const task = await createTask(board.id, "Task");

      const res = await app.request(`/boards/${board.id}/tasks/${task.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "done" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.status).toBe("done");
    });

    it("should return 422 for invalid status", async () => {
      const board = await createBoard();
      const task = await createTask(board.id, "Task");

      const res = await app.request(`/boards/${board.id}/tasks/${task.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "invalid" }),
      });
      expect(res.status).toBe(422);
    });
  });

  describe("DELETE /boards/:boardId/tasks/:id", () => {
    it("should soft delete a task", async () => {
      const board = await createBoard();
      const task = await createTask(board.id, "To Delete");

      const res = await app.request(`/boards/${board.id}/tasks/${task.id}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Task deleted");
    });

    it("should return 404 for non-existent task", async () => {
      const board = await createBoard();

      const res = await app.request(`/boards/${board.id}/tasks/9999`, {
        method: "DELETE",
      });
      expect(res.status).toBe(404);
    });

    it("should return 409 for already deleted task", async () => {
      const board = await createBoard();
      const task = await createTask(board.id, "Already Deleted");

      await app.request(`/boards/${board.id}/tasks/${task.id}`, { method: "DELETE" });

      const res = await app.request(`/boards/${board.id}/tasks/${task.id}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(409);
    });
  });

  describe("Task filtering with deleted", () => {
    it("should exclude deleted tasks by default", async () => {
      const board = await createBoard();
      const task = await createTask(board.id, "Task");

      await app.request(`/boards/${board.id}/tasks/${task.id}`, { method: "DELETE" });

      const res = await app.request(`/boards/${board.id}/tasks`);
      const body = await res.json();
      expect(body.data).toHaveLength(0);
    });

    it("should include deleted tasks with deleted=true", async () => {
      const board = await createBoard();
      const task = await createTask(board.id, "Task");

      await app.request(`/boards/${board.id}/tasks/${task.id}`, { method: "DELETE" });

      const res = await app.request(`/boards/${board.id}/tasks?deleted=true`);
      const body = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].deletedAt).toBeDefined();
    });
  });
});
