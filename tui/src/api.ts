const API_URL = process.env.API_URL || "http://localhost:3001";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error || `API error: ${res.status}`
    );
  }
  return res.json() as Promise<T>;
}

// --- Boards ---

export async function listBoards() {
  return request<{ data: unknown[]; total: number }>("/boards");
}

export async function getBoard(id: number) {
  return request<{ data: unknown }>(`/boards/${id}`);
}

// --- Tasks ---

interface TaskFilters {
  status?: string;
  priority?: string;
}

export async function listTasks(boardId: number, filters?: TaskFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.priority) params.set("priority", filters.priority);
  const qs = params.toString();
  return request<{ data: unknown[]; total: number }>(
    `/boards/${boardId}/tasks${qs ? `?${qs}` : ""}`
  );
}

export async function getTask(boardId: number, taskId: number) {
  return request<{ data: unknown }>(`/boards/${boardId}/tasks/${taskId}`);
}

export async function createTask(
  boardId: number,
  data: {
    title: string;
    description?: string;
    priority?: string;
    status?: string;
  }
) {
  return request<{ data: unknown }>(`/boards/${boardId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ ...data, createdBy: "me" }),
  });
}

export async function updateTask(
  boardId: number,
  taskId: number,
  data: {
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
  }
) {
  return request<{ data: unknown }>(`/boards/${boardId}/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateTaskStatus(
  boardId: number,
  taskId: number,
  status: string
) {
  return request<{ data: unknown }>(
    `/boards/${boardId}/tasks/${taskId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}

export async function deleteTask(boardId: number, taskId: number) {
  return request<{ message: string; id: number }>(
    `/boards/${boardId}/tasks/${taskId}`,
    { method: "DELETE" }
  );
}
