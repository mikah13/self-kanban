import type { ChatCompletionTool } from "openai/resources/chat/completions";
import * as api from "./api.js";

const STATUSES = ["backlog", "todo", "in_progress", "in_review", "done", "cancelled"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

type Status = typeof STATUSES[number];
type Priority = typeof PRIORITIES[number];

function validateNumber(value: unknown, name: string): number {
  if (typeof value !== "number") {
    throw new Error(`${name} must be a number`);
  }
  return value;
}

function validateString(
  value: unknown,
  name: string,
  allowed: readonly string[]
): string {
  if (typeof value !== "string") {
    throw new Error(`${name} must be a string`);
  }
  if (allowed.length > 0 && !allowed.includes(value)) {
    throw new Error(`${name} must be one of: ${allowed.join(", ")}`);
  }
  return value;
}

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
            enum: STATUSES,
            description: "Filter by status",
          },
          priority: {
            type: "string",
            enum: PRIORITIES,
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
            enum: PRIORITIES,
          },
          status: {
            type: "string",
            enum: STATUSES,
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
            enum: PRIORITIES,
          },
          status: {
            type: "string",
            enum: STATUSES,
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
            enum: STATUSES,
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
        result = await api.getBoard(validateNumber(args.id, "id"));
        break;
      case "list_tasks":
        result = await api.listTasks(validateNumber(args.board_id, "board_id"), {
          status: args.status ? validateString(args.status, "status", STATUSES) : undefined,
          priority: args.priority ? validateString(args.priority, "priority", PRIORITIES) : undefined,
        });
        break;
      case "get_task":
        result = await api.getTask(
          validateNumber(args.board_id, "board_id"),
          validateNumber(args.task_id, "task_id")
        );
        break;
      case "create_task":
        result = await api.createTask(validateNumber(args.board_id, "board_id"), {
          title: validateString(args.title, "title", []),
          description: args.description as string | undefined,
          priority: args.priority ? validateString(args.priority, "priority", PRIORITIES) : undefined,
          status: args.status ? validateString(args.status, "status", STATUSES) : undefined,
        });
        break;
      case "update_task": {
        const { board_id, task_id, ...fields } = args;
        result = await api.updateTask(
          validateNumber(board_id, "board_id"),
          validateNumber(task_id, "task_id"),
          {
            title: fields.title as string | undefined,
            description: fields.description as string | undefined,
            priority: fields.priority ? validateString(fields.priority, "priority", PRIORITIES) : undefined,
            status: fields.status ? validateString(fields.status, "status", STATUSES) : undefined,
          }
        );
        break;
      }
      case "update_task_status":
        result = await api.updateTaskStatus(
          validateNumber(args.board_id, "board_id"),
          validateNumber(args.task_id, "task_id"),
          validateString(args.status, "status", STATUSES)
        );
        break;
      case "delete_task":
        result = await api.deleteTask(
          validateNumber(args.board_id, "board_id"),
          validateNumber(args.task_id, "task_id")
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
