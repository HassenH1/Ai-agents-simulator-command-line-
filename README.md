# AI Agent City (minimal CLI demo)

A tiny TypeScript implementation of the "generative agents" pattern (Stanford's
Smallville, AI Town, etc.): a handful of persona-driven agents living in a
small town, each with their own memory stream, who perceive each other, decide
what to do next via an LLM call, and occasionally reflect on recent events.

## Setup

```bash
npm install
```

To get real LLM-driven behavior, set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Without a key set, the demo runs in **mock mode** — agents take random
canned actions so you can see the loop working without any API calls.

## Run it

```bash
npm start
```

Optional env vars:

- `TICKS` — how many simulation steps to run (default 15)
- `TICK_DELAY_MS` — pause between ticks in ms, for readability (default 300)

Example:

```bash
TICKS=30 TICK_DELAY_MS=500 npm start
```

## Example output

Here's what the first two ticks of a run look like. Each line shows where the
agent is, what they chose to do, anything they said, and where they're headed
next, followed by their internal reasoning:

```text
Starting AI agent city with 6 agents for 15 ticks...

=== Tick 1 ===
[Mira's Home] Mira: prepare a cup of tea and settle in at home
    (thinking: It's early morning and I'm just starting my day, so I'll take a moment to ease into it before heading out to interact with others in town.)
[Market] Theo: get up and prepare for the day says: "Another beautiful day ahead. Time to head to the market and see what's happening." -> heading to Market
    (thinking: It's early in the day and I always enjoy visiting the market to chat with the vendors and catch up on the town gossip.)
[Cafe] Priya: finish morning coffee and prepare to head out -> heading to Cafe
    (thinking: As a freelance writer who works from the cafe most mornings, I should head there to start my day and observe the town coming to life.)
[Cole's Home] Cole: get up and make some coffee
    (thinking: Starting the day with a routine helps keep me grounded and away from trouble.)
[Park] Dex: grab jacket and head out says: "Let's get outta here, need some air" -> heading to Park
    (thinking: Sitting around at home is boring and makes me restless, might as well go somewhere and see if anything interesting happens.)
[Police Station] Officer Reyes: finish morning coffee and prepare for the day shift -> heading to Police Station
    (thinking: Time to head to the station and get briefed before starting my regular beat through town.)

=== Tick 2 ===
[Library] Mira: sip tea and check the library's new arrivals says: "I wonder who I'll run into at the library today - maybe I can finally ask Theo about that book I recommended last week" -> heading to Library
    (thinking: I'm refreshed after my tea, and it's time to get to the library and see if there are new books to catalogue and people to chat with.)
[Market] Theo: browse the produce stalls and wait for vendors to arrive says: "Beautiful morning at the market. Wonder who'll be setting up today."
    (thinking: It's early and no one's here yet, so I'll look around the stalls and settle in for my daily market routine.)
[Cafe] Priya: settle in at a corner table with laptop and coffee says: "Another quiet morning at the cafe—perfect for getting some work done."
    (thinking: As a freelance writer, the cafe is my usual workspace, and the calm atmosphere now is ideal for focusing on my writing while still being able to observe whoever comes in later.)
[Cole's Home] Cole: drink coffee and sit on the porch
    (thinking: Need to settle my mind before heading out into town where people will be watching me.)
[Cafe] Dex: pace around the park, restless and agitated says: "Ugh, whatever. Nothin' to do here either." -> heading to Cafe
    (thinking: Park's boring and empty—need to find someone to actually talk to or something to do before I lose my mind.)
[Park] Officer Reyes: begin morning patrol route says: "Another day in town. Let me start with the park and work through my usual spots." -> heading to Park
```

## How it works

- **`src/types.ts`** — shared types (memories, actions, locations)
- **`src/memory.ts`** — `MemoryStream`: stores timestamped memories per agent
  and retrieves the most relevant ones using a recency + importance +
  keyword-overlap score (a lightweight stand-in for the embedding-based
  retrieval used in the original research)
- **`src/llm.ts`** — wraps the Anthropic API call that asks "what do you do
  next?" and parses the JSON response; falls back to mock actions if there's
  no API key or the call fails
- **`src/agent.ts`** — the `Agent` class: holds a persona, a memory stream,
  and the perceive → retrieve → decide → record loop, plus a `speak()` method
  used during conversations
- **`src/conversation.ts`** — starts from one agent's opening line, then asks
  every other free agent at that location whether they want to join (each
  decides independently based on their own persona and memories). Whoever
  says yes becomes a participant; the group then takes turns round-robin
  until someone signs off or a turn cap is hit
- **`src/world.ts`** — the shared public locations agents can occupy, plus
  `registerHomeLocations()` which adds a private "X's Home" location for
  each agent name before the simulation starts
- **`src/style.ts`** — terminal color helpers (via `chalk`); each agent gets
  a consistent color for the whole run, with dedicated formatting for
  actions, thoughts, conversations, and reflections
- **`src/simulate.ts`** — steps every agent forward each tick, broadcasts
  actions to other agents in the same location, and triggers a reflection
  pass every few ticks
- **`src/index.ts`** — defines the agents' personas and starting locations,
  then kicks off the simulation

## Where to take it from here

- **Real semantic retrieval**: swap the keyword-overlap scoring in
  `memory.ts` for actual embeddings (e.g. call an embeddings endpoint, store
  vectors, use cosine similarity) for much better relevance matching.
- **Leaving mid-conversation**: right now participants stay until the whole
  group wraps up. You could let each agent decide whether to bail after
  their own turn.
- **Pathfinding / a real map**: locations currently teleport agents directly.
  A grid with actual movement and travel time would feel more like a "city."
- **Persistence**: write memories to a file or SQLite DB so a run can be
  paused and resumed.
- **Visualization**: pipe the tick log into a simple 2D canvas (e.g. a small
  React app) instead of (or alongside) the console output.
