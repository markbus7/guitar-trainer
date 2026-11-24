import { fretMidi, pitchClass, type StringNumber } from '../music/notes';

/**
 * The Training games: Note Finder (read a note name, find it on the neck) and
 * Echo (hear a note, find it by ear). Pure data and rules, so they can be tested.
 */
export type TrainerGame = 'notes' | 'ear';

export interface TrainerLevel {
  id: string;
  game: TrainerGame;
  title: string;
  blurb: string;
  strings: StringNumber[];
  frets: [number, number];
  /** Only natural notes (no sharps or flats). */
  naturals: boolean;
}

export interface TrainerQuestion {
  string: StringNumber;
  fret: number;
  midi: number;
}

export const ROUND_SECONDS = 60;

export const TRAINER_LEVELS: TrainerLevel[] = [
  // Note Finder: learn the neck, starting with the strings power chords are rooted on.
  { id: 'notes-e', game: 'notes', title: 'Low E string', blurb: 'The roots of every E-string power chord. Natural notes, frets 0–12.', strings: [6], frets: [0, 12], naturals: true },
  { id: 'notes-a', game: 'notes', title: 'A string', blurb: 'Roots for A-string power chords and barre chords. Natural notes, frets 0–12.', strings: [5], frets: [0, 12], naturals: true },
  { id: 'notes-ea', game: 'notes', title: 'Low E and A', blurb: 'Both root strings mixed. Know these and you can find any power chord.', strings: [6, 5], frets: [0, 12], naturals: true },
  { id: 'notes-first5', game: 'notes', title: 'First five frets', blurb: 'All six strings, frets 0–5, sharps and flats included.', strings: [6, 5, 4, 3, 2, 1], frets: [0, 5], naturals: false },
  { id: 'notes-neck', game: 'notes', title: 'The whole neck', blurb: 'Every string, frets 0–12, every note. The final boss.', strings: [6, 5, 4, 3, 2, 1], frets: [0, 12], naturals: false },
  // Echo: ear training. Hear it, then find it.
  { id: 'ear-open', game: 'ear', title: 'Open strings', blurb: 'Which open string was that? Six notes to tell apart.', strings: [6, 5, 4, 3, 2, 1], frets: [0, 0], naturals: false },
  { id: 'ear-e5', game: 'ear', title: 'Low E, frets 0–5', blurb: 'Find the note on the low E string. Start here.', strings: [6], frets: [0, 5], naturals: false },
  { id: 'ear-ea7', game: 'ear', title: 'E and A, frets 0–7', blurb: 'Riff territory: the notes most rock riffs are made of.', strings: [6, 5], frets: [0, 7], naturals: false },
  { id: 'ear-first5', game: 'ear', title: 'First five frets', blurb: 'Any string, frets 0–5. Play melodies by ear.', strings: [6, 5, 4, 3, 2, 1], frets: [0, 5], naturals: false },
];

export function trainerLevel(id: string): TrainerLevel | undefined {
  return TRAINER_LEVELS.find((l) => l.id === id);
}

/** Progress records for the games use these ids (they sync with everything else). */
export const trainerRecordId = (levelId: string) => `gym-${levelId}`;

const NATURAL = new Set([0, 2, 4, 5, 7, 9, 11]);

export function levelPositions(level: TrainerLevel): TrainerQuestion[] {
  const out: TrainerQuestion[] = [];
  for (const string of level.strings) {
    for (let fret = level.frets[0]; fret <= level.frets[1]; fret++) {
      const midi = fretMidi('standard', string, fret);
      if (level.naturals && !NATURAL.has(pitchClass(midi))) continue;
      out.push({ string, fret, midi });
    }
  }
  return out;
}

/**
 * A random question that is not the same note (by name) as the previous one.
 * For the Note Finder the 12th fret is the same note as the open string, so both
 * count as answers; only the open one is ever asked.
 */
export function nextQuestion(level: TrainerLevel, prev: TrainerQuestion | null, rand: () => number = Math.random): TrainerQuestion {
  let pool = levelPositions(level);
  if (level.game === 'notes') pool = pool.filter((q) => q.fret < 12);
  const fresh = prev ? pool.filter((q) => pitchClass(q.midi) !== pitchClass(prev.midi)) : pool;
  const from = fresh.length ? fresh : pool;
  return from[Math.floor(rand() * from.length) % from.length];
}

/** Stars-like grade for a round, used for messages: 0 warm-up, 1 good, 2 great, 3 legendary. */
export function roundGrade(score: number): 0 | 1 | 2 | 3 {
  if (score >= 25) return 3;
  if (score >= 15) return 2;
  if (score >= 8) return 1;
  return 0;
}
