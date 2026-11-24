/** Loop trainer rules: one part of a song, repeated, speeding up as it gets clean. */

/** A pass counts as clean at this accuracy; the loop then speeds up. */
export const LOOP_CLEAN = 0.9;
/** Below this the loop slows down again. */
export const LOOP_STRUGGLE = 0.55;
export const LOOP_STEP = 0.05;
export const LOOP_MIN = 0.5;

/** The tempo for the next pass of the loop trainer. */
export function nextLoopTempo(tempo: number, accuracy: number, ramp: boolean): number {
  if (!ramp) return tempo;
  const round = (t: number) => Math.round(t * 100) / 100;
  if (accuracy >= LOOP_CLEAN) return round(Math.min(1, tempo + LOOP_STEP));
  if (accuracy < LOOP_STRUGGLE) return round(Math.max(LOOP_MIN, tempo - LOOP_STEP));
  return tempo;
}
