import type { Priority, Status } from "./types";

export const STATUSES: Status[] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "cancelled",
];

export const STATUS_LABELS: Record<Status, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<Status, string> = {
  backlog: "bg-gray-100 text-gray-700",
  todo: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  in_review: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
};

export const DEFAULT_OWNER = "me";
