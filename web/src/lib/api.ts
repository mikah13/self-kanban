import type {
  Board,
  Task,
  CreateBoardInput,
  UpdateBoardInput,
  CreateTaskInput,
  UpdateTaskInput,
  ListResponse,
  ItemResponse,
  DeleteResponse,
} from "./types";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ---- Boards ----

export const boardsApi = {
  list: () =>
    request<ListResponse<Board>>("/boards"),

  get: (id: number) =>
    request<ItemResponse<Board>>(`/boards/${id}`),

  create: (input: CreateBoardInput) =>
    request<ItemResponse<Board>>("/boards", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: number, input: UpdateBoardInput) =>
    request<ItemResponse<Board>>(`/boards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  delete: (id: number) =>
    request<DeleteResponse>(`/boards/${id}`, { method: "DELETE" }),

  restore: (id: number) =>
    request<ItemResponse<Board>>(`/boards/${id}/restore`, { method: "POST" }),
};

// ---- Tasks ----

export const tasksApi = {
  list: (boardId: number) =>
    request<ListResponse<Task>>(`/boards/${boardId}/tasks`),

  get: (boardId: number, id: number) =>
    request<ItemResponse<Task>>(`/boards/${boardId}/tasks/${id}`),

  create: (boardId: number, input: CreateTaskInput) =>
    request<ItemResponse<Task>>(`/boards/${boardId}/tasks`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (boardId: number, id: number, input: UpdateTaskInput) =>
    request<ItemResponse<Task>>(`/boards/${boardId}/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  updateStatus: (boardId: number, id: number, status: string) =>
    request<ItemResponse<Task>>(`/boards/${boardId}/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  delete: (boardId: number, id: number) =>
    request<DeleteResponse>(`/boards/${boardId}/tasks/${id}`, {
      method: "DELETE",
    }),

  restore: (boardId: number, id: number) =>
    request<ItemResponse<Task>>(`/boards/${boardId}/tasks/${id}/restore`, {
      method: "POST",
    }),
};
