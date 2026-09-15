import { Location } from "./types.js";

export const LOCATIONS: Location[] = [
  {
    name: "Cafe",
    description: "a cozy cafe with good coffee and small tables",
  },
  { name: "Park", description: "a green park with a pond and walking paths" },
  { name: "Library", description: "a quiet library full of books" },
  { name: "Market", description: "a busy market with fresh produce stalls" },
  { name: "Police Station", description: "the small local police station" },
];

/**
 * Register a private home location for each given name (e.g. "Mira's Home").
 * Call this once with all agent names before starting the simulation, so
 * everyone has somewhere private to start the day and retreat to.
 */
export function registerHomeLocations(names: string[]): void {
  for (const name of names) {
    const homeName = `${name}'s Home`;
    if (!isValidLocation(homeName)) {
      LOCATIONS.push({
        name: homeName,
        description: `${name}'s home — a private, quiet place to rest`,
      });
    }
  }
}

export function locationsDescription(): string {
  return LOCATIONS.map((l) => `${l.name} (${l.description})`).join("; ");
}

export function isValidLocation(name: string): boolean {
  return LOCATIONS.some((l) => l.name.toLowerCase() === name.toLowerCase());
}
