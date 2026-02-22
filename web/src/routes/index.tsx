import { createFileRoute } from "@tanstack/react-router";
import { useBoards, useCreateBoard, useDeleteBoard } from "@/hooks/use-boards";
import { BoardCard } from "@/components/board-card";
import { BoardDialog } from "@/components/board-dialog";
import { DeleteConfirm } from "@/components/delete-confirm";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { Board } from "@/lib/types";

export const Route = createFileRoute("/")({
  component: BoardListPage,
});

function BoardListPage() {
  const { data: boards, isLoading } = useBoards();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Board | undefined>();
  const deleteBoard = useDeleteBoard();

  if (isLoading) {
    return <div className="text-center py-12">Loading boards...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your Boards</h1>
        <Button onClick={() => { setEditingBoard(undefined); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Board
        </Button>
      </div>

      {boards?.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No boards yet. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards?.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onEdit={(b) => { setEditingBoard(b); setDialogOpen(true); }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <BoardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        board={editingBoard}
      />
      <DeleteConfirm
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete Board"
        description={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This action can be undone.` : ""}
        onConfirm={() => {
          if (deleteTarget) {
            deleteBoard.mutate(deleteTarget.id);
            setDeleteTarget(undefined);
          }
        }}
      />
    </div>
  );
}
