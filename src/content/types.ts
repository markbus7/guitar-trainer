import type { StringNumber, TuningId } from '../music/notes';

export type ToneId = 'acoustic' | 'clean' | 'crunch' | 'punk' | 'lead' | 'metal';

export type GrooveId =
  | 'none'
  | 'click'
  | 'rock'
  | 'rockHalf'
  | 'drive'
  | 'punk'
  | 'skate'
  | 'ballad'
  | 'gallop'
  | 'metal'
  | 'thrash'
  | 'tom'
  | 'stop';

export interface Section {
  /** Shown on the highway, e.g. "Verse". */
  name?: string;
  tab: string;
  repeat?: number;
  groove?: GrooveId;
  /**
   * Bass line: "follow" doubles the guitar's lowest note (default for riffs),
   * "none", or a list of root notes, one per bar, e.g. "E E C D".
   */
  bass?: 'follow' | 'none' | string;
  /** Chords for a quiet backing rhythm guitar, one per bar, e.g. "Am G F G". */
  backing?: string;
  /** Crash cymbal on the first beat of the section. */
  crash?: boolean;
  /** Drum fill in the last bar of the section. */
  fill?: boolean;
}

export type ArtId =
  | 'guitar-parts'
  | 'pick-grip'
  | 'posture'
  | 'fret-hand'
  | 'tab-reading'
  | 'palm-mute'
  | 'string-names'
  | 'strum'
  | 'bend'
  | 'drop-d';

export interface FretMark {
  string: StringNumber;
  fret: number;
  label?: string;
  root?: boolean;
}

export type Figure =
  | { type: 'chord'; chord: string }
  | { type: 'chords'; chords: string[] }
  | { type: 'fretboard'; marks: FretMark[]; frets?: [number, number]; caption?: string }
  | { type: 'tab'; tab: string; tuning?: TuningId; caption?: string }
  | { type: 'art'; art: ArtId; caption?: string };

export interface Tip {
  title: string;
  body: string;
  figure?: Figure;
}

export interface Check {
  prompt: string;
  /** Any of these notes (octave errors forgiven). */
  midi?: number[];
  /** A chord from the library. */
  chord?: string;
  /** Any pluck counts. */
  anyNote?: boolean;
  /** Ask for this many correct plays in a row. */
  times?: number;
}

export interface TheoryStep {
  title: string;
  /** Paragraphs separated by blank lines. **bold** is supported. */
  body: string;
  figure?: Figure;
  check?: Check;
  /** Show the tuner for this tuning. */
  tuner?: TuningId;
}

export type LessonKind = 'learn' | 'exercise' | 'riff' | 'song' | 'drill';

export interface Lesson {
  id: string;
  title: string;
  kind: LessonKind;
  summary: string;
  skills?: string[];
  /** Walk-through pages for "learn" lessons. */
  steps?: TheoryStep[];
  /** Short tips shown before an exercise. */
  tips?: Tip[];
  bpm?: number;
  tuning?: TuningId;
  tone?: ToneId;
  sections?: Section[];
  /** Mode suggested to a first-timer. */
  mode?: 'practice' | 'play';
  /** Genre / feel label for songs, e.g. "Pop-punk". */
  style?: string;
  /** Chord-change drill: alternate between two chords against the clock. */
  drill?: { chords: [string, string]; seconds: number };
}

export type VenueArt =
  | 'garage'
  | 'basement'
  | 'divebar'
  | 'skatepark'
  | 'campfire'
  | 'furnace'
  | 'theater'
  | 'arena'
  | 'mainstage';

export interface Chapter {
  id: string;
  venue: string;
  title: string;
  blurb: string;
  accent: string;
  art: VenueArt;
  lessons: Lesson[];
}
