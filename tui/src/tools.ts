import type { ChatCompletionTool } from "openai/resources/chat/completions";
import * as api from "./api.js";

export const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_boards",
      description: "List all kanban boards",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_board",
      description: "Get details of a specific board",
      parameters: {
        type: "object",
        properties: { id: { type: "number", description: "Board ID" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description:
        "List tasks on a board. Can filter by status and priority.",
      parameters: {
        type: "object",
        properties: {
          board_id: { type: "number", description: "Board ID" },
          status: {
            type: "string",
            enum: [
              "backlog",
              "todo",
              "in_progress",
              "in_review",
              "done",
              "cancelled",
            ],
            description: "Filter by status",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
            description: "Filter by priority",
          },
        },
        required: ["board_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_task",
      description: "Get details of a specific task",
      parameters: {
        type: "object",
        properties: {
          board_id: { type: "number", description: "Board ID" },
          task_id: { type: "number", description: "Task ID" },
        },
        required: ["board_id", "task_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task on a board",
      parameters: {
        type: "object",
        properties: {
          board_id: { type: "number", description: "Board ID" },
          title: { type: "string", description: "Task title" },
          description: { type: "string", description: "Task description" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
          },
          status: {
            type: "string",
            enum: [
              "backlog",
              "todo",
              "in_progress",
              "in_review",
              "done",
              "cancelled",
            ],
          },
        },
        required: ["board_id", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Update fields of an existing task",
      parameters: {
        type: "object",
        properties: {
          board_id: { type: "number", description: "Board ID" },
          task_id: { type: "number", description: "Task ID" },
          title: { type: "string" },
          description: { type: "string" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
          },
          status: {
            type: "string",
            enum: [
              "backlog",
              "todo",
              "in_progress",
              "in_review",
              "done",
              "cancelled",
            ],
          },
        },
        required: ["board_id", "task_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task_status",
      description: "Move a task to a new status column",
      parameters: {
        type: "object",
        properties: {
          board_id: { type: "number", description: "Board ID" },
          task_id: { type: "number", description: "Task ID" },
          status: {
            type: "string",
            enum: [
              "backlog",
              "todo",
              "in_progress",
              "in_review",
              "done",
              "cancelled",
            ],
          },
        },
        required: ["board_id", "task_id", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Delete (soft-delete) a task",
      parameters: {
        type: "object",
        properties: {
          board_id: { type: "number", description: "Board ID" },
          task_id: { type: "number", description: "Task ID" },
        },
        required: ["board_id", "task_id"],
      },
    },
  },
];

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    let result: unknown;
    switch (name) {
      case "list_boards":
        result = await api.listBoards();
        break;
      case "get_board":
        result = await api.getBoard(args.id as number);
        break;
      case "list_tasks":
        result = await api.listTasks(args.board_id as number, {
          status: args.status as string | undefined,
          priority: args.priority as string | undefined,
        });
        break;
      case "get_task":
        result = await api.getTask(
          args.board_id as number,
          args.task_id as number
        );
        break;
      case "create_task":
        result = await api.createTask(args.board_id as number, {
          title: args.title as string,
          description: args.description as string | undefined,
          priority: args.priority as string | undefined,
          status: args.status as string | undefined,
        });
        break;
      case "update_task": {
        const { board_id, task_id, ...fields } = args;
        result = await api.updateTask(
          board_id as number,
          task_id as number,
          fields as { title?: string; description?: string; priority?: string; status?: string }
        );
        break;
      }
      case "update_task_status":
        result = await api.updateTaskStatus(
          args.board_id as number,
          args.task_id as number,
          args.status as string
        );
        break;
      case "delete_task":
        result = await api.deleteTask(
          args.board_id as number,
          args.task_id as number
        );
        break;
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
    return JSON.stringify(result);
  } catch (err) {
    return JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
