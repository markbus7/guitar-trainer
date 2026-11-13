import {
  CHORDS,
  findChordByFrets,
  parseFretString,
  powerChordName,
  shapeNotes,
  type FrettedNote,
} from './chords';
import { fretMidi, noteName, type StringNumber, type TuningId } from './notes';

/**
 * A tiny text notation for writing riffs, inspired by guitar tab.
 *
 *   q e s h w        set the current note length (quarter, eighth, sixteenth, half, whole)
 *   q. e3            dotted lengths and triplets
 *   6:0              string 6 (low E), fret 0
 *   5:3pm            palm muted        3:7b2   bend up a whole step (b1 = half step)
 *   h3:7 p3:5 /3:9   hammer-on, pull-off, slide into the note from the previous one
 *   [Em] [G-rock]d   chord from the library (d / u = strum direction)
 *   [x02210=Am]      chord from raw frets (low E first), optional name
 *   P6:3  PP6:3      power chord (2-note / 3-note with octave) rooted on string 6, fret 3
 *   PD6:5            one-finger drop-tuning power chord (strings 6, 5, 4 at fret 5)
 *   O5:3             octave shape: root on string 5 fret 3 + string 3 fret 5 (pop-punk leads)
 *   X                muted strum ("chk")
 *   r                rest        -   tie (extend the previous event)
 *   |                bar line (checked: every bar must be full)
 *   ( ... )x4        repeat a group
 *   // comment
 */

export type Legato = 'hammer' | 'pull' | 'slide';

export interface TabEvent {
  beat: number;
  dur: number;
  kind: 'note' | 'chord' | 'rest' | 'mute';
  notes: FrettedNote[];
  name?: string;
  chordId?: string;
  pm?: boolean;
  legato?: Legato;
  bend?: number;
  strum?: 'down' | 'up';
  accent?: boolean;
  vibrato?: boolean;
}

export interface ParseOptions {
  tuning?: TuningId;
  beatsPerBar?: number;
  /** Throw if a bar line appears where the bar is not complete. Default true. */
  strictBars?: boolean;
}

export interface ParseResult {
  events: TabEvent[];
  beats: number;
}

export class TabSyntaxError extends Error {}

const DURATIONS: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
const EPS = 1e-6;

function stripComments(src: string): string {
  return src
    .split('\n')
    .map((line) => {
      const i = line.indexOf('//');
      return i >= 0 ? line.slice(0, i) : line;
    })
    .join('\n');
}

function expandRepeats(tokens: string[]): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok === '(') {
      let depth = 1;
      let j = i + 1;
      for (; j < tokens.length; j++) {
        if (tokens[j] === '(') depth++;
        else if (tokens[j].startsWith(')')) {
          depth--;
          if (depth === 0) break;
        }
      }
      if (j >= tokens.length) throw new TabSyntaxError('Unclosed "(" in tab');
      const close = tokens[j];
      const m = /^\)(?:x(\d+))?$/.exec(close);
      if (!m) throw new TabSyntaxError(`Bad repeat token "${close}" (use ")x2")`);
      const times = m[1] ? Number(m[1]) : 1;
      const inner = expandRepeats(tokens.slice(i + 1, j));
      for (let k = 0; k < times; k++) out.push(...inner);
      i = j + 1;
    } else if (tok.startsWith(')')) {
      throw new TabSyntaxError('Unexpected ")" in tab');
    } else {
      out.push(tok);
      i++;
    }
  }
  return out;
}

interface Mods {
  pm?: boolean;
  bend?: number;
  vibrato?: boolean;
  accent?: boolean;
  strum?: 'down' | 'up';
}

function parseMods(src: string, token: string, allowed: string): Mods {
  const mods: Mods = {};
  let s = src;
  while (s.length > 0) {
    if (s.startsWith('pm') && allowed.includes('pm')) {
      mods.pm = true;
      s = s.slice(2);
    } else if (/^b[12]/.test(s) && allowed.includes('b')) {
      mods.bend = Number(s[1]);
      s = s.slice(2);
    } else if (s[0] === '~' && allowed.includes('~')) {
      mods.vibrato = true;
      s = s.slice(1);
    } else if (s[0] === '!') {
      mods.accent = true;
      s = s.slice(1);
    } else if ((s[0] === 'd' || s[0] === 'u') && allowed.includes('d')) {
      mods.strum = s[0] === 'd' ? 'down' : 'up';
      s = s.slice(1);
    } else {
      throw new TabSyntaxError(`Unknown modifier "${s}" in "${token}"`);
    }
  }
  return mods;
}

function checkFret(fret: number, token: string) {
  if (!Number.isInteger(fret) || fret < 0 || fret > 24) {
    throw new TabSyntaxError(`Fret out of range in "${token}"`);
  }
}

function powerChordNotes(kind: string, string: StringNumber, fret: number, token: string): FrettedNote[] {
  const s = string;
  if (kind === 'O') {
    if (s < 4) throw new TabSyntaxError(`Octave shape root must be on strings 4-6 in "${token}"`);
    // Skip a string: 6 -> 4 and 5 -> 3 are two frets up, 4 -> 2 crosses the G-B gap (three frets).
    return [
      { string: s, fret },
      { string: (s - 2) as StringNumber, fret: fret + (s === 4 ? 3 : 2) },
    ];
  }
  if (kind === 'PD') {
    if (s < 3) throw new TabSyntaxError(`Drop power chord needs three strings below "${token}"`);
    return [
      { string: s, fret },
      { string: (s - 1) as StringNumber, fret },
      { string: (s - 2) as StringNumber, fret },
    ];
  }
  if (s < 3) throw new TabSyntaxError(`Power chord root must be on strings 3-6 in "${token}"`);
  // Interval between string s and the next thinner string: a 4th, except G -> B (a major 3rd).
  const fifthOffset = s === 3 ? 3 : 2;
  const notes: FrettedNote[] = [
    { string: s, fret },
    { string: (s - 1) as StringNumber, fret: fret + fifthOffset },
  ];
  if (kind === 'PP') {
    if (s < 4) throw new TabSyntaxError(`3-note power chord root must be on strings 4-6 in "${token}"`);
    const octaveOffset = s === 4 ? 3 : 2;
    notes.push({ string: (s - 2) as StringNumber, fret: fret + octaveOffset });
  }
  return notes;
}

export function parseTab(src: string, opts: ParseOptions = {}): ParseResult {
  const tuning = opts.tuning ?? 'standard';
  const beatsPerBar = opts.beatsPerBar ?? 4;
  const strict = opts.strictBars ?? true;

  const rawTokens = stripComments(src)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const tokens = expandRepeats(rawTokens);

  const events: TabEvent[] = [];
  let dur = 1;
  let beat = 0;
  let barStart = 0;
  let barCount = 0;
  const flats = tuning === 'eflat';

  const push = (e: Omit<TabEvent, 'beat' | 'dur'>) => {
    events.push({ ...e, beat, dur });
    beat += dur;
  };

  for (const token of tokens) {
    let m: RegExpExecArray | null;

    if (token === '|') {
      barCount++;
      const len = beat - barStart;
      if (strict && Math.abs(len - beatsPerBar) > EPS) {
        throw new TabSyntaxError(
          `Bar ${barCount} has ${+len.toFixed(3)} beats, expected ${beatsPerBar} (near beat ${+beat.toFixed(3)})`,
        );
      }
      barStart = beat;
      continue;
    }

    if ((m = /^([whqes])(\.)?(3)?$/.exec(token))) {
      let d = DURATIONS[m[1]];
      if (m[2]) d *= 1.5;
      if (m[3]) d *= 2 / 3;
      dur = d;
      continue;
    }

    if (token === 'r') {
      push({ kind: 'rest', notes: [] });
      continue;
    }

    if (token === '-') {
      const last = events[events.length - 1];
      if (!last) throw new TabSyntaxError('Tie "-" with nothing before it');
      last.dur += dur;
      beat += dur;
      continue;
    }

    if ((m = /^([hp/\\]?)([1-6]):(\d{1,2})(.*)$/.exec(token))) {
      const string = Number(m[2]) as StringNumber;
      const fret = Number(m[3]);
      checkFret(fret, token);
      const mods = parseMods(m[4], token, 'pm b ~');
      const legato: Legato | undefined =
        m[1] === 'h' ? 'hammer' : m[1] === 'p' ? 'pull' : m[1] === '/' || m[1] === '\\' ? 'slide' : undefined;
      if (legato) {
        const prev = [...events].reverse().find((e) => e.kind !== 'rest');
        if (!prev || prev.kind !== 'note') {
          throw new TabSyntaxError(`"${token}" needs a single note before it to ${legato} from`);
        }
        if (legato !== 'slide' && prev.notes[0].string !== string) {
          throw new TabSyntaxError(`"${token}": hammer-ons and pull-offs stay on the same string`);
        }
      }
      push({
        kind: 'note',
        notes: [{ string, fret }],
        pm: mods.pm,
        bend: mods.bend,
        vibrato: mods.vibrato,
        accent: mods.accent,
        legato,
      });
      continue;
    }

    if ((m = /^(PP|PD|P|O)([1-6]):(\d{1,2})(.*)$/.exec(token))) {
      const string = Number(m[2]) as StringNumber;
      const fret = Number(m[3]);
      checkFret(fret, token);
      const mods = parseMods(m[4], token, 'pm d');
      const notes = powerChordNotes(m[1], string, fret, token);
      notes.forEach((n) => checkFret(n.fret, token));
      const rootMidi = fretMidi(tuning, string, fret);
      push({
        kind: 'chord',
        notes,
        name: m[1] === 'O' ? `${noteName(rootMidi, { octave: false, flats })} oct` : powerChordName(rootMidi, flats),
        pm: mods.pm,
        accent: mods.accent,
        strum: mods.strum ?? 'down',
      });
      continue;
    }

    if ((m = /^\[([^\]]+)\](.*)$/.exec(token))) {
      const inner = m[1];
      const mods = parseMods(m[2], token, 'pm d');
      let notes: FrettedNote[];
      let name: string | undefined;
      let chordId: string | undefined;
      const lib = CHORDS[inner];
      if (lib) {
        notes = shapeNotes(lib.frets);
        name = lib.name;
        chordId = lib.id;
      } else {
        const [fretsSrc, explicitName] = inner.split('=');
        let frets: (number | null)[];
        try {
          frets = parseFretString(fretsSrc);
        } catch {
          throw new TabSyntaxError(`Unknown chord "${inner}" in "${token}"`);
        }
        notes = shapeNotes(frets);
        const found = findChordByFrets(frets);
        name = explicitName?.replace(/_/g, ' ') ?? found?.name;
        chordId = found?.id;
      }
      if (notes.length === 0) throw new TabSyntaxError(`Chord "${token}" has no notes`);
      push({ kind: 'chord', notes, name, chordId, pm: mods.pm, accent: mods.accent, strum: mods.strum ?? 'down' });
      continue;
    }

    if ((m = /^X(.*)$/.exec(token))) {
      const mods = parseMods(m[1], token, 'd');
      push({ kind: 'mute', notes: [], strum: mods.strum ?? 'down', accent: mods.accent });
      continue;
    }

    throw new TabSyntaxError(`Can't read "${token}"`);
  }

  if (strict && barCount > 0 && Math.abs(beat - barStart) > EPS) {
    throw new TabSyntaxError(
      `The last bar has ${+(beat - barStart).toFixed(3)} beats, expected ${beatsPerBar}. End the tab with "|".`,
    );
  }

  return { events, beats: beat };
}

/** MIDI notes for an event (sorted low to high). */
export function eventMidis(e: Pick<TabEvent, 'notes'>, tuning: TuningId = 'standard'): number[] {
  return e.notes.map((n) => fretMidi(tuning, n.string, n.fret)).sort((a, b) => a - b);
}
