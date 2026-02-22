import { Link } from "@tanstack/react-router";
import type { Board } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

interface BoardCardProps {
  board: Board;
  onEdit?: (board: Board) => void;
  onDelete?: (board: Board) => void;
}

export function BoardCard({ board, onEdit, onDelete }: BoardCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <Link
          to="/boards/$boardId"
          params={{ boardId: String(board.id) }}
          className="flex-1"
        >
          <CardTitle className="text-lg">{board.name}</CardTitle>
          {board.description && (
            <CardDescription className="mt-1">
              {board.description}
            </CardDescription>
          )}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(board)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(board)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
    </Card>
  );
}
