import { fretMidi, noteName, type StringNumber, type TuningId } from './notes';

/**
 * Chord shapes. `frets` and `fingers` are written the way chord charts are read:
 * index 0 is the low E (6th) string, index 5 is the high e (1st) string.
 * `null` means the string is not played (muted / skipped).
 */
export interface ChordShape {
  id: string;
  name: string;
  frets: (number | null)[];
  fingers: (number | null)[];
  barre?: { fret: number; from: StringNumber; to: StringNumber; finger: number };
  category: 'open' | 'power' | 'color' | 'barre';
  level: 1 | 2 | 3;
  tip?: string;
}

export interface FrettedNote {
  string: StringNumber;
  fret: number;
}

const O = null;

const SHAPES: ChordShape[] = [
  // ── Open chords ──────────────────────────────────────────────
  { id: 'Em', name: 'Em', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], category: 'open', level: 1,
    tip: 'Two fingers, all six strings. The easiest full chord on the guitar.' },
  { id: 'E', name: 'E', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], category: 'open', level: 1,
    tip: 'Em plus your index finger on the G string, 1st fret.' },
  { id: 'Am', name: 'Am', frets: [O, 0, 2, 2, 1, 0], fingers: [O, 0, 2, 3, 1, 0], category: 'open', level: 1,
    tip: 'Same shape as E, moved one string over. Skip the low E string.' },
  { id: 'A', name: 'A', frets: [O, 0, 2, 2, 2, 0], fingers: [O, 0, 1, 2, 3, 0], category: 'open', level: 1,
    tip: 'Three fingers squeezed side by side on the 2nd fret. Keep the high e ringing.' },
  { id: 'D', name: 'D', frets: [O, O, 0, 2, 3, 2], fingers: [O, O, 0, 1, 3, 2], category: 'open', level: 1,
    tip: 'A little triangle on the top three strings. Strum from the D string down.' },
  { id: 'Dm', name: 'Dm', frets: [O, O, 0, 2, 3, 1], fingers: [O, O, 0, 2, 3, 1], category: 'open', level: 2,
    tip: 'Like D, but the high e drops to the 1st fret for a sadder sound.' },
  { id: 'G', name: 'G', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], category: 'open', level: 2,
    tip: 'Big and bright. Middle finger on the low E, index on the A, ring on the high e.' },
  { id: 'C', name: 'C', frets: [O, 3, 2, 0, 1, 0], fingers: [O, 3, 2, 0, 1, 0], category: 'open', level: 2,
    tip: 'A diagonal staircase. Arch your fingers so the open G and high e ring.' },
  { id: 'F-easy', name: 'F', frets: [O, O, 3, 2, 1, 1], fingers: [O, O, 3, 2, 1, 1], category: 'open', level: 3,
    barre: { fret: 1, from: 2, to: 1, finger: 1 },
    tip: 'A mini-F: your index finger flattens across the top two strings.' },

  // ── Power chords ─────────────────────────────────────────────
  { id: 'E5', name: 'E5', frets: [0, 2, O, O, O, O], fingers: [0, 1, O, O, O, O], category: 'power', level: 1,
    tip: 'Open low E plus one finger. The sound of a thousand rock songs.' },
  { id: 'A5', name: 'A5', frets: [O, 0, 2, O, O, O], fingers: [O, 0, 1, O, O, O], category: 'power', level: 1,
    tip: 'Open A string plus one finger on the D string, 2nd fret.' },
  { id: 'D5', name: 'D5', frets: [O, O, 0, 2, O, O], fingers: [O, O, 0, 1, O, O], category: 'power', level: 1,
    tip: 'Open D string plus one finger on the G string, 2nd fret.' },
  { id: 'G5', name: 'G5', frets: [3, 5, O, O, O, O], fingers: [1, 3, O, O, O, O], category: 'power', level: 1,
    tip: 'Index on the 3rd fret of the low E, ring finger two frets up on the A string.' },
  { id: 'A5m', name: 'A5', frets: [5, 7, O, O, O, O], fingers: [1, 3, O, O, O, O], category: 'power', level: 1,
    tip: 'The movable power chord shape slid up to the 5th fret.' },
  { id: 'C5', name: 'C5', frets: [O, 3, 5, O, O, O], fingers: [O, 1, 3, O, O, O], category: 'power', level: 1,
    tip: 'Same two-finger shape, rooted on the A string.' },
  { id: 'D5m', name: 'D5', frets: [O, 5, 7, O, O, O], fingers: [O, 1, 3, O, O, O], category: 'power', level: 1,
    tip: 'Root on the A string, 5th fret.' },
  { id: 'G5-3', name: 'G5 (3-note)', frets: [3, 5, 5, O, O, O], fingers: [1, 3, 4, O, O, O], category: 'power', level: 2,
    tip: 'Add your pinky on the D string for a fatter power chord with the octave.' },
  { id: 'D5-drop', name: 'D5 (Drop D)', frets: [0, 0, 0, O, O, O], fingers: [0, 0, 0, O, O, O], category: 'power', level: 2,
    tip: 'In Drop D, the three lowest open strings make a power chord on their own.' },

  // ── Colour chords (7ths and sus) ─────────────────────────────
  { id: 'Em7', name: 'Em7', frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], category: 'color', level: 1,
    tip: 'One finger. Moody and open.' },
  { id: 'Am7', name: 'Am7', frets: [O, 0, 2, 0, 1, 0], fingers: [O, 0, 2, 0, 1, 0], category: 'color', level: 1 },
  { id: 'E7', name: 'E7', frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], category: 'color', level: 1,
    tip: 'Bluesy. Like E with the ring finger lifted.' },
  { id: 'A7', name: 'A7', frets: [O, 0, 2, 0, 2, 0], fingers: [O, 0, 2, 0, 3, 0], category: 'color', level: 1 },
  { id: 'D7', name: 'D7', frets: [O, O, 0, 2, 1, 2], fingers: [O, O, 0, 2, 1, 3], category: 'color', level: 2 },
  { id: 'G7', name: 'G7', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], category: 'color', level: 2 },
  { id: 'B7', name: 'B7', frets: [O, 2, 1, 2, 0, 2], fingers: [O, 2, 1, 3, 0, 4], category: 'color', level: 3 },
  { id: 'Asus2', name: 'Asus2', frets: [O, 0, 2, 2, 0, 0], fingers: [O, 0, 1, 2, 0, 0], category: 'color', level: 1 },
  { id: 'Asus4', name: 'Asus4', frets: [O, 0, 2, 2, 3, 0], fingers: [O, 0, 1, 2, 3, 0], category: 'color', level: 2 },
  { id: 'Dsus2', name: 'Dsus2', frets: [O, O, 0, 2, 3, 0], fingers: [O, O, 0, 1, 3, 0], category: 'color', level: 1 },
  { id: 'Dsus4', name: 'Dsus4', frets: [O, O, 0, 2, 3, 3], fingers: [O, O, 0, 1, 3, 4], category: 'color', level: 2 },
  { id: 'Cadd9', name: 'Cadd9', frets: [O, 3, 2, 0, 3, 3], fingers: [O, 2, 1, 0, 3, 4], category: 'color', level: 2,
    tip: 'Pairs perfectly with the rock G — your ring and pinky never move.' },
  { id: 'G-rock', name: 'G', frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4], category: 'color', level: 2,
    tip: 'The "rock G". Fuller on top and an easy switch to Cadd9, D and Em7.' },
  { id: 'Fmaj7', name: 'Fmaj7', frets: [O, O, 3, 2, 1, 0], fingers: [O, O, 3, 2, 1, 0], category: 'color', level: 2 },

  // ── Barre chords ─────────────────────────────────────────────
  { id: 'F', name: 'F', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], category: 'barre', level: 3,
    barre: { fret: 1, from: 6, to: 1, finger: 1 },
    tip: 'The famous one. Roll your index slightly onto its bony side and keep your thumb low.' },
  { id: 'Fm', name: 'Fm', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], category: 'barre', level: 3,
    barre: { fret: 1, from: 6, to: 1, finger: 1 } },
  { id: 'F#m', name: 'F♯m', frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], category: 'barre', level: 3,
    barre: { fret: 2, from: 6, to: 1, finger: 1 } },
  { id: 'Gm', name: 'Gm', frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], category: 'barre', level: 3,
    barre: { fret: 3, from: 6, to: 1, finger: 1 } },
  { id: 'Bb', name: 'B♭', frets: [O, 1, 3, 3, 3, 1], fingers: [O, 1, 2, 3, 4, 1], category: 'barre', level: 3,
    barre: { fret: 1, from: 5, to: 1, finger: 1 } },
  { id: 'B', name: 'B', frets: [O, 2, 4, 4, 4, 2], fingers: [O, 1, 2, 3, 4, 1], category: 'barre', level: 3,
    barre: { fret: 2, from: 5, to: 1, finger: 1 } },
  { id: 'Bm', name: 'Bm', frets: [O, 2, 4, 4, 3, 2], fingers: [O, 1, 3, 4, 2, 1], category: 'barre', level: 3,
    barre: { fret: 2, from: 5, to: 1, finger: 1 } },
  { id: 'Cm', name: 'Cm', frets: [O, 3, 5, 5, 4, 3], fingers: [O, 1, 3, 4, 2, 1], category: 'barre', level: 3,
    barre: { fret: 3, from: 5, to: 1, finger: 1 } },
  { id: 'C#m', name: 'C♯m', frets: [O, 4, 6, 6, 5, 4], fingers: [O, 1, 3, 4, 2, 1], category: 'barre', level: 3,
    barre: { fret: 4, from: 5, to: 1, finger: 1 } },
];

export const CHORDS: Record<string, ChordShape> = Object.fromEntries(SHAPES.map((s) => [s.id, s]));
export const CHORD_LIST: readonly ChordShape[] = SHAPES;

export function getChord(id: string): ChordShape {
  const c = CHORDS[id];
  if (!c) throw new Error(`Unknown chord "${id}"`);
  return c;
}

/** Convert a chord-chart frets array (low E first) to fretted notes using tab string numbers. */
export function shapeNotes(frets: readonly (number | null)[]): FrettedNote[] {
  const out: FrettedNote[] = [];
  frets.forEach((f, i) => {
    if (f !== null && f !== undefined) out.push({ string: (6 - i) as StringNumber, fret: f });
  });
  return out;
}

export function chordMidis(notes: FrettedNote[], tuning: TuningId = 'standard'): number[] {
  return notes.map((n) => fretMidi(tuning, n.string, n.fret)).sort((a, b) => a - b);
}

/** Parse a compact frets string like "x02210" or "x,10,12,12,x,x". */
export function parseFretString(src: string): (number | null)[] {
  const parts = src.includes(',') ? src.split(',') : src.split('');
  if (parts.length !== 6) throw new Error(`Chord frets "${src}" must list 6 strings`);
  return parts.map((p) => {
    const t = p.trim().toLowerCase();
    if (t === 'x' || t === '-') return null;
    const n = Number(t);
    if (!Number.isInteger(n) || n < 0 || n > 24) throw new Error(`Bad fret "${p}" in chord "${src}"`);
    return n;
  });
}

/** Build a frets array (low E first) from fretted notes. */
export function notesToFrets(notes: FrettedNote[]): (number | null)[] {
  const frets: (number | null)[] = [null, null, null, null, null, null];
  for (const n of notes) frets[6 - n.string] = n.fret;
  return frets;
}

/** Name a power chord from its root MIDI note. */
export function powerChordName(rootMidi: number, flats = false): string {
  return `${noteName(rootMidi, { octave: false, flats })}5`;
}

/** Find a library chord by its exact frets, if one exists. */
export function findChordByFrets(frets: (number | null)[]): ChordShape | undefined {
  return SHAPES.find((s) => s.frets.every((f, i) => f === frets[i]));
}

/** The lowest fret used (ignoring open strings), for drawing chord boxes higher up the neck. */
export function baseFret(frets: readonly (number | null)[]): number {
  const fretted = frets.filter((f): f is number => f !== null && f > 0);
  if (fretted.length === 0) return 1;
  const max = Math.max(...fretted);
  if (max <= 4) return 1;
  return Math.min(...fretted);
}
