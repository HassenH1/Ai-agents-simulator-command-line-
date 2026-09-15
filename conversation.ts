import { Agent } from "./agent.js";

const MAX_TOTAL_TURNS = 10; // hard cap across all participants so group chats can't run forever
// Deliberately specific multi-word phrases to avoid false positives like
// "good to see you here" (which contains "see you" but isn't a goodbye).
const ENDING_PHRASES = [
  "goodbye",
  "see you later",
  "see you around",
  "see you soon",
  "talk to you later",
  "talk again soon",
  "gotta go",
  "i should get going",
  "i'll let you go",
  "take care now",
  "catch you later",
  "project baby out this bitch",
  "I'm out fr",
];

export interface ConversationResult {
  transcript: string[];
  participants: Agent[]; // includes the initiator; length 1 means no one joined
}

/**
 * Start a conversation from `initiator`'s opening line. Every other agent
 * currently free at the same location (`candidates`) is independently asked
 * whether they want to join, based on their own persona and memories. Anyone
 * who says yes becomes a participant; anyone who says no just doesn't join
 * (they still perceive that a conversation happened nearby).
 *
 * Once the group is set, participants take turns round-robin until someone
 * says something that sounds like a goodbye, or MAX_TOTAL_TURNS is hit.
 */
export async function runConversation(
  initiator: Agent,
  openingLine: string,
  candidates: Agent[],
  tick: number,
): Promise<ConversationResult> {
  const transcript: string[] = [`${initiator.name}: ${openingLine}`];
  const participants: Agent[] = [initiator];

  // Ask each bystander, in parallel, whether they want to join.
  const joinDecisions = await Promise.all(
    candidates.map((candidate) =>
      candidate.considerJoiningConversation(tick, initiator.name, openingLine),
    ),
  );
  candidates.forEach((candidate, i) => {
    if (joinDecisions[i]) participants.push(candidate);
  });

  // Nobody joined — this was just a line said out loud, not really a "conversation".
  // Don't add a redundant memory; the speaker's own action memory already covers it.
  if (participants.length === 1) {
    return { transcript, participants };
  }

  let turnCount = 0;
  let speakerIndex = 1 % participants.length; // the first joiner responds first
  let ended = soundsLikeGoodbye(openingLine);

  while (!ended && turnCount < MAX_TOTAL_TURNS) {
    const speaker = participants[speakerIndex];
    const others = participants.filter((p) => p !== speaker).map((p) => p.name);
    const line = await speaker.speak(tick, others.join(", "), transcript);
    const cleanLine = line.trim();
    if (!cleanLine) break;

    transcript.push(`${speaker.name}: ${cleanLine}`);
    turnCount++;
    if (soundsLikeGoodbye(cleanLine)) {
      ended = true;
      break;
    }
    speakerIndex = (speakerIndex + 1) % participants.length;
  }

  recordConversation(participants, tick, transcript);
  return { transcript, participants };
}

function recordConversation(
  participants: Agent[],
  tick: number,
  transcript: string[],
): void {
  const names = participants.map((p) => p.name).join(", ");
  const summary = `Conversation among ${names}: ${transcript.join(" / ")}`;
  for (const p of participants) {
    p.memory.add(tick, summary, 5, "dialogue");
  }
}

function soundsLikeGoodbye(line: string): boolean {
  const lower = line.toLowerCase();
  return ENDING_PHRASES.some((phrase) => lower.includes(phrase));
}
