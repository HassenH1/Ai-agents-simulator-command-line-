import chalk, { ChalkInstance } from "chalk";

// A rotating palette so each agent gets a distinct, consistent color for the
// whole run (assigned in order of first appearance).
const PALETTE: ChalkInstance[] = [
  chalk.cyan,
  chalk.magenta,
  chalk.yellow,
  chalk.green,
  chalk.blue,
  chalk.red,
  chalk.cyanBright,
  chalk.magentaBright,
];

const assignedColors = new Map<string, ChalkInstance>();
let nextPaletteIndex = 0;

export function colorFor(name: string): ChalkInstance {
  let color = assignedColors.get(name);
  if (!color) {
    color = PALETTE[nextPaletteIndex % PALETTE.length];
    nextPaletteIndex++;
    assignedColors.set(name, color);
  }
  return color;
}

export function tickHeader(tick: number): string {
  return chalk.bold.white.underline(`\n=== Tick ${tick} ===`);
}

export function reflectionHeader(tick: number): string {
  return chalk.bold.yellowBright(`--- reflection pass (tick ${tick}) ---`);
}

export function reflectionLine(name: string, insight: string): string {
  return `    ${colorFor(name).bold(name)} ${chalk.yellow("reflects:")} ${chalk.italic(insight)}`;
}

export function actionLine(
  name: string,
  location: string,
  action: string,
  dialogue: string | null,
  moveNote: string,
): string {
  const color = colorFor(name);
  const locationTag = chalk.dim(`[${location}]`);
  const styledName = color.bold(name);
  const dialoguePart = dialogue
    ? chalk.white.italic(` says: "${dialogue}"`)
    : "";
  const movePart = moveNote ? chalk.gray(moveNote) : "";
  return `${locationTag} ${styledName}: ${chalk.reset(action)}${dialoguePart}${movePart}`;
}

export function thoughtLine(thought: string): string {
  return chalk.dim.gray(`    (thinking: ${thought})`);
}

export function conversationHeader(names: string[]): string {
  const styledNames = names.map((n) => colorFor(n)(n));
  const joined =
    styledNames.length === 2
      ? styledNames.join(" and ")
      : styledNames.slice(0, -1).join(", ") +
        ", and " +
        styledNames[styledNames.length - 1];
  return chalk.bold(`  💬 ${joined} start talking:`);
}

export function conversationLine(rawLine: string): string {
  const separatorIndex = rawLine.indexOf(":");
  if (separatorIndex === -1) return chalk.gray(`     ${rawLine}`);

  const name = rawLine.slice(0, separatorIndex);
  const rest = rawLine.slice(separatorIndex + 1);
  const color = colorFor(name);
  return `     ${color.bold(name)}:${chalk.white.italic(rest)}`;
}

export function warning(text: string): string {
  return chalk.yellow(text);
}

export function muted(text: string): string {
  return chalk.gray(text);
}

export function success(text: string): string {
  return chalk.bold.green(text);
}
