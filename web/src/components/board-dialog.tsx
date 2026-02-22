import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateBoard, useUpdateBoard } from "@/hooks/use-boards";
import { DEFAULT_OWNER } from "@/lib/constants";
import type { Board } from "@/lib/types";
import { useState, useEffect } from "react";

interface BoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board?: Board;
}

export function BoardDialog({ open, onOpenChange, board }: BoardDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createBoard = useCreateBoard();
  const updateBoard = useUpdateBoard();
  const isEditing = !!board;

  useEffect(() => {
    if (board) {
      setName(board.name);
      setDescription(board.description ?? "");
    } else {
      setName("");
      setDescription("");
    }
  }, [board, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEditing) {
      updateBoard.mutate(
        { id: board.id, input: { name, description } },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createBoard.mutate(
        { name, description, ownedBy: DEFAULT_OWNER },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Board" : "Create Board"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="board-name">Name</Label>
            <Input
              id="board-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Board"
              required
            />
          </div>
          <div>
            <Label htmlFor="board-desc">Description</Label>
            <Textarea
              id="board-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {isEditing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
