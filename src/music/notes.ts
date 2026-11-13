/**
 * Core pitch helpers: MIDI numbers, frequencies, note names and guitar tunings.
 *
 * String numbering follows guitar tab convention: string 1 is the thin high e,
 * string 6 is the thick low E.
 */

export type StringNumber = 1 | 2 | 3 | 4 | 5 | 6;
export const STRINGS: StringNumber[] = [1, 2, 3, 4, 5, 6];

export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export const A4 = 440;

export function midiToFreq(midi: number, a4 = A4): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

export function freqToMidi(freq: number, a4 = A4): number {
  return 69 + 12 * Math.log2(freq / a4);
}

export function pitchClass(midi: number): number {
  return ((Math.round(midi) % 12) + 12) % 12;
}

export function noteName(midi: number, opts: { flats?: boolean; octave?: boolean } = {}): string {
  const m = Math.round(midi);
  const names = opts.flats ? FLAT_NAMES : SHARP_NAMES;
  const name = names[pitchClass(m)];
  if (opts.octave === false) return name;
  const octave = Math.floor(m / 12) - 1;
  return `${name}${octave}`;
}

/** Pretty note name using real sharp/flat glyphs. */
export function prettyNote(midi: number, opts: { flats?: boolean; octave?: boolean } = {}): string {
  return noteName(midi, opts).replace('#', '♯').replace(/([A-G])b/, '$1♭');
}

/** Cents between a frequency and a reference MIDI note. */
export function centsOff(freq: number, midi: number, a4 = A4): number {
  return 1200 * Math.log2(freq / midiToFreq(midi, a4));
}

export type TuningId = 'standard' | 'dropD' | 'eflat' | 'dstandard' | 'dropC';

export interface Tuning {
  id: TuningId;
  name: string;
  /** Open-string MIDI notes indexed by string number (index 0 unused). */
  open: readonly [0, number, number, number, number, number, number];
  description: string;
}

export const TUNINGS: Record<TuningId, Tuning> = {
  standard: {
    id: 'standard',
    name: 'Standard',
    open: [0, 64, 59, 55, 50, 45, 40],
    description: 'E A D G B E — the tuning almost every lesson uses.',
  },
  dropD: {
    id: 'dropD',
    name: 'Drop D',
    open: [0, 64, 59, 55, 50, 45, 38],
    description: 'Low E string down to D. One-finger power chords and heavy riffs.',
  },
  eflat: {
    id: 'eflat',
    name: 'E♭ Standard',
    open: [0, 63, 58, 54, 49, 44, 39],
    description: 'Everything down a half step. Loved by punk and grunge bands.',
  },
  dstandard: {
    id: 'dstandard',
    name: 'D Standard',
    open: [0, 62, 57, 53, 48, 43, 38],
    description: 'Everything down a whole step for a darker, heavier sound.',
  },
  dropC: {
    id: 'dropC',
    name: 'Drop C',
    open: [0, 62, 57, 53, 48, 43, 36],
    description: 'D Standard with the low string dropped to C. Modern metal territory.',
  },
};

export function openMidi(tuning: Tuning | TuningId, string: StringNumber): number {
  const t = typeof tuning === 'string' ? TUNINGS[tuning] : tuning;
  return t.open[string];
}

export function fretMidi(tuning: Tuning | TuningId, string: StringNumber, fret: number): number {
  return openMidi(tuning, string) + fret;
}

/** Short label for a string in a tuning, e.g. "e", "B", "G", "D", "A", "E". */
export function stringLabel(tuning: Tuning | TuningId, string: StringNumber): string {
  const t = typeof tuning === 'string' ? TUNINGS[tuning] : tuning;
  const flats = t.id === 'eflat';
  const name = noteName(t.open[string], { octave: false, flats });
  return string === 1 ? name.toLowerCase() : name;
}

export const STRING_ORDINAL: Record<StringNumber, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
};

/** Human readable description like "5th string (A), 3rd fret". */
export function describePosition(tuning: Tuning | TuningId, string: StringNumber, fret: number): string {
  const label = stringLabel(tuning, string);
  const fretText = fret === 0 ? 'open' : `${ordinal(fret)} fret`;
  return `${STRING_ORDINAL[string]} string (${label}), ${fretText}`;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** All positions (string, fret) where a MIDI note can be played up to maxFret. */
export function positionsFor(
  tuning: Tuning | TuningId,
  midi: number,
  maxFret = 15,
): { string: StringNumber; fret: number }[] {
  const out: { string: StringNumber; fret: number }[] = [];
  for (const s of STRINGS) {
    const fret = Math.round(midi) - openMidi(tuning, s);
    if (fret >= 0 && fret <= maxFret) out.push({ string: s, fret });
  }
  return out;
}
