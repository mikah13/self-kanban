export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "backlog" | "todo" | "in_progress" | "in_review" | "done" | "cancelled";

export interface Board {
  id: number;
  name: string;
  description: string | null;
  ownedBy: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  boardId: number;
  title: string;
  description: string | null;
  createdBy: string;
  priority: Priority;
  status: Status;
  startDate: string | null;
  endDate: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardInput {
  name: string;
  description?: string;
  ownedBy: string;
}

export interface UpdateBoardInput {
  name?: string;
  description?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  createdBy: string;
  priority?: Priority;
  status?: Status;
  startDate?: string;
  endDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  startDate?: string;
  endDate?: string;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
}

export interface ItemResponse<T> {
  data: T;
}

export interface DeleteResponse {
  message: string;
  id: number;
}
