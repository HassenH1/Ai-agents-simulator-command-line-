import { Agent } from "./agent.js";
import { locationsDescription, isValidLocation } from "./world.js";
import { runConversation } from "./conversation.js";
import {
  tickHeader,
  reflectionHeader,
  reflectionLine,
  actionLine,
  thoughtLine,
  conversationHeader,
  conversationLine,
} from "./style.js";

const REFLECTION_INTERVAL = 5; // ticks between reflection passes

export async function runSimulation(
  agents: Agent[],
  numTicks: number,
  tickDelayMs: number,
): Promise<void> {
  const locDesc = locationsDescription();

  for (let tick = 1; tick <= numTicks; tick++) {
    console.log(tickHeader(tick));

    // Snapshot who's where before anyone moves this tick, so perception is consistent.
    const whoIsWhere = new Map<string, string[]>();
    for (const agent of agents) {
      const list = whoIsWhere.get(agent.location) ?? [];
      list.push(agent.name);
      whoIsWhere.set(agent.location, list);
    }

    // Agents who already acted this tick (either on their own turn, or as a
    // conversation partner) are skipped when their own turn comes up.
    const handledThisTick = new Set<string>();

    for (const agent of agents) {
      if (handledThisTick.has(agent.name)) continue;

      const othersHere = (whoIsWhere.get(agent.location) ?? []).filter(
        (n) => n !== agent.name,
      );

      const result = await agent.decide(tick, locDesc, othersHere);
      handledThisTick.add(agent.name);

      const moveNote =
        result.moveTo && isValidLocation(result.moveTo)
          ? ` -> heading to ${result.moveTo}`
          : "";
      console.log(
        actionLine(
          agent.name,
          agent.location,
          result.action,
          result.dialogue,
          moveNote,
        ),
      );
      if (result.thought) console.log(thoughtLine(result.thought));

      // If this agent wants to talk and someone else is here, offer everyone
      // free at this location a chance to join the conversation.
      const openingLine = result.dialogue;
      let participants: Agent[] = [];

      if (openingLine) {
        const candidates = agents.filter(
          (a) =>
            a !== agent &&
            !handledThisTick.has(a.name) &&
            othersHere.includes(a.name),
        );
        if (candidates.length > 0) {
          const convo = await runConversation(
            agent,
            openingLine,
            candidates,
            tick,
          );
          participants = convo.participants;

          if (participants.length > 1) {
            console.log(conversationHeader(participants.map((p) => p.name)));
            // The opening line is already logged above, so just print the rest.
            for (const line of convo.transcript.slice(1)) {
              console.log(conversationLine(line));
            }
            for (const p of participants) {
              if (p !== agent) handledThisTick.add(p.name);
            }
          }
        }
      }

      // Broadcast this action as a perceived observation to anyone else present
      // who wasn't part of the conversation (they get a memory of the full
      // exchange instead, recorded inside runConversation).
      const participantNames = new Set(participants.map((p) => p.name));
      for (const other of agents) {
        if (other === agent) continue;
        if (participantNames.has(other.name)) continue;
        if ((whoIsWhere.get(agent.location) ?? []).includes(other.name)) {
          const note =
            participants.length > 1
              ? `${participants.map((p) => p.name).join(", ")} had a conversation nearby.`
              : result.dialogue
                ? `${agent.name} said "${result.dialogue}" while ${result.action}.`
                : `${agent.name} ${result.action}.`;
          other.perceive(tick, note, 3);
        }
      }
    }

    if (tick % REFLECTION_INTERVAL === 0) {
      console.log(reflectionHeader(tick));
      for (const agent of agents) {
        const insight = await agent.reflectOnRecentMemories(tick);
        if (insight) console.log(reflectionLine(agent.name, insight));
      }
    }

    if (tickDelayMs > 0) {
      await sleep(tickDelayMs);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
