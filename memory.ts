import { MemoryEvent } from "./types.js";

/**
 * A simple stand-in for the "memory stream" from the Generative Agents paper.
 * Real implementations use vector embeddings for the relevance score; this
 * demo uses keyword overlap instead so it runs with zero extra API calls
 * or dependencies. Swap `relevanceScore` out for an embedding-based cosine
 * similarity later if you want closer-to-real behavior.
 */
export class MemoryStream {
  private memories: MemoryEvent[] = [];
  private nextId = 1;

  add(tick: number, content: string, importance: number, kind: MemoryEvent["kind"]): void {
    this.memories.push({ id: this.nextId++, tick, content, importance, kind });
  }

  all(): MemoryEvent[] {
    return this.memories;
  }

  /**
   * Retrieve the top-k memories most relevant to `query`, scored by a
   * weighted mix of recency, importance, and keyword relevance.
   */
  retrieve(query: string, currentTick: number, k = 6): MemoryEvent[] {
    const queryWords = new Set(tokenize(query));

    const scored = this.memories.map((m) => {
      const age = currentTick - m.tick;
      const recency = Math.exp(-age / 20); // exponential decay, half-life-ish window
      const importance = m.importance / 10;
      const relevance = relevanceScore(queryWords, tokenize(m.content));

      const score = 0.4 * recency + 0.3 * importance + 0.3 * relevance;
      return { memory: m, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map((s) => s.memory);
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function relevanceScore(queryWords: Set<string>, contentWords: string[]): number {
  if (queryWords.size === 0 || contentWords.length === 0) return 0;
  const overlap = contentWords.filter((w) => queryWords.has(w)).length;
  return overlap / Math.sqrt(contentWords.length);
}
