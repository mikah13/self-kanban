import { describe, expect, it } from "vitest";
import { createTestApp } from "../src/test/app";

const app = createTestApp();

describe("Board Endpoints", () => {
  describe("GET /boards", () => {
    it("should return empty array when no boards exist", async () => {
      const res = await app.request("/boards");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("should return boards filtered by ownedBy", async () => {
      await app.request("/boards", {
        method: "POST",
        body: JSON.stringify({ name: "Board 1", ownedBy: "user1" }),
      });
      await app.request("/boards", {
        method: "POST",
        body: JSON.stringify({ name: "Board 2", ownedBy: "user2" }),
      });

      const res = await app.request("/boards?ownedBy=user1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].ownedBy).toBe("user1");
    });
  });

  describe("POST /boards", () => {
    it("should create a board with valid data", async () => {
      const res = await app.request("/boards", {
        method: "POST",
        body: JSON.stringify({ name: "Test Board", ownedBy: "user1" }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.name).toBe("Test Board");
      expect(body.data.ownedBy).toBe("user1");
      expect(body.data.id).toBeDefined();
    });

    it("should return 422 when name is missing", async () => {
      const res = await app.request("/boards", {
        method: "POST",
        body: JSON.stringify({ ownedBy: "user1" }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toContain("name");
    });

    it("should return 422 when ownedBy is missing", async () => {
      const res = await app.request("/boards", {
        method: "POST",
        body: JSON.stringify({ name: "Test Board" }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toContain("ownedBy");
    });

    it("should return 400 for invalid JSON", async () => {
      const res = await app.request("/boards", {
        method: "POST",
        body: "not json",
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /boards/:id", () => {
    it("should return a board by id", async () => {
      const createRes = await app.request("/boards", {
        method: "POST",
        body: JSON.stringify({ name: "Test Board", ownedBy: "user1" }),
      });
      const { data } = await createRes.json();

      const res = await app.request(`/boards/${data.id}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.id).toBe(data.id);
      expect(body.data.name).toBe("Test Board");
    });

    it("should return 404 for non-existent board", async () => {
      const res = await app.request("/boards/9999");
      expect(res.status).toBe(404);
    });

    it("should return 400 for invalid id", async () => {
      const res = await app.request("/boards/abc");
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /boards/:id", () => {
    it("should update a board", async () => {
      const createRes = await app.request("/boards", {
        method: "POST",
        body: JSON.stringify({ name: "Original", ownedBy: "user1" }),
      });
      const { data } = await createRes.json();

      const res = await app.request(`/boards/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.name).toBe("Updated");
    });

    it("should return 404 for non-existent board", async () => {
      const res = await app.request("/boards/9999", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
      });
      expect(res.status).toBe(404);
    });

    it("should return 409 for deleted board", async () => {
      const createRes = await app.request("/boards", {
        method: "POST",
        body: JSON.stringify({ name: "To Delete", ownedBy: "user1" }),
      });
      const { data } = await createRes.json();

      await app.request(`/boards/${data.id}`, { method: "DELETE" });

      const res = await app.request(`/boards/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
      });
      expect(res.status).toBe(409);
    });
  });

  describe("DELETE /boards/:id", () => {
    it("should soft delete a board", async () => {
      const createRes = await app.request("/boards", {
        method: "POST",
        body: JSON.stringify({ name: "To Delete", ownedBy: "user1" }),
      });
      const { data } = await createRes.json();

      const res = await app.request(`/boards/${data.id}`, { method: "DELETE" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Board deleted");
    });

    it("should return 404 for non-existent board", async () => {
      const res = await app.request("/boards/9999", { method: "DELETE" });
      expect(res.status).toBe(404);
    });

    it("should return 409 for already deleted board", async () => {
      const createRes = await app.request("/boards", {
        method: "POST",
        body: JSON.stringify({ name: "Already Deleted", ownedBy: "user1" }),
      });
      const { data } = await createRes.json();

      await app.request(`/boards/${data.id}`, { method: "DELETE" });
      const res = await app.request(`/boards/${data.id}`, { method: "DELETE" });
      expect(res.status).toBe(409);
    });
  });

  describe("GET /boards with deleted filter", () => {
    it("should exclude deleted boards by default", async () => {
      const createRes = await app.request("/boards", {
        method: "POST",
        body: JSON.stringify({ name: "Board", ownedBy: "user1" }),
      });
      const { data } = await createRes.json();

      await app.request(`/boards/${data.id}`, { method: "DELETE" });

      const res = await app.request("/boards");
      const body = await res.json();
      expect(body.data).toHaveLength(0);
    });

    it("should include deleted boards with deleted=true", async () => {
      const createRes = await app.request("/boards", {
        method: "POST",
        body: JSON.stringify({ name: "Board", ownedBy: "user1" }),
      });
      const { data } = await createRes.json();

      await app.request(`/boards/${data.id}`, { method: "DELETE" });

      const res = await app.request("/boards?deleted=true");
      const body = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].deletedAt).toBeDefined();
    });
  });
});
