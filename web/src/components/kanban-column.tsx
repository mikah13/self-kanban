import { useDroppable } from "@dnd-kit/core";
import type { Task, Status } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/constants";
import { TaskCard } from "./task-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface KanbanColumnProps {
  status: Status;
  tasks: Task[];
  boardId: number;
  onAddTask: () => void;
}

export function KanbanColumn({
  status,
  tasks,
  boardId,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col w-72 min-w-72 shrink-0 rounded-lg bg-gray-100 p-3
        transition-colors duration-200
        ${isOver ? "ring-2 ring-blue-400 bg-blue-50" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700">
            {STATUS_LABELS[status]}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onAddTask}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-2 flex-1 min-h-[100px]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} boardId={boardId} />
        ))}
      </div>
    </div>
  );
}
