import { createFileRoute } from "@tanstack/react-router";
import { useBoard } from "@/hooks/use-boards";
import { useTasks } from "@/hooks/use-tasks";
import { KanbanBoard } from "@/components/kanban-board";

export const Route = createFileRoute("/boards/$boardId")({
  component: BoardPage,
});

function BoardPage() {
  const { boardId } = Route.useParams();
  const id = Number(boardId);
  const { data: board, isLoading: boardLoading } = useBoard(id);
  const { data: tasks, isLoading: tasksLoading } = useTasks(id);

  if (boardLoading || tasksLoading) {
    return <div className="text-center py-12">Loading board...</div>;
  }
  if (!board) {
    return <div className="text-center py-12 text-red-500">Board not found.</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{board.name}</h1>
        {board.description && (
          <p className="text-gray-500 mt-1">{board.description}</p>
        )}
      </div>
      <KanbanBoard boardId={id} tasks={tasks ?? []} />
    </div>
  );
}
