import type { DrumId } from '../audio/synth/drums';
import type { GrooveId } from '../content/types';
import { getChord, shapeNotes, CHORDS } from '../music/chords';
import { fretMidi } from '../music/notes';
import type { Chart, ChartNote, ChartSection } from './chart';

/**
 * Turns a chart into a band arrangement: drums (one groove per section, fills and
 * crashes), a bass line, an optional quiet rhythm guitar, the metronome and the
 * count-in. Pure data, so it can be unit tested; the session schedules it.
 */
export type ArrEvent =
  | { t: number; type: 'guide'; note: ChartNote }
  | { t: number; type: 'drum'; drum: DrumId; vel: number }
  | { t: number; type: 'click'; accent: boolean; countIn?: boolean }
  | { t: number; type: 'bass'; midi: number; dur: number; vel: number; mute?: boolean }
  | { t: number; type: 'backing'; notes: { midi: number; string: number }[]; dur: number; strum: 'down' | 'up'; vel: number };

export interface ArrangementOptions {
  /** Click on every beat during the song (always on during the count-in). */
  metronome: boolean;
  /** Include the guide guitar part. */
  guide: boolean;
  /** Include bass and backing guitar. */
  band: boolean;
  /** Include drums. */
  drums: boolean;
  countInBars?: number;
}

export interface Arrangement {
  events: ArrEvent[];
  /** Seconds of count-in before song time 0. */
  countIn: number;
  countInBeats: number;
}

type Lane = Partial<Record<DrumId, string>>;

/** 16 steps per bar; x = hit, o = soft hit. */
const GROOVES: Record<GrooveId, Lane> = {
  none: {},
  click: {},
  rock: { kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.o.x.o.x.o.x.o.' },
  rockHalf: { kick: 'x.........x.....', snare: '........x.......', hat: 'x.o.x.o.x.o.x.o.' },
  drive: { kick: 'x.....x.x.....x.', snare: '....x.......x...', hat: 'x.o.x.o.x.o.x...', hatOpen: '..............o.' },
  punk: { kick: 'x.....x.x.x.....', snare: '....x.......x...', ride: 'x.x.x.x.x.x.x.x.' },
  skate: { kick: 'x...x...x...x...', snare: '..x...x...x...x.', ride: 'x...x...x...x...' },
  ballad: { kick: 'x.......x..o....', snare: '....o.......o...', hat: 'o.o.o.o.o.o.o.o.' },
  gallop: { kick: 'x.xxx.xxx.xxx.xx', snare: '....x.......x...', ride: 'x...x...x...x...' },
  metal: { kick: 'x.x.x.x.x.x.x.x.', snare: '....x.......x...', ride: 'x...x...x...x...' },
  thrash: { kick: 'x...x...x...x...', snare: '..x...x...x...x.', hat: 'x.x.x.x.x.x.x.x.' },
  tom: { kick: 'x.......x.......', tomLo: 'x..x..x.x..x..x.', tomHi: '....x.......x...' },
  stop: { kick: 'x...............', crash: 'x...............' },
};

const FILL: Lane = { kick: '........x.......', snare: '........xoxo....', tomHi: '............xo..', tomLo: '..............xx' };

/** Bass rhythm per groove (16 steps). */
const BASS_RHYTHM: Record<GrooveId, string> = {
  none: 'x...x...x...x...',
  click: 'x...x...x...x...',
  rock: 'x.x.x.x.x.x.x.x.',
  rockHalf: 'x.......x.....x.',
  drive: 'x.x.x.x.x.x.x.x.',
  punk: 'x.x.x.x.x.x.x.x.',
  skate: 'x.x.x.x.x.x.x.x.',
  ballad: 'x.......x.......',
  gallop: 'x.xxx.xxx.xxx.xx',
  metal: 'x.x.x.x.x.x.x.x.',
  thrash: 'x.x.x.x.x.x.x.x.',
  tom: 'x...x...x...x...',
  stop: 'x...............',
};

/** Backing strum per groove: d = down, u = up. */
const STRUM_RHYTHM: Record<GrooveId, string> = {
  none: 'd...............',
  click: 'd.......d.......',
  rock: 'd.....d.d.u.d.u.',
  rockHalf: 'd.......d.......',
  drive: 'd.d.d.d.d.d.d.d.',
  punk: 'd.d.d.d.d.d.d.d.',
  skate: 'd.d.d.d.d.d.d.d.',
  ballad: 'd.....d.d.u.d.u.',
  gallop: 'd...d...d...d...',
  metal: 'd.......d.......',
  thrash: 'd.d.d.d.d.d.d.d.',
  tom: 'd...............',
  stop: 'd...............',
};

const NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "E", "F#", "Bb" → MIDI note in the bass register (E1..D#2). */
export function bassRoot(name: string): number | null {
  const m = /^([A-G])([#b]?)/.exec(name.trim());
  if (!m) return null;
  let pc = NOTE_INDEX[m[1]];
  if (m[2] === '#') pc += 1;
  if (m[2] === 'b') pc -= 1;
  pc = (pc + 12) % 12;
  // E1 = 28. Place the root in 28..39.
  return 28 + ((pc - 4 + 12) % 12);
}

/** A playable voicing for a chord name used in backing lines. */
export function backingVoicing(name: string): { midi: number; string: number }[] {
  const id = CHORDS[name] ? name : name === 'F' ? 'F-easy' : name;
  try {
    const shape = getChord(id);
    return shapeNotes(shape.frets)
      .map((n) => ({ midi: fretMidi('standard', n.string, n.fret), string: n.string as number }))
      .sort((a, b) => b.string - a.string);
  } catch {
    const root = bassRoot(name);
    if (root === null) return [];
    const minor = /m(?!aj)/.test(name.slice(1));
    const r = root + 12;
    return [
      { midi: r, string: 5 },
      { midi: r + 7, string: 4 },
      { midi: r + 12, string: 3 },
      { midi: r + 12 + (minor ? 3 : 4), string: 2 },
    ];
  }
}

function steps(pattern: string | undefined): { step: number; vel: number }[] {
  if (!pattern) return [];
  const out: { step: number; vel: number }[] = [];
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === 'x') out.push({ step: i, vel: 1 });
    else if (c === 'o') out.push({ step: i, vel: 0.6 });
  }
  return out;
}

/** Notes of the chart that start within [b0, b1) beats. */
function notesIn(chart: Chart, b0: number, b1: number) {
  return chart.notes.filter((n) => n.beat >= b0 - 1e-6 && n.beat < b1 - 1e-6);
}

function bassFollow(chart: Chart, section: ChartSection, events: ArrEvent[]) {
  for (const n of notesIn(chart, section.startBeat, section.endBeat)) {
    if (n.kind === 'mute' || !n.midis.length) continue;
    let midi = n.midis[0];
    while (midi > 45) midi -= 12;
    while (midi < 28) midi += 12;
    const dur = Math.max(0.08, Math.min(n.dur, chart.secPerBeat * 2)) * (n.pm ? 0.5 : 0.95);
    events.push({ t: n.time, type: 'bass', midi, dur, vel: n.accent ? 0.95 : 0.8, mute: n.pm });
  }
}

export function buildArrangement(chart: Chart, opts: ArrangementOptions): Arrangement {
  const spb = chart.secPerBeat;
  const step = spb / 4;
  const bpb = chart.beatsPerBar;
  const events: ArrEvent[] = [];

  const bars = opts.countInBars ?? (chart.bpm >= 140 ? 2 : 1);
  const countInBeats = bars * bpb;
  const countIn = countInBeats * spb;
  for (let b = 0; b < countInBeats; b++) {
    events.push({ t: -countIn + b * spb, type: 'click', accent: b % bpb === 0, countIn: true });
  }

  if (opts.guide) for (const n of chart.notes) events.push({ t: n.time, type: 'guide', note: n });

  chart.sections.forEach((sec, si) => {
    const barsInSection = Math.max(1, Math.round((sec.endBeat - sec.startBeat) / bpb));
    const roots = sec.bass && sec.bass !== 'follow' && sec.bass !== 'none' ? sec.bass.split(/\s+/).filter(Boolean) : null;
    const chords = sec.backing ? sec.backing.split(/\s+/).filter(Boolean) : null;

    for (let bar = 0; bar < barsInSection; bar++) {
      const barBeat = sec.startBeat + bar * bpb;
      const barTime = barBeat * spb;
      if (barBeat >= sec.endBeat - 1e-6) break;
      const lastBar = bar === barsInSection - 1;

      // Metronome
      if (opts.metronome || sec.groove === 'click') {
        for (let b = 0; b < bpb; b++) events.push({ t: barTime + b * spb, type: 'click', accent: b === 0 });
      }

      // Drums
      if (opts.drums && sec.groove !== 'none' && sec.groove !== 'click') {
        const groove = GROOVES[sec.groove] ?? GROOVES.rock;
        const useFill = sec.fill && lastBar && sec.groove !== 'stop';
        for (const [drum, pattern] of Object.entries(groove) as [DrumId, string][]) {
          for (const s of steps(pattern)) {
            if (useFill && s.step >= 8) continue;
            events.push({ t: barTime + s.step * step, type: 'drum', drum, vel: s.vel });
          }
        }
        if (useFill) {
          for (const [drum, pattern] of Object.entries(FILL) as [DrumId, string][]) {
            for (const s of steps(pattern)) events.push({ t: barTime + s.step * step, type: 'drum', drum, vel: s.vel * (0.7 + (s.step / 16) * 0.4) });
          }
        }
        if (bar === 0 && (sec.crash || (si > 0 && chart.sections[si - 1].fill)) && sec.groove !== 'stop') {
          events.push({ t: barTime, type: 'drum', drum: 'crash', vel: 1 });
        }
      }

      // Bass from a list of roots, one per bar.
      if (opts.band && roots) {
        const root = bassRoot(roots[bar % roots.length]);
        if (root !== null) {
          const pattern = steps(BASS_RHYTHM[sec.groove] ?? BASS_RHYTHM.rock);
          pattern.forEach((s, i) => {
            const nextStep = pattern[i + 1]?.step ?? 16;
            events.push({ t: barTime + s.step * step, type: 'bass', midi: root, dur: (nextStep - s.step) * step * 0.92, vel: s.step % 4 === 0 ? 0.9 : 0.75 });
          });
        }
      }

      // Quiet backing guitar.
      if (opts.band && chords) {
        const voicing = backingVoicing(chords[bar % chords.length]);
        if (voicing.length) {
          const pattern = STRUM_RHYTHM[sec.groove] ?? STRUM_RHYTHM.rock;
          const hits: { step: number; dir: 'down' | 'up' }[] = [];
          for (let i = 0; i < 16; i++) {
            if (pattern[i] === 'd') hits.push({ step: i, dir: 'down' });
            if (pattern[i] === 'u') hits.push({ step: i, dir: 'up' });
          }
          hits.forEach((h, i) => {
            const nextStep = hits[i + 1]?.step ?? 16;
            events.push({
              t: barTime + h.step * step,
              type: 'backing',
              notes: voicing,
              dur: (nextStep - h.step) * step,
              strum: h.dir,
              vel: h.step === 0 ? 0.7 : 0.55,
            });
          });
        }
      }
    }

    if (opts.band && sec.bass === 'follow') bassFollow(chart, sec, events);
  });

  events.sort((a, b) => a.t - b.t);
  return { events, countIn, countInBeats };
}
