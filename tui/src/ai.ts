import { OpenRouter } from "@openrouter/sdk";
import type { Message } from "@openrouter/sdk/models/message.js";
import type { ToolDefinitionJson } from "@openrouter/sdk/models/tooldefinitionjson.js";
import { tools, handleToolCall } from "./tools.js";
import { Model } from "@openrouter/sdk/models";

let client: OpenRouter;

export function initAI() {
  client = new OpenRouter({
    apiKey: process.env.AI_API_KEY,
  });
}

const model = process.env.AI_MODEL || "openai/gpt-4o-mini";

const SYSTEM_PROMPT = `You are a helpful kanban board assistant. You help users manage and understand their tasks and boards.

You have tools to read and modify kanban boards and tasks. Always use these tools to get current data before answering questions — do not guess or make up data.

When listing tasks, format them in a readable way. Include relevant details like status, priority, and dates when available.

When modifying tasks (create, update, delete), confirm what you did in your response.

Keep responses concise and focused.`;

export async function chat(messages: Message[]): Promise<string> {
  const allMessages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  // Tool call loop — keep going until the model gives a text response
  while (true) {
    const response = await client.chat.send({
      chatGenerationParams: {
        model: model,
        messages: allMessages,
        tools: tools as ToolDefinitionJson[],
        stream: false,
      }
    });

    const choice = response.choices[0];
    if (!choice) return "No response from AI.";

    const message = choice.message;
    allMessages.push(message);

    // If no tool calls, return the text content
    if (!message.toolCalls?.length) {
      return (typeof message.content === "string" ? message.content : "") || "";
    }

    // Execute tool calls and append results
    for (const toolCall of message.toolCalls) {
      const args = JSON.parse(toolCall.function.arguments);
      const result = await handleToolCall(toolCall.function.name, args);
      allMessages.push({
        role: "tool",
        toolCallId: toolCall.id,
        content: result,
      });
    }
  }
}
