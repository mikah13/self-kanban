import {
  DndContext,
  DragOverlay,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState, useMemo } from "react";
import type { Task, Status } from "@/lib/types";
import { STATUSES } from "@/lib/constants";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import { TaskDialog } from "./task-dialog";
import { useUpdateTaskStatus } from "@/hooks/use-tasks";

interface KanbanBoardProps {
  boardId: number;
  tasks: Task[];
}

export function KanbanBoard({ boardId, tasks }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<Status>("backlog");
  const updateStatus = useUpdateTaskStatus(boardId);

  const columns = useMemo(() => {
    const map: Record<Status, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
      cancelled: [],
    };
    for (const task of tasks) {
      map[task.status]?.push(task);
    }
    return map;
  }, [tasks]);

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === Number(event.active.id));
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = Number(active.id);
    const newStatus = over.id as Status;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    updateStatus.mutate({ id: taskId, status: newStatus });
  }

  function handleAddTask(status: Status) {
    setCreateStatus(status);
    setCreateDialogOpen(true);
  }

  return (
    <>
      <DndContext
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={columns[status]}
              boardId={boardId}
              onAddTask={() => handleAddTask(status)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} boardId={boardId} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        boardId={boardId}
        defaultStatus={createStatus}
      />
    </>
  );
}
