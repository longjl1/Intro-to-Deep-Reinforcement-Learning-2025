import type { Snapshot } from './rl';

/** Sparse worker batches and episode resets must never invent a path through the map. */
export function canAnimateAgent(previous: Snapshot | null, next: Snapshot | null, cols: number, fast: boolean, speed: number): boolean {
  if (!previous || !next || fast || speed > 10) return false;
  const t = next.transition;
  if (!t || t.event === 'cliff' || next.steps !== previous.steps + 1 || next.episodeSteps !== previous.episodeSteps + 1) return false;
  if (t.state !== previous.state || t.nextState !== next.state) return false;
  const distance = Math.abs(previous.state % cols - next.state % cols)
    + Math.abs(Math.floor(previous.state / cols) - Math.floor(next.state / cols));
  return distance === 1;
}
