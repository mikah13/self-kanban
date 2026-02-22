import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardsApi } from "@/lib/api";
import type { CreateBoardInput, UpdateBoardInput } from "@/lib/types";

export const boardKeys = {
  all: ["boards"] as const,
  detail: (id: number) => ["boards", id] as const,
};

export function useBoards() {
  return useQuery({
    queryKey: boardKeys.all,
    queryFn: () => boardsApi.list(),
    select: (res) => res.data,
  });
}

export function useBoard(id: number) {
  return useQuery({
    queryKey: boardKeys.detail(id),
    queryFn: () => boardsApi.get(id),
    select: (res) => res.data,
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBoardInput) => boardsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.all }),
  });
}

export function useUpdateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateBoardInput }) =>
      boardsApi.update(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: boardKeys.all });
      qc.invalidateQueries({ queryKey: boardKeys.detail(id) });
    },
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => boardsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.all }),
  });
}
