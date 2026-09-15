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
