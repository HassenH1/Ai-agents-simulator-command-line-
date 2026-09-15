import Anthropic from "@anthropic-ai/sdk";
import { AgentAction } from "./types.js";
import { warning } from "./style.js";

const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;
const model = "claude-haiku-4-5-20251001";

if (!client) {
  console.log(
    warning(
      "[llm] No ANTHROPIC_API_KEY found — running in MOCK mode with randomized actions.\n" +
        "      Set the env var to get real LLM-driven agent behavior.\n",
    ),
  );
}

const MOCK_ACTIONS = [
  "reads quietly",
  "grabs a coffee",
  "takes a walk",
  "jots down some notes",
  "people-watches",
];

/**
 * Ask the model to decide what an agent does next. Returns a parsed
 * AgentAction. Falls back to a mock action if no API key is configured
 * or if parsing fails, so the demo always keeps running.
 */
export async function decideAction(
  systemPrompt: string,
  situationPrompt: string,
): Promise<AgentAction> {
  if (!client) {
    return mockAction();
  }

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: situationPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";
    return parseAction(raw);
  } catch (err) {
    console.error(
      "[llm] API call failed, falling back to mock action:",
      (err as Error).message,
    );
    return mockAction();
  }
}

/** Ask the model to synthesize recent memories into one higher-level insight. */
export async function reflect(
  systemPrompt: string,
  memoriesText: string,
): Promise<string> {
  if (!client) {
    return "(mock) Nothing especially notable happened recently.";
  }
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 150,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content:
            `Here are some recent memories:\n${memoriesText}\n\n` +
            `In one short sentence, what's a higher-level insight or feeling you'd take away from these? ` +
            `Respond with just the sentence, no preamble.`,
        },
      ],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock && "text" in textBlock
      ? textBlock.text.trim()
      : "(no reflection generated)";
  } catch (err) {
    console.error("[llm] Reflection call failed:", (err as Error).message);
    return "(reflection unavailable)";
  }
}

const MOCK_LINES = [
  "That's a fair point.",
  "I hadn't thought of it that way.",
  "Oh, interesting — tell me more.",
  "Anyway, good running into you.",
  "Take care, talk again soon!",
];

/**
 * Ask the model for a single spoken line of dialogue (plain text, not JSON).
 * Used for back-and-forth conversation turns between two agents.
 */
export async function sayLine(
  systemPrompt: string,
  prompt: string,
): Promise<string> {
  if (!client) {
    return mockLine();
  }
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 100,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock && "text" in textBlock
      ? textBlock.text.trim()
      : mockLine();
  } catch (err) {
    console.error(
      "[llm] sayLine call failed, falling back to mock line:",
      (err as Error).message,
    );
    return mockLine();
  }
}

function mockLine(): string {
  return MOCK_LINES[Math.floor(Math.random() * MOCK_LINES.length)];
}

/**
 * Ask the model a yes/no question (used for "do you want to join this
 * conversation?"). Returns true only on a clear "yes". Mock mode returns
 * true about 40% of the time, so group conversations happen sometimes
 * without every bystander piling in.
 */
export async function askYesNo(
  systemPrompt: string,
  prompt: string,
): Promise<boolean> {
  if (!client) {
    return Math.random() < 0.4;
  }
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 10,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    const raw =
      textBlock && "text" in textBlock
        ? textBlock.text.trim().toLowerCase()
        : "";
    return raw.startsWith("y");
  } catch (err) {
    console.error(
      "[llm] askYesNo call failed, defaulting to no:",
      (err as Error).message,
    );
    return false;
  }
}

function mockAction(): AgentAction {
  const action = MOCK_ACTIONS[Math.floor(Math.random() * MOCK_ACTIONS.length)];
  return {
    action,
    dialogue: null,
    moveTo: null,
    thought: "(mock mode, no real reasoning)",
  };
}

function parseAction(raw: string): AgentAction {
  // The model may wrap JSON in prose or code fences; extract the first {...} block.
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return mockAction();
  try {
    const parsed = JSON.parse(match[0]);
    return {
      action:
        typeof parsed.action === "string" ? parsed.action : "does something",
      dialogue: typeof parsed.dialogue === "string" ? parsed.dialogue : null,
      moveTo: typeof parsed.moveTo === "string" ? parsed.moveTo : null,
      thought: typeof parsed.thought === "string" ? parsed.thought : "",
    };
  } catch {
    return mockAction();
  }
}
