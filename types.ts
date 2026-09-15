export interface MemoryEvent {
  id: number;
  tick: number;
  content: string;
  importance: number; // 1-10, how significant this memory is
  kind: "observation" | "action" | "dialogue" | "reflection";
}

export interface AgentAction {
  action: string;       // short verb phrase, e.g. "reads a book"
  dialogue: string | null; // something said out loud, or null
  moveTo: string | null;   // a location name to move to, or null to stay
  thought: string;      // brief internal reasoning, for logging/debugging
}

export interface Location {
  name: string;
  description: string;
}
