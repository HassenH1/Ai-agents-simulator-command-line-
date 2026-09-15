import { MemoryStream } from "./memory.js";
import { decideAction, reflect, sayLine, askYesNo } from "./llm.js";
import { AgentAction } from "./types.js";

export class Agent {
  name: string;
  persona: string;
  location: string;
  memory = new MemoryStream();

  constructor(name: string, persona: string, startLocation: string) {
    this.name = name;
    this.persona = persona;
    this.location = startLocation;
    this.memory.add(
      0,
      `${name} starts the day at ${startLocation}.`,
      3,
      "observation",
    );
  }

  /** Record something this agent perceived (another agent's action, dialogue, etc). */
  perceive(tick: number, content: string, importance = 3): void {
    this.memory.add(tick, content, importance, "observation");
  }

  private systemPrompt(): string {
    return (
      `You are ${this.name}, a character living in a small simulated town. ` +
      `Persona: ${this.persona}\n\n` +
      `Given your persona, current situation, and relevant memories, decide what you do next this turn. ` +
      `Respond with ONLY a JSON object, no other text, in this exact shape:\n` +
      `{"action": "short present-tense action phrase", "dialogue": "something said aloud, or null", ` +
      `"moveTo": "a location name to move to, or null to stay put", "thought": "one short sentence of your reasoning"}`
    );
  }

  async decide(
    tick: number,
    locationsDescription: string,
    othersHere: string[],
  ): Promise<AgentAction> {
    const query = `${this.location} ${othersHere.join(" ")} ${this.persona}`;
    const relevantMemories = this.memory.retrieve(query, tick, 6);

    const memoriesText = relevantMemories.length
      ? relevantMemories
          .map((m) => `- (${m.kind}, tick ${m.tick}) ${m.content}`)
          .join("\n")
      : "- (none yet)";

    const situationPrompt =
      `Current tick: ${tick}\n` +
      `You are at: ${this.location}\n` +
      `Locations in town: ${locationsDescription}\n` +
      `Other people here right now: ${othersHere.length ? othersHere.join(", ") : "no one"}\n\n` +
      `Relevant memories:\n${memoriesText}\n\n` +
      `What do you do next?`;

    const result = await decideAction(this.systemPrompt(), situationPrompt);

    // Record the action itself as a new memory.
    const summary = result.dialogue
      ? `${this.name} ${result.action} and says: "${result.dialogue}"`
      : `${this.name} ${result.action}.`;
    this.memory.add(tick, summary, 4, "action");

    if (result.moveTo && result.moveTo !== this.location) {
      this.memory.add(
        tick,
        `${this.name} moves from ${this.location} to ${result.moveTo}.`,
        2,
        "action",
      );
      this.location = result.moveTo;
    }

    return result;
  }

  /**
   * Generate this agent's next line in an ongoing conversation. `othersDescription`
   * is a comma-separated list of everyone else currently in the conversation.
   * Returns plain text (no name prefix, no JSON) — one short line of dialogue.
   */
  async speak(
    tick: number,
    othersDescription: string,
    transcriptSoFar: string[],
  ): Promise<string> {
    const query = `conversation with ${othersDescription} ${this.persona}`;
    const relevantMemories = this.memory.retrieve(query, tick, 4);
    const memoriesText = relevantMemories.length
      ? relevantMemories.map((m) => `- ${m.content}`).join("\n")
      : "- (none yet)";

    const transcriptText = transcriptSoFar.length
      ? transcriptSoFar.join("\n")
      : "(the conversation is just starting)";

    const prompt =
      `You're in a conversation with ${othersDescription} at ${this.location}.\n\n` +
      `Relevant memories:\n${memoriesText}\n\n` +
      `Conversation so far:\n${transcriptText}\n\n` +
      `Say your next line of dialogue. Respond with ONLY the line itself — no name prefix, ` +
      `no quotation marks, no stage directions. Keep it natural and brief (1-2 sentences). ` +
      `If it feels like a natural point to wrap up, say a brief goodbye instead of continuing.`;

    return sayLine(this.systemPrompt(), prompt);
  }

  /**
   * Decide whether this agent wants to join a conversation `initiatorName` just
   * started nearby with `openingLine`. Returns true/false based on the agent's
   * own persona and memories — nothing forces them to engage.
   */
  async considerJoiningConversation(
    tick: number,
    initiatorName: string,
    openingLine: string,
  ): Promise<boolean> {
    const query = `${initiatorName} conversation ${this.persona}`;
    const relevantMemories = this.memory.retrieve(query, tick, 4);
    const memoriesText = relevantMemories.length
      ? relevantMemories.map((m) => `- ${m.content}`).join("\n")
      : "- (none yet)";

    const prompt =
      `You're at ${this.location}. ${initiatorName} just said, out loud, nearby: "${openingLine}"\n\n` +
      `Relevant memories:\n${memoriesText}\n\n` +
      `Given your persona and how you feel about ${initiatorName}, do you want to walk over and join this ` +
      `conversation? Respond with ONLY "yes" or "no".`;

    return askYesNo(this.systemPrompt(), prompt);
  }

  /** Returns the generated insight, or null if there wasn't enough recent memory to reflect on. */
  async reflectOnRecentMemories(tick: number): Promise<string | null> {
    const recent = this.memory.all().filter((m) => tick - m.tick <= 10);
    if (recent.length < 3) return null; // not enough to reflect on yet

    const memoriesText = recent.map((m) => `- ${m.content}`).join("\n");
    const insight = await reflect(this.systemPrompt(), memoriesText);
    this.memory.add(tick, `Reflection: ${insight}`, 7, "reflection");
    return insight;
  }
}
