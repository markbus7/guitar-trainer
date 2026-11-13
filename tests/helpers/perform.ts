import type { Chart } from '../../src/game/chart';
import { mulberry32 } from '../../src/audio/synth/pluck';
import type { PlayedNote } from './guitarist';

export interface PerformOptions {
  /** Silence before the first beat, in seconds. */
  leadIn: number;
  /** Random timing error, in seconds (uniform ±jitter). */
  jitter?: number;
  /** Play every note a semitone sharp (a "wrong" player). */
  wrong?: boolean;
  seed?: number;
}

/** A virtual guitarist reading the chart: what a player who nails every note would sound like. */
export function performChart(chart: Chart, opts: PerformOptions): PlayedNote[] {
  const rng = mulberry32(opts.seed ?? 11);
  const jit = () => ((rng() * 2 - 1) * (opts.jitter ?? 0));
  const out: PlayedNote[] = [];
  const shift = opts.wrong ? 1 : 0;
  let prevMidi: number | undefined;
  // How long until the fretting hand moves on: fretted notes stop when it lifts,
  // unless the next shape keeps the same finger down.
  const releaseAfter = (i: number, string: number, fret: number, ring: number) => {
    if (fret === 0) return ring;
    const next = chart.notes[i + 1];
    if (!next) return ring;
    const held = next.notes.some((s) => s.string === string && s.fret === fret);
    if (held) return ring;
    return Math.min(ring, next.time - chart.notes[i].time + 0.015);
  };
  for (let i = 0; i < chart.notes.length; i++) {
    const n = chart.notes[i];
    const t = opts.leadIn + n.time + jit();
    const ring = n.pm ? Math.min(n.dur, 0.2) : n.dur + 0.35;
    if (n.kind === 'note') {
      const spec = n.notes[0];
      const midi = spec.midi + shift;
      out.push({
        t,
        midi,
        dur: releaseAfter(i, spec.string, spec.fret, ring),
        mute: n.pm,
        legato: n.legato === 'hammer' || n.legato === 'pull' || n.legato === 'slide',
        slideFrom: n.legato === 'slide' ? prevMidi : undefined,
        bend: n.bend,
        string: spec.string,
        velocity: 0.55 + rng() * 0.3,
      });
      prevMidi = midi;
    } else if (n.kind === 'chord') {
      const strings = [...n.notes].sort((a, b) => (n.strum === 'up' ? a.string - b.string : b.string - a.string));
      const spread = n.notes.length > 3 ? 0.008 + rng() * 0.006 : 0.004;
      // Up-strums usually only catch the thinner strings.
      const played = n.strum === 'up' && strings.length > 4 ? strings.slice(0, 4) : strings;
      played.forEach((s, idx) => {
        out.push({
          t: t + idx * spread,
          midi: s.midi + shift,
          dur: releaseAfter(i, s.string, s.fret, ring),
          mute: n.pm,
          string: s.string,
          velocity: (0.5 + rng() * 0.25) * (n.strum === 'up' ? 0.8 : 1) * (1 - idx * 0.03),
        });
      });
      prevMidi = undefined;
    }
  }
  return out;
}
