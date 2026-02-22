import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { tools, handleToolCall } from "./tools.js";

let client: OpenAI;

export function initAI() {
  client = new OpenAI({
    baseURL: process.env.AI_BASE_URL || "https://openrouter.ai/api/v1",
    apiKey: process.env.AI_API_KEY,
  });
}

const model = process.env.AI_MODEL || "openai/gpt-4o-mini";

const SYSTEM_PROMPT = `You are a helpful kanban board assistant. You help users manage and understand their tasks and boards.

You have tools to read and modify kanban boards and tasks. Always use these tools to get current data before answering questions — do not guess or make up data.

When listing tasks, format them in a readable way. Include relevant details like status, priority, and dates when available.

When modifying tasks (create, update, delete), confirm what you did in your response.

Keep responses concise and focused.`;

export async function chat(
  messages: ChatCompletionMessageParam[]
): Promise<string> {
  const allMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  // Tool call loop — keep going until the model gives a text response
  while (true) {
    const response = await client.chat.completions.create({
      model,
      messages: allMessages,
      tools,
    });

    const choice = response.choices[0];
    if (!choice) return "No response from AI.";

    const message = choice.message;
    allMessages.push(message);

    // If no tool calls, return the text content
    if (!message.tool_calls?.length) {
      return message.content || "";
    }

    // Execute tool calls and append results
    for (const toolCall of message.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments);
      const result = await handleToolCall(toolCall.function.name, args);
      allMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }
}
