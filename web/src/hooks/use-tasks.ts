import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api";
import type { CreateTaskInput, UpdateTaskInput, Status, Task } from "@/lib/types";

export const taskKeys = {
  all: (boardId: number) => ["tasks", boardId] as const,
  detail: (boardId: number, id: number) => ["tasks", boardId, id] as const,
};

export function useTasks(boardId: number) {
  return useQuery({
    queryKey: taskKeys.all(boardId),
    queryFn: () => tasksApi.list(boardId),
    select: (res) => res.data,
  });
}

export function useCreateTask(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(boardId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all(boardId) }),
  });
}

export function useUpdateTask(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateTaskInput }) =>
      tasksApi.update(boardId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all(boardId) }),
  });
}

export function useUpdateTaskStatus(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: Status }) =>
      tasksApi.updateStatus(boardId, id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: taskKeys.all(boardId) });
      const previous = qc.getQueryData(taskKeys.all(boardId));
      qc.setQueryData(taskKeys.all(boardId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((t: Task) =>
            t.id === id ? { ...t, status } : t
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(taskKeys.all(boardId), context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(boardId) });
    },
  });
}

export function useDeleteTask(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tasksApi.delete(boardId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all(boardId) }),
  });
}
