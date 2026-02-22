import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/types";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { TaskDialog } from "./task-dialog";
import { DeleteConfirm } from "./delete-confirm";
import { useDeleteTask } from "@/hooks/use-tasks";

interface TaskCardProps {
  task: Task;
  boardId: number;
  isDragOverlay?: boolean;
}

export function TaskCard({ task, boardId, isDragOverlay }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    });
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteTask = useDeleteTask(boardId);

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={`
          cursor-grab active:cursor-grabbing
          transition-opacity duration-200
          ${isDragging ? "opacity-50" : ""}
          ${isDragOverlay ? "shadow-lg rotate-2" : ""}
        `}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button
              className="mt-0.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0"
              {...listeners}
              {...attributes}
            >
              <GripVertical className="h-4 w-4" />
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {task.title}
              </p>
              {task.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className={`text-xs ${PRIORITY_COLORS[task.priority]}`}
                >
                  {PRIORITY_LABELS[task.priority]}
                </Badge>
              </div>
            </div>

            {!isDragOverlay && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      <TaskDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        boardId={boardId}
        task={task}
      />
      <DeleteConfirm
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This action can be undone.`}
        onConfirm={() => {
          deleteTask.mutate(task.id);
          setDeleteOpen(false);
        }}
      />
    </>
  );
}
