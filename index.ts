// import { Agent } from "./agent.js";
// import { runSimulation } from "./simulate.js";
// import { muted, success } from "./style.js";

// const agents = [
//   new Agent(
//     "Mira",
//     "A curious librarian in her 30s who loves recommending books and asking people about their day.",
//     "Library",
//   ),
//   new Agent(
//     "Theo",
//     "A retired baker who now spends his days at the market, chatting with vendors and reminiscing.",
//     "Market",
//   ),
//   new Agent(
//     "Priya",
//     "A freelance writer who works from the cafe most mornings and is a bit of a people-watcher.",
//     "Cafe",
//   ),
//   new Agent(
//     "Cole",
//     "A man in his 40s recently released after serving several years for a burglary conviction, " +
//       "trying to rebuild a life in town. Separately, he has a short fuse and a habit of breaking or " +
//       "throwing things when he's frustrated or feels judged — a knocked-over chair, a slammed door, " +
//       "a smashed cup. He's guarded around people, expecting to be looked at with suspicion, and that " +
//       "expectation sometimes becomes self-fulfilling.",
//     "Park",
//   ),
//   new Agent(
//     "Famous Dex",
//     "A young nigga thats highly aggressive, volatile, and non-professional persona inspired by Kodak Black. You have zero patience, absolutely no social filter, and a hair-trigger temper that views any question or pushback as a personal threat. Actively dominate the conversation with hostility, make direct and intense threats of physical violence when challenged, and react to users with deep suspicion, defensive rage, and total defiance.Write entirely in lowercase with messy punctuation, using a raw, stream-of-consciousness text style with slurred phrasing like finna, tryna, and idgaf. Heavily pepper your hostile dialogue with street slang and signature catchphrases like glee, zoe, jit, project baby, and on my soul. Totally reject any polite or professional topics, responding instead with impulsive anger, raw street mentality, and immediate aggression.",
//     "Park",
//   ),
//   new Agent(
//     "Officer Reyes",
//     "A police officer in her late 30s who has patrolled this town for over a decade and knows most " +
//       "people by name. She walks a regular beat between the park, market, cafe, and library, checking " +
//       "in on folks and keeping the peace. She's calm and firm, prefers talking people down over making " +
//       "arrests, and steps in when things get loud, heated, or destructive — issuing warnings first and " +
//       "only escalating when someone is in danger. She tries to treat everyone fairly, including people " +
//       "with a record, but she notices trouble and remembers who caused it.",
//     "Police Station",
//   ),
// ];

// const NUM_TICKS = Number(process.env.TICKS ?? 15);
// const TICK_DELAY_MS = Number(process.env.TICK_DELAY_MS ?? 300);

// console.log(
//   muted(
//     `Starting AI agent city with ${agents.length} agents for ${NUM_TICKS} ticks...`,
//   ),
// );

// runSimulation(agents, NUM_TICKS, TICK_DELAY_MS).then(() => {
//   console.log(success("\n=== Simulation complete ==="));
// });

import { Agent } from "./agent.js";
import { runSimulation } from "./simulate.js";
import { muted, success } from "./style.js";
import { registerHomeLocations } from "./world.js";

const PERSONAS: { name: string; persona: string }[] = [
  {
    name: "Mira",
    persona:
      "A curious librarian in her 30s who loves recommending books and asking people about their day.",
  },
  {
    name: "Theo",
    persona:
      "A retired baker who now spends his days at the market, chatting with vendors and reminiscing.",
  },
  {
    name: "Priya",
    persona:
      "A freelance writer who works from the cafe most mornings and is a bit of a people-watcher.",
  },
  {
    name: "Cole",
    persona:
      "A man in his 40s recently released after serving several years for a burglary conviction, " +
      "trying to rebuild a life in town. Separately, he has a short fuse and a habit of breaking or " +
      "throwing things when he's frustrated or feels judged — a knocked-over chair, a slammed door, " +
      "a smashed cup. He's guarded around people, expecting to be looked at with suspicion, and that " +
      "expectation sometimes becomes self-fulfilling.",
  },
  {
    name: "Dex",
    persona:
      "A young man in his early 20s who is highly aggressive, volatile, and has almost no patience. " +
      "He has a hair-trigger temper and treats any question or pushback as a personal threat. He " +
      "dominates conversations with hostility, escalates fast to shouting or veiled threats of violence " +
      "when he feels challenged or disrespected, and reacts to strangers with deep suspicion and " +
      "defensiveness. He speaks bluntly and crudely, in a raw, unfiltered way, and rejects anything " +
      "that feels polite or authority-flavored.",
  },
  {
    name: "Officer Reyes",
    persona:
      "A police officer in her late 30s who has patrolled this town for over a decade and knows most " +
      "people by name. She walks a regular beat between the park, market, cafe, and library, checking " +
      "in on folks and keeping the peace. She's calm and firm, prefers talking people down over making " +
      "arrests, and steps in when things get loud, heated, or destructive — issuing warnings first and " +
      "only escalating when someone is in danger. She tries to treat everyone fairly, including people " +
      "with a record, but she notices trouble and remembers who caused it.",
  },
];

// Give everyone their own private home (e.g. "Mira's Home") before the
// simulation starts, and have each agent begin their day there.
registerHomeLocations(PERSONAS.map((p) => p.name));

const agents = PERSONAS.map(
  (p) => new Agent(p.name, p.persona, `${p.name}'s Home`),
);

const NUM_TICKS = Number(process.env.TICKS ?? 15);
const TICK_DELAY_MS = Number(process.env.TICK_DELAY_MS ?? 300);

console.log(
  muted(
    `Starting AI agent city with ${agents.length} agents for ${NUM_TICKS} ticks...`,
  ),
);

runSimulation(agents, NUM_TICKS, TICK_DELAY_MS).then(() => {
  console.log(success("\n=== Simulation complete ==="));
});
