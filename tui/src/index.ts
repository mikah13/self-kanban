import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import chalk from "chalk";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { chat, initAI } from "./ai.js";

if (!process.env.AI_API_KEY) {
  console.error(
    chalk.red("Error: AI_API_KEY environment variable is required.")
  );
  console.error(
    chalk.dim(
      "Set it with: export AI_API_KEY=your-key\n" +
        "Optional: AI_BASE_URL (default: OpenRouter), AI_MODEL (default: openai/gpt-4o-mini)"
    )
  );
  process.exit(1);
}

initAI();

const rl = readline.createInterface({ input: stdin, output: stdout });

console.log(chalk.bold("\n  self-kanban AI assistant\n"));
console.log(
  chalk.dim(
    '  Ask me about your boards and tasks. Type "exit" to quit.\n'
  )
);

const messages: ChatCompletionMessageParam[] = [];

async function main() {
  while (true) {
    let input: string;
    try {
      input = await rl.question(chalk.green("You: "));
    } catch {
      // Ctrl+C or stream closed
      break;
    }

    const trimmed = input.trim();
    if (!trimmed) continue;
    if (trimmed === "exit" || trimmed === "quit") break;

    messages.push({ role: "user", content: trimmed });

    try {
      process.stdout.write(chalk.dim("  thinking...\r"));
      const response = await chat(messages);
      // Clear the "thinking..." line
      process.stdout.write("              \r");
      console.log(chalk.cyan("AI: ") + response + "\n");
      messages.push({ role: "assistant", content: response });
    } catch (err) {
      process.stdout.write("              \r");
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`Error: ${msg}\n`));
    }
  }

  console.log(chalk.dim("\nGoodbye!\n"));
  rl.close();
}

main();
