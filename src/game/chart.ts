import type { GrooveId, Lesson, Section, ToneId } from '../content/types';
import { parseTab, type Legato, type TabEvent } from '../music/tab';
import { fretMidi, type StringNumber, type TuningId } from '../music/notes';
import { CHORDS } from '../music/chords';

/**
 * A chart is a lesson turned into timed targets at a chosen tempo — everything the
 * highway draws and the judge scores.
 */
export interface ChartNoteSpec {
  string: StringNumber;
  fret: number;
  midi: number;
  /** Suggested fretting finger (1-4), 0 for open strings. */
  finger: number;
}

export interface ChartNote {
  id: number;
  /** Seconds from the start of the song at the chart's tempo. */
  time: number;
  dur: number;
  beat: number;
  durBeats: number;
  kind: 'note' | 'chord' | 'mute';
  notes: ChartNoteSpec[];
  midis: number[];
  name?: string;
  chordId?: string;
  pm?: boolean;
  legato?: Legato;
  /** id of the note a hammer-on / pull-off / slide comes from. */
  fromId?: number;
  bend?: number;
  strum?: 'down' | 'up';
  accent?: boolean;
  vibrato?: boolean;
  section: number;
}

export interface ChartSection {
  name?: string;
  startBeat: number;
  endBeat: number;
  groove: GrooveId;
  bass: Section['bass'];
  backing?: string;
  crash: boolean;
  fill: boolean;
}

export interface Chart {
  lessonId: string;
  bpm: number;
  tempo: number;
  secPerBeat: number;
  beatsPerBar: number;
  tuning: TuningId;
  tone: ToneId;
  notes: ChartNote[];
  rests: { beat: number; durBeats: number }[];
  sections: ChartSection[];
  totalBeats: number;
  duration: number;
}

export function defaultGroove(lesson: Lesson): GrooveId {
  if (lesson.kind === 'song') return 'rock';
  return 'click';
}

export function buildChart(lesson: Lesson, tempo = 1): Chart {
  const bpm = (lesson.bpm ?? 80) * tempo;
  const secPerBeat = 60 / bpm;
  const tuning = lesson.tuning ?? 'standard';
  const beatsPerBar = 4;
  const notes: ChartNote[] = [];
  const rests: Chart['rests'] = [];
  const sections: ChartSection[] = [];
  let beat = 0;
  let id = 0;
  let prevNote: ChartNote | undefined;

  (lesson.sections ?? []).forEach((section, si) => {
    const parsed = parseTab(section.tab, { tuning, beatsPerBar });
    const reps = section.repeat ?? 1;
    for (let r = 0; r < reps; r++) {
      const startBeat = beat;
      for (const e of parsed.events) {
        const b = startBeat + e.beat;
        if (e.kind === 'rest') {
          rests.push({ beat: b, durBeats: e.dur });
          continue;
        }
        const n = toChartNote(e, id++, b, secPerBeat, tuning, si);
        if (n.legato && prevNote) n.fromId = prevNote.id;
        notes.push(n);
        prevNote = n;
      }
      beat = startBeat + parsed.beats;
      sections.push({
        name: r === 0 ? section.name : undefined,
        startBeat,
        endBeat: beat,
        groove: section.groove ?? defaultGroove(lesson),
        bass: section.bass ?? (lesson.kind === 'song' || lesson.kind === 'riff' ? 'follow' : 'none'),
        backing: section.backing,
        crash: !!section.crash && r === 0,
        fill: !!section.fill && r === reps - 1,
      });
    }
  });

  assignFingers(notes);

  return {
    lessonId: lesson.id,
    bpm,
    tempo,
    secPerBeat,
    beatsPerBar,
    tuning,
    tone: lesson.tone ?? 'crunch',
    notes,
    rests,
    sections,
    totalBeats: beat,
    duration: beat * secPerBeat,
  };
}

function toChartNote(e: TabEvent, id: number, beat: number, spb: number, tuning: TuningId, section: number): ChartNote {
  const specs = e.notes
    .map((n) => ({ string: n.string, fret: n.fret, midi: fretMidi(tuning, n.string, n.fret), finger: 0 }))
    .sort((a, b) => b.string - a.string);
  return {
    id,
    time: beat * spb,
    dur: e.dur * spb,
    beat,
    durBeats: e.dur,
    kind: e.kind === 'mute' ? 'mute' : e.kind === 'chord' ? 'chord' : 'note',
    notes: specs,
    midis: specs.map((s) => s.midi).sort((a, b) => a - b),
    name: e.name,
    chordId: e.chordId,
    pm: e.pm,
    legato: e.legato,
    bend: e.bend,
    strum: e.strum,
    accent: e.accent,
    vibrato: e.vibrato,
    section,
  };
}

/**
 * Finger suggestions using "one finger per fret": within a passage, the hand sits in a
 * position (the lowest fret used nearby) and each fret gets its own finger.
 */
function assignFingers(notes: ChartNote[]) {
  const WINDOW = 6;
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    if (n.kind === 'chord') {
      const lib = n.chordId ? CHORDS[n.chordId] : undefined;
      if (lib) {
        for (const spec of n.notes) spec.finger = lib.fingers[6 - spec.string] ?? 0;
        continue;
      }
      // Power chords and other shapes: low string first.
      const sorted = [...n.notes].sort((a, b) => b.string - a.string);
      const allSame = sorted.every((x) => x.fret === sorted[0].fret);
      const fretted = sorted.filter((x) => x.fret > 0);
      const min = fretted.length ? Math.min(...fretted.map((x) => x.fret)) : 0;
      sorted.forEach((spec, idx) => {
        if (spec.fret === 0) spec.finger = 0;
        else if (allSame) spec.finger = 1;
        else if (sorted[0].fret === 0) spec.finger = Math.min(4, spec.fret - min + 1);
        else spec.finger = idx === 0 ? 1 : idx === 1 ? 3 : 4;
      });
      continue;
    }
    const s = n.notes[0];
    if (!s || s.fret === 0) continue;
    // Position = lowest fretted note in the neighbourhood that is within a 4-fret span.
    const near = notes
      .slice(Math.max(0, i - WINDOW), i + WINDOW + 1)
      .filter((x) => x.kind === 'note' && x.notes[0].fret > 0)
      .map((x) => x.notes[0].fret);
    const candidates = near.filter((f) => f <= s.fret && s.fret - f <= 3);
    const pos = candidates.length ? Math.min(...candidates) : s.fret;
    s.finger = Math.min(4, s.fret - pos + 1);
    if (n.bend) s.finger = Math.max(s.finger, 3);
  }
}

/** Number of full bars in a chart. */
export function barCount(chart: Chart) {
  return Math.ceil(chart.totalBeats / chart.beatsPerBar);
}
