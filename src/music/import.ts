import { CHORD_LIST, findChordByFrets } from './chords';
import { fretMidi, noteName, pitchClass, type StringNumber, type TuningId } from './notes';
import { parseTab } from './tab';

/**
 * Turns tab pasted from the web into Fretforge's tab language.
 *
 * Two kinds of text are understood:
 *  - ASCII tab: blocks of six lines (high e on top) with dashes, fret numbers and bar lines.
 *  - Chord sheets: lines with only chord names ("G  D  Em  C"), or [G]chord-pro style; every
 *    chord becomes one bar of strumming.
 *
 * Tab never says how long a note lasts, so the rhythm is a best guess from the spacing.
 */

export type StrumStyle = 'quarters' | 'eighths' | 'campfire';
export type ChordVoicing = 'open' | 'power';

export interface ImportOptions {
  /** Tuning the tab is written for. Defaults to the tuning found in the text, else standard. */
  tuning?: TuningId;
  /** Chord sheets: how each bar is strummed. */
  strum?: StrumStyle;
  /** Chord sheets: play the chords as written or as power chords. */
  voicing?: ChordVoicing;
}

export interface ImportedSection {
  name?: string;
  tab: string;
  repeat: number;
}

export interface ImportResult {
  kind: 'tab' | 'chords' | 'none';
  sections: ImportedSection[];
  bars: number;
  /** Notes and chords to play (repeats counted). */
  events: number;
  warnings: string[];
  /** Tuning named in the text or read from the string names. */
  tuning?: TuningId;
  bpm?: number;
  capo?: number;
}

type Legato = 'hammer' | 'pull' | 'slide';

interface Item {
  col: number;
  end: number;
  string: StringNumber;
  kind: 'note' | 'mute';
  fret: number;
  legato?: Legato;
  bend?: 1 | 2;
  vibrato?: boolean;
  pm?: boolean;
}

interface Row {
  line: number;
  start: number;
  label?: string;
  body: string;
}

interface Slot {
  start: number;
  end: number;
  items: Item[];
}

const SECTION_WORDS =
  /^(intro|verse|chorus|pre-?chorus|bridge|solo|outro|riff|main riff|interlude|breakdown|refrain|hook|coda|ending|end|instrumental|part|lick|fill|break|pre|post-?chorus|middle|theme|section|guitar|rhythm|lead)\b/i;
const CHORD_RE = /^([A-G])([#b♯♭]?)(maj7|maj9|maj|min7|min|m7b5|m7|m9|m6|madd9|m|dim7|dim|°|aug|\+|sus2|sus4|sus|add9|add11|7sus4|7sus2|6|7|9|11|13|5)?(\([^)]*\))?(\/[A-G][#b♯♭]?)?\*?$/;
const REPEAT_RE = /^[([]?\s*(?:x\s*(\d{1,2})|(\d{1,2})\s*x)\s*[)\]]?$/i;

function normalize(text: string) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/[‐-―−]/g, '-')
    .replace(/ /g, ' ');
}

// ---------------------------------------------------------------- tab lines

const PREFIX = /^(\s*)([A-Ga-g](?:#|b|♯|♭)?\d?)?(\s*)(\|+|:)?/;

function readTabLine(line: string, index: number): Row | null {
  const m = PREFIX.exec(line)!;
  const start = m[0].length;
  const body = line.slice(start).replace(/\s+$/, '');
  if (body.length < 4) return null;
  let dashes = 0;
  let bad = 0;
  let digits = 0;
  for (const ch of body) {
    if (ch === '-') dashes++;
    else if (ch >= '0' && ch <= '9') digits++;
    else if (!/[|hpbrsxtvo/\\~()<>[\].*=^+:' ]/i.test(ch)) bad++;
  }
  if (dashes < 3 || dashes < body.length * (m[2] || m[4] ? 0.2 : 0.3) || bad > body.length * 0.1) return null;
  // A plain line of dashes is a separator, not a string.
  if (!m[2] && !m[4] && !body.includes('|') && digits === 0) return null;
  return { line: index, start, label: m[2], body };
}

function labelPitch(label?: string) {
  if (!label) return undefined;
  const l = label.replace('♯', '#').replace('♭', 'b');
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flats: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
  const name = l[0].toUpperCase() + l.slice(1).replace(/\d/g, '');
  const idx = names.indexOf(flats[name] ?? name);
  return idx >= 0 ? idx : undefined;
}

/** Guess the tuning from the string names written in front of a block (top line = high e). */
function tuningFromLabels(labels: (string | undefined)[]): TuningId | undefined {
  const pcs = labels.map(labelPitch);
  if (pcs.some((p) => p === undefined)) return undefined;
  const key = pcs.join(',');
  const table: Record<string, TuningId> = {
    '4,11,7,2,9,4': 'standard',
    '4,11,7,2,9,2': 'dropD',
    '3,10,6,1,8,3': 'eflat',
    '2,9,5,0,7,2': 'dstandard',
    '2,9,5,0,7,0': 'dropC',
  };
  return table[key];
}

function tuningFromText(text: string): TuningId | undefined {
  const t = text.toLowerCase();
  if (/drop\s*c\b/.test(t)) return 'dropC';
  if (/drop\s*d\b/.test(t)) return 'dropD';
  if (/half[\s-]*step\s*down|e\s*flat|\beb\s+(standard|tuning)|eb\s*ab\s*db\s*gb\s*bb\s*eb|d#\s*g#\s*c#\s*f#\s*a#\s*d#/.test(t)) return 'eflat';
  if (/whole[\s-]*step\s*down|\bd\s*standard|d\s*g\s*c\s*f\s*a\s*d/.test(t)) return 'dstandard';
  if (/standard|e\s*a\s*d\s*g\s*b\s*e/.test(t)) return 'standard';
  return undefined;
}

// ---------------------------------------------------------------- scanning a string

function scanRow(body: string, string: StringNumber, warn: (w: string) => void): Item[] {
  const items: Item[] = [];
  let pending: Legato | undefined;
  for (let c = 0; c < body.length; c++) {
    const ch = body[c];
    if (ch >= '0' && ch <= '9') {
      let len = 1;
      if (c + 1 < body.length && body[c + 1] >= '0' && body[c + 1] <= '9' && Number(body.slice(c, c + 2)) <= 24) len = 2;
      const fret = Number(body.slice(c, c + len));
      const item: Item = { col: c, end: c + len - 1, string, kind: 'note', fret, legato: pending };
      pending = undefined;
      let k = c + len;
      if (body[k] === 'b' || body[k] === 'B') {
        k++;
        let target = '';
        if (body[k] === '(') {
          const mm = /^\((\d{1,2})\)/.exec(body.slice(k));
          if (mm) {
            target = mm[1];
            k += mm[0].length;
          }
        } else {
          while (k < body.length && body[k] >= '0' && body[k] <= '9' && target.length < 2) target += body[k++];
        }
        const amount = target ? Number(target) - fret : 2;
        item.bend = amount <= 1 ? 1 : 2;
        if (body[k] === 'r' || body[k] === 'R') {
          k++;
          while (k < body.length && body[k] >= '0' && body[k] <= '9') k++;
        }
      }
      if (body[k] === '~' || body[k] === 'v') {
        item.vibrato = true;
        while (body[k] === '~' || body[k] === 'v') k++;
      }
      items.push(item);
      c = k - 1;
      continue;
    }
    if (ch === 'h' || ch === 'H') pending = 'hammer';
    else if (ch === 'p' || ch === 'P') pending = 'pull';
    else if (ch === '/' || ch === '\\' || ch === 's' || ch === 'S') pending = 'slide';
    else if (ch === 'x' || ch === 'X') {
      items.push({ col: c, end: c, string, kind: 'mute', fret: 0 });
      pending = undefined;
    } else if (ch === '<') {
      const mm = /^<(\d{1,2})>/.exec(body.slice(c));
      if (mm) {
        const h = Number(mm[1]);
        const fret = h === 12 ? 12 : h === 7 || h === 19 ? 19 : h === 5 || h === 24 ? 24 : -1;
        if (fret >= 0) items.push({ col: c, end: c + mm[0].length - 1, string, kind: 'note', fret });
        else warn('Some harmonics were left out.');
        c += mm[0].length - 1;
      }
    } else if (ch === '|') pending = undefined;
  }
  return items;
}

function groupSlots(items: Item[]): Slot[] {
  const sorted = [...items].sort((a, b) => a.col - b.col || a.string - b.string);
  const slots: Slot[] = [];
  for (const it of sorted) {
    const last = slots[slots.length - 1];
    if (last && it.col <= last.end) {
      if (!last.items.some((x) => x.string === it.string)) last.items.push(it);
      last.end = Math.max(last.end, it.end);
    } else slots.push({ start: it.col, end: it.end, items: [it] });
  }
  return slots;
}

// ---------------------------------------------------------------- rhythm

const STRAIGHT: [number, string][] = [
  [16, 'w'],
  [12, 'h.'],
  [8, 'h'],
  [6, 'q.'],
  [4, 'q'],
  [3, 'e.'],
  [2, 'e'],
  [1, 's'],
];
const TRIPLET: [number, string][] = [
  [12, 'w'],
  [9, 'h.'],
  [6, 'h'],
  [4, 'h3'],
  [3, 'q'],
  [2, 'q3'],
  [1, 'e3'],
];

/** Split a length (in grid steps) into note values that tie together. */
function splitLength(steps: number, grid: number): string[] {
  const table = grid === 12 ? TRIPLET : STRAIGHT;
  let left = grid === 12 ? steps : steps * (16 / grid);
  const out: string[] = [];
  while (left > 0) {
    const [n, tok] = table.find(([v]) => v <= left)!;
    out.push(tok);
    left -= n;
  }
  return out;
}

interface Placed {
  step: number;
  slot: Slot;
}

/** Place the notes of one bar on a grid of 4, 8, 16 (or 12 for triplets) steps. */
function quantize(slots: Slot[], start: number, width: number, margin: number): { grid: number; placed: Placed[]; squeezed: boolean } {
  const w = Math.max(1, width - margin);
  const pos = slots.map((s) => Math.max(0, s.start - start - margin) / w);
  const tryGrid = (grid: number) => {
    let err = 0;
    const steps = pos.map((p) => {
      const x = p * grid;
      const r = Math.min(grid - 1, Math.round(x));
      err = Math.max(err, Math.abs(x - r));
      return r;
    });
    const clash = steps.some((s, i) => i > 0 && s <= steps[i - 1]);
    return { grid, steps, err, clash };
  };
  const options = [4, 8, 16, 12].map(tryGrid);
  let pick = options.slice(0, 3).find((o) => !o.clash && o.err <= 0.2);
  if (!pick) {
    const ok = options.filter((o) => !o.clash).sort((a, b) => a.err - b.err);
    pick = ok.find((o) => o.grid !== 12) ?? ok[0];
    if (ok[0]?.grid === 12 && pick && pick.grid !== 12 && ok[0].err < pick.err - 0.12) pick = ok[0];
  }
  let squeezed = false;
  if (!pick) {
    // Too crowded for sixteenths: nudge notes forward, and fold leftovers into the last note.
    const g = tryGrid(16);
    const steps: number[] = [];
    for (const s of g.steps) {
      const prev = steps[steps.length - 1];
      steps.push(prev === undefined ? s : Math.max(s, prev + 1));
    }
    squeezed = true;
    const placed: Placed[] = [];
    steps.forEach((s, i) => {
      if (s <= 15) placed.push({ step: s, slot: slots[i] });
    });
    return { grid: 16, placed, squeezed };
  }
  return { grid: pick.grid, placed: pick.steps.map((s, i) => ({ step: s, slot: slots[i] })), squeezed };
}

// ---------------------------------------------------------------- naming chords

const QUALITIES: [string, number[]][] = [
  ['5', [0, 7]],
  ['', [0, 4, 7]],
  ['m', [0, 3, 7]],
  ['7', [0, 4, 7, 10]],
  ['m7', [0, 3, 7, 10]],
  ['maj7', [0, 4, 7, 11]],
  ['sus2', [0, 2, 7]],
  ['sus4', [0, 5, 7]],
  ['add9', [0, 2, 4, 7]],
  ['6', [0, 4, 7, 9]],
  ['m6', [0, 3, 7, 9]],
  ['dim', [0, 3, 6]],
  ['aug', [0, 4, 8]],
  ['7sus4', [0, 5, 7, 10]],
];

/** A readable name for a set of notes, root on the lowest note when possible. */
export function nameChord(midis: number[], flats = false): string | undefined {
  if (midis.length < 2) return undefined;
  const sorted = [...midis].sort((a, b) => a - b);
  const pcs = [...new Set(sorted.map(pitchClass))];
  const roots = [pitchClass(sorted[0]), ...pcs.filter((p) => p !== pitchClass(sorted[0]))];
  for (const root of roots) {
    const rel = new Set(pcs.map((p) => (p - root + 12) % 12));
    for (const [suffix, iv] of QUALITIES) {
      if (iv.length === rel.size && iv.every((x) => rel.has(x))) {
        const name = noteName(root + 60, { octave: false, flats }) + suffix;
        return root === pitchClass(sorted[0]) ? name : `${name}/${noteName(sorted[0], { octave: false, flats })}`;
      }
    }
  }
  return undefined;
}

// ---------------------------------------------------------------- emitting

interface Emitter {
  tokens: string[];
  len?: string;
  prev?: { kind: 'note'; string: StringNumber; fret: number } | { kind: 'chord' };
  events: number;
}

function emit(em: Emitter, lengths: string[], token: string | null) {
  lengths.forEach((l, i) => {
    if (em.len !== l) {
      em.tokens.push(l);
      em.len = l;
    }
    if (token === null) em.tokens.push('r');
    else em.tokens.push(i === 0 ? token : '-');
  });
}

function slotToken(slot: Slot, em: Emitter, tuning: TuningId, capo: number): string {
  const notes = slot.items.filter((i) => i.kind === 'note');
  if (notes.length === 0) {
    em.prev = { kind: 'chord' };
    return 'X';
  }
  em.events++;
  if (notes.length === 1) {
    const n = notes[0];
    const fret = n.fret + capo;
    let prefix = '';
    const prev = em.prev;
    if (n.legato && prev?.kind === 'note') {
      if (n.legato === 'slide' && prev.fret !== fret) prefix = '/';
      else if (n.legato === 'hammer' && prev.string === n.string && fret > prev.fret) prefix = 'h';
      else if (n.legato === 'pull' && prev.string === n.string && fret < prev.fret) prefix = 'p';
    }
    em.prev = { kind: 'note', string: n.string, fret };
    return `${prefix}${n.string}:${fret}${n.pm ? 'pm' : ''}${n.bend ? `b${n.bend}` : ''}${n.vibrato ? '~' : ''}`;
  }
  const frets: (number | null)[] = [null, null, null, null, null, null];
  for (const n of notes) frets[6 - n.string] = Math.min(24, n.fret + capo);
  em.prev = { kind: 'chord' };
  const lib = findChordByFrets(frets);
  const midis = notes.map((n) => fretMidi(tuning, n.string, Math.min(24, n.fret + capo)));
  const name = lib ? undefined : nameChord(midis, tuning === 'eflat');
  const pm = notes.every((n) => n.pm) ? 'pm' : '';
  return `[${frets.map((f) => (f === null ? 'x' : f)).join(',')}${name ? `=${name.replace(/\s/g, '_')}` : ''}]${pm}`;
}

// ---------------------------------------------------------------- headings, PM and repeats

function headingOf(line: string): { name: string; repeat?: number } | null {
  const t = line.trim();
  if (!t || t.length > 40 || t.includes('|')) return null;
  const m = /^[[(]?\s*([A-Za-z][A-Za-z0-9 '’&.\-/#]*?)\s*[\])]?\s*:?\s*(?:[([]?\s*(?:x\s*(\d{1,2})|(\d{1,2})\s*x)\s*[)\]]?)?\s*$/i.exec(t);
  if (!m) return null;
  const name = m[1].trim();
  const bracketed = /^[[(]/.test(t);
  if (!bracketed && !t.includes(':') && !SECTION_WORDS.test(name)) return null;
  if (/^p\.?\s?m\.?$/i.test(name) || /^(tuning|capo|tempo|bpm|key)\b/i.test(name)) return null;
  const rep = Number(m[2] ?? m[3]);
  return { name: name.charAt(0).toUpperCase() + name.slice(1), repeat: rep > 1 ? rep : undefined };
}

/** Columns covered by "P.M.-----" markings on a line, in raw text columns. */
function pmRanges(line: string | undefined): [number, number][] {
  if (!line || !/p\.?\s?m/i.test(line)) return [];
  if (/[a-ln-oq-z]{3,}/i.test(line.replace(/p\.?\s?m\.?/gi, ''))) return [];
  const out: [number, number][] = [];
  const re = /p\.?\s?m\.?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    let end = m.index + m[0].length - 1;
    let k = end + 1;
    while (k < line.length && /[-._|=~ ]/.test(line[k]) && !(line[k] === ' ' && line[k + 1] === ' ')) k++;
    end = Math.max(end, k - 1);
    out.push([m.index, end]);
  }
  return out;
}

function repeatOf(tail: string): number | undefined {
  const m = REPEAT_RE.exec(tail.trim());
  if (!m) return undefined;
  const n = Number(m[1] ?? m[2]);
  return n > 1 && n <= 16 ? n : undefined;
}

// ---------------------------------------------------------------- tab mode

interface Block {
  rows: Row[];
  first: number;
  last: number;
}

function findBlocks(lines: string[], warnings: Set<string>): Block[] {
  const rows = lines.map(readTabLine);
  const blocks: Block[] = [];
  let skipped = 0;
  for (let i = 0; i < lines.length; ) {
    if (!rows[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j < lines.length && rows[j]) j++;
    let group = rows.slice(i, j) as Row[];
    // Drop label-less, note-less lines at the edges (rulers and separators).
    while (group.length > 6 && group.length % 6 !== 0 && !group[0].label && !/\d/.test(group[0].body)) group = group.slice(1);
    while (group.length > 6 && group.length % 6 !== 0 && !group[group.length - 1].label && !/\d/.test(group[group.length - 1].body)) group = group.slice(0, -1);
    if (group.length % 6 === 0) {
      for (let k = 0; k < group.length; k += 6) {
        const r = group.slice(k, k + 6);
        blocks.push({ rows: r, first: r[0].line, last: r[5].line });
      }
    } else skipped++;
    i = j;
  }
  if (skipped) warnings.add(`Skipped ${skipped} part${skipped > 1 ? 's' : ''} that did not look like 6-string guitar tab (bass or 7-string tab is not supported).`);
  return blocks;
}

function importTab(lines: string[], blocks: Block[], tuning: TuningId, capo: number, warnings: Set<string>): { sections: ImportedSection[]; bars: number; events: number } {
  const sections: ImportedSection[] = [];
  let totalBars = 0;
  let events = 0;
  const em: Emitter = { tokens: [], events: 0 };
  const warn = (w: string) => warnings.add(w);

  blocks.forEach((block, bi) => {
    // Section name: a short heading just above the block (skipping PM lines and blank lines).
    let heading: { name: string; repeat?: number } | null = null;
    for (let k = block.first - 1, seen = 0; k >= 0 && seen < 3; k--) {
      if (bi > 0 && k <= blocks[bi - 1].last) break;
      const line = lines[k];
      if (!line.trim()) {
        seen++;
        continue;
      }
      if (pmRanges(line).length) continue;
      heading = headingOf(line);
      break;
    }

    // Repeat markers after the last bar line ("|  x4").
    let repeat = heading?.repeat ?? 1;
    const bodies = block.rows.map((r) => {
      let body = r.body;
      const lastBar = body.lastIndexOf('|');
      if (lastBar >= 0) {
        const tail = body.slice(lastBar + 1);
        if (tail.trim() && !tail.includes('-')) {
          repeat = repeatOf(tail) ?? repeat;
          body = body.slice(0, lastBar + 1);
        }
      }
      return body;
    });
    const offset = block.rows[0].start;
    const width = Math.max(...bodies.map((b) => b.length));
    const cleaned = bodies.map((b) =>
      b
        .padEnd(width, '-')
        .replace(/[:*o]/g, (ch, i, s) => (s[i - 1] === '|' || s[i + 1] === '|' || ch !== 'o' ? '-' : ch))
        .replace(/ /g, '-'),
    );

    // Palm-mute markings above or below the block.
    const pm = [...pmRanges(lines[block.first - 1]), ...pmRanges(lines[block.last + 1])].map(([a, b]) => [a - offset, b - offset]);

    const items: Item[] = [];
    cleaned.forEach((body, i) => {
      for (const it of scanRow(body, (i + 1) as StringNumber, warn)) {
        if (it.kind === 'note' && pm.some(([a, b]) => it.col >= a && it.col <= b)) it.pm = true;
        items.push(it);
      }
    });

    // Bar lines: columns where most strings have a "|" ("||" counts as one).
    const bars: [number, number][] = [];
    for (let c = 0; c < width; c++) {
      if (cleaned.filter((b) => b[c] === '|').length < 4) continue;
      const last = bars[bars.length - 1];
      if (last && last[1] === c - 1) last[1] = c;
      else bars.push([c, c]);
    }
    let segments: [number, number][] = [];
    let from = 0;
    for (const [a, b] of bars) {
      if (a > from) segments.push([from, a - 1]);
      from = b + 1;
    }
    if (from < width) segments.push([from, width - 1]);
    const slotsAll = groupSlots(items);
    const hasSlots = ([a, b]: [number, number]) => slotsAll.some((s) => s.start >= a && s.start <= b);
    segments = segments.filter((seg) => seg[1] - seg[0] >= 2 || hasSlots(seg));
    // A short empty stub after the last bar line is the end of the line, not a bar of rest.
    const tail = segments[segments.length - 1];
    if (tail && segments.length > 1 && !hasSlots(tail)) {
      const widths = segments.map(([a, b]) => b - a + 1).sort((x, y) => x - y);
      if (tail[1] - tail[0] + 1 < widths[Math.floor(widths.length / 2)] / 2) segments.pop();
    }

    // No bar lines inside the block: cut it into bars of eight of the most common note spacing.
    if (segments.length <= 1 && slotsAll.length > (bars.length ? 12 : 1)) {
      const gaps = slotsAll.slice(1).map((s, i) => s.start - slotsAll[i].start);
      const counts = new Map<number, number>();
      gaps.forEach((g) => counts.set(g, (counts.get(g) ?? 0) + 1));
      const unit = [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
      const barWidth = Math.max(4, unit * 8);
      segments = [];
      for (let a = 0; a < width; a += barWidth) segments.push([a, Math.min(width - 1, a + barWidth - 1)]);
      if (segments.length && !slotsAll.some((s) => s.start >= segments[segments.length - 1][0])) segments.pop();
      warnings.add('Part of this tab has no bar lines, so the bars are a guess.');
    }

    // Leading margin: most bars start with a dash before the first note.
    const firstOffsets = segments
      .map(([a, b]) => slotsAll.find((s) => s.start >= a && s.start <= b))
      .map((s, i) => (s ? s.start - segments[i][0] : 99))
      .filter((o) => o <= 2);
    const margin = firstOffsets.length ? mode(firstOffsets) : 1;

    em.tokens = [];
    em.len = undefined;
    let barCount = 0;
    for (const [a, b] of segments) {
      const slots = slotsAll.filter((s) => s.start >= a && s.start <= b);
      barCount++;
      if (slots.length === 0) {
        emit(em, ['w'], null);
        em.tokens.push('|');
        continue;
      }
      const { grid, placed, squeezed } = quantize(slots, a, b - a + 1, Math.min(margin, b - a));
      if (squeezed) warn('Some fast notes were squeezed together. Check them in Practice mode.');
      if (placed[0].step > 0) emit(em, splitLength(placed[0].step, grid), null);
      placed.forEach((p, i) => {
        const next = placed[i + 1]?.step ?? grid;
        emit(em, splitLength(next - p.step, grid), slotToken(p.slot, em, tuning, capo));
      });
      em.tokens.push('|');
    }
    if (barCount === 0) return;
    const tab = em.tokens.join(' ');
    events += em.events * repeat;
    em.events = 0;
    totalBars += barCount * repeat;
    const prev = sections[sections.length - 1];
    if (!heading && prev && prev.repeat === 1 && repeat === 1) prev.tab = `${prev.tab} ${tab}`;
    else sections.push({ name: heading?.name, tab, repeat });
  });
  return { sections, bars: totalBars, events };
}

function mode(values: number[]) {
  const counts = new Map<number, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  return [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
}

// ---------------------------------------------------------------- chord sheets

const E_SHAPES: Record<string, (number | null)[]> = {
  '': [0, 2, 2, 1, 0, 0],
  m: [0, 2, 2, 0, 0, 0],
  '7': [0, 2, 0, 1, 0, 0],
  m7: [0, 2, 0, 0, 0, 0],
  '5': [0, 2, null, null, null, null],
  sus4: [0, 2, 2, 2, 0, 0],
};
const A_SHAPES: Record<string, (number | null)[]> = {
  '': [null, 0, 2, 2, 2, 0],
  m: [null, 0, 2, 2, 1, 0],
  '7': [null, 0, 2, 0, 2, 0],
  m7: [null, 0, 2, 0, 1, 0],
  maj7: [null, 0, 2, 1, 2, 0],
  '5': [null, 0, 2, null, null, null],
  sus2: [null, 0, 2, 2, 0, 0],
  sus4: [null, 0, 2, 2, 3, 0],
};

function simplify(quality: string): string {
  const q = quality.replace('min', 'm');
  const map: Record<string, string> = {
    maj: '',
    maj9: 'maj7',
    m9: 'm7',
    m6: 'm',
    madd9: 'm',
    m7b5: 'm7',
    dim: 'm',
    dim7: 'm',
    '°': 'm',
    aug: '',
    '+': '',
    sus: 'sus4',
    add9: '',
    add11: '',
    '6': '',
    '9': '7',
    '11': '7',
    '13': '7',
    '7sus4': '7',
    '7sus2': '7',
  };
  return map[q] ?? q;
}

interface ChordPick {
  inner: string;
  power?: string;
}

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Turn a chord name into something Fretforge can play. */
export function chordFromName(name: string, voicing: ChordVoicing, tuning: TuningId, capo: number): ChordPick | null {
  const m = CHORD_RE.exec(name.trim());
  if (!m) return null;
  const acc = m[2] === '#' || m[2] === '♯' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0;
  const pc = (PC[m[1]] + acc + 12) % 12;
  const quality = simplify(m[3] ?? '');
  const display = `${m[1]}${m[2].replace('♯', '#').replace('♭', 'b')}${quality}`;

  if (voicing === 'power') {
    // Drop tunings: one finger across the three low strings, counted from the dropped string.
    if (tuning === 'dropD' || tuning === 'dropC') {
      const low = tuning === 'dropD' ? 2 : 0;
      return { inner: '', power: `PD6:${((pc - low + 12) % 12) + capo}` };
    }
    // Chord sheets name shapes, so count from E and A even in E-flat or D standard.
    const f6 = (pc - 4 + 12) % 12;
    const f5 = (pc - 9 + 12) % 12;
    return f6 <= 4 || f6 <= f5 ? { inner: '', power: `P6:${f6 + capo}` } : { inner: '', power: `P5:${f5 + capo}` };
  }

  // A library shape when one has this exact name (nicer fingerings).
  if (capo === 0) {
    const lib = CHORD_LIST.find((c) => c.name.replace('♯', '#').replace('♭', 'b') === display && c.category !== 'power');
    if (lib) return { inner: lib.id };
  }
  const f6 = (pc - 4 + 12) % 12;
  const f5 = (pc - 9 + 12) % 12;
  const useA = !(quality in E_SHAPES) || (quality in A_SHAPES && f5 < f6);
  const shape = useA ? A_SHAPES[quality] ?? A_SHAPES[''] : E_SHAPES[quality];
  const root = useA ? f5 : f6;
  const frets = shape.map((f) => (f === null ? null : f + root + capo));
  if (frets.some((f) => f !== null && f > 22)) return null;
  return { inner: `${frets.map((f) => (f === null ? 'x' : f)).join(',')}=${display}` };
}

const STRUMS: Record<StrumStyle, (c: string) => string> = {
  quarters: (c) => `q ${c}d ${c}d ${c}d ${c}d`,
  eighths: (c) => `e ${Array(8).fill(`${c}d`).join(' ')}`,
  campfire: (c) => `e ${c}d r ${c}d ${c}u r ${c}u ${c}d ${c}u`,
};

function chordTokens(line: string): string[] | null {
  // Lines of tab (or bass tab) are never chord lines.
  if (/-{3,}/.test(line)) return null;
  // Chord-pro: "[G]Hello [D]world"
  const pro = [...line.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1].trim());
  if (pro.length && pro.every((c) => CHORD_RE.test(c))) return pro;
  const parts = line
    .split(/[\s|]+/)
    .map((p) => p.trim())
    .filter((p) => p && !REPEAT_RE.test(p) && !/^(n\.?c\.?|-+|%|\/+|\.+)$/i.test(p));
  if (parts.length === 0 || !parts.every((p) => CHORD_RE.test(p))) return null;
  return parts;
}

function importChords(lines: string[], opts: Required<Pick<ImportOptions, 'strum' | 'voicing'>>, tuning: TuningId, capo: number, warnings: Set<string>) {
  const sections: ImportedSection[] = [];
  let current: { name?: string; bars: string[]; repeat: number } | null = null;
  let bars = 0;
  let events = 0;
  const unknown = new Set<string>();
  const flush = () => {
    if (current && current.bars.length) sections.push({ name: current.name, tab: `${current.bars.join(' | ')} |`, repeat: current.repeat });
    current = null;
  };
  for (const raw of lines) {
    let line = raw;
    const labelled = /^\s*[[(]?([A-Za-z][A-Za-z0-9 \-]{0,20}?)[\])]?\s*:\s*(.+)$/.exec(line);
    if (labelled && !/chord|tuning|capo|key|tempo|bpm/i.test(labelled[1]) && chordTokens(labelled[2])) {
      flush();
      current = { name: labelled[1].charAt(0).toUpperCase() + labelled[1].slice(1), bars: [], repeat: 1 };
      line = labelled[2];
    }
    const h = headingOf(line);
    const chords = chordTokens(line);
    if (h && !chords) {
      flush();
      current = { name: h.name, bars: [], repeat: h.repeat ?? 1 };
      continue;
    }
    if (!chords) continue;
    const rep = line
      .split(/\s+/)
      .map(repeatOf)
      .find((n) => n);
    const lineBars: string[] = [];
    for (const name of chords) {
      const pick = chordFromName(name, opts.voicing, tuning, capo);
      if (!pick) {
        unknown.add(name);
        continue;
      }
      const token = pick.power ?? `[${pick.inner}]`;
      lineBars.push(STRUMS[opts.strum](token));
      events += opts.strum === 'quarters' ? 4 : opts.strum === 'eighths' ? 8 : 6;
    }
    if (!current) current = { bars: [], repeat: 1 };
    for (let k = 0; k < (rep ?? 1); k++) current.bars.push(...lineBars);
    bars += lineBars.length * (rep ?? 1);
  }
  flush();
  if (unknown.size) warnings.add(`Left out chords Fretforge can't play yet: ${[...unknown].slice(0, 6).join(', ')}.`);
  for (const s of sections) {
    if (s.repeat > 1) {
      bars += (s.tab.split('|').length - 1) * (s.repeat - 1);
    }
  }
  return { sections, bars, events };
}

// ---------------------------------------------------------------- entry point

export function importTabText(text: string, opts: ImportOptions = {}): ImportResult {
  const lines = normalize(text).split('\n');
  const warnings = new Set<string>();

  let named: TuningId | undefined;
  let bpm: number | undefined;
  let capo = 0;
  for (const line of lines) {
    if (/tuning/i.test(line)) named = tuningFromText(line) ?? named;
    const b = /(\d{2,3})\s*bpm/i.exec(line) ?? /(?:bpm|tempo)\s*[:=]?\s*(?:q\s*=\s*)?(\d{2,3})/i.exec(line);
    if (b && !bpm) {
      const n = Number(b[1]);
      if (n >= 40 && n <= 260) bpm = n;
    }
    const c = /capo\s*[:=-]?\s*(?:on\s*)?(?:the\s*)?(?:fret\s*)?(\d{1,2})/i.exec(line);
    if (c && !capo) capo = Math.min(9, Number(c[1]));
  }

  const blocks = findBlocks(lines, warnings);
  const labelled = blocks.map((b) => tuningFromLabels(b.rows.map((r) => r.label))).find((t) => t && t !== 'standard');
  const guessed = named ?? labelled;
  const tuning = opts.tuning ?? guessed ?? 'standard';

  let kind: ImportResult['kind'] = 'none';
  let out: { sections: ImportedSection[]; bars: number; events: number } = { sections: [], bars: 0, events: 0 };
  if (blocks.length) {
    kind = 'tab';
    out = importTab(lines, blocks, tuning, capo, warnings);
    warnings.add('Tab does not show how long notes last, so the rhythm is a best guess. Try it in Practice mode first.');
  } else {
    const chords = importChords(lines, { strum: opts.strum ?? 'quarters', voicing: opts.voicing ?? 'open' }, tuning, capo, warnings);
    if (chords.sections.length) {
      kind = 'chords';
      out = chords;
      warnings.add('Chord sheets have no rhythm, so every chord gets one bar. Pick a strum that fits the song.');
    }
  }
  if (capo) warnings.add(`Capo on fret ${capo}: the highway shows real fret numbers, so an open string shows as ${capo}.`);
  if (kind === 'none') warnings.add('No tab found. Paste six lines of tab (high e on top) or lines of chord names.');

  // Every section must parse; anything that does not is dropped rather than breaking the song.
  const sections = out.sections.filter((s) => {
    try {
      parseTab(s.tab, { tuning });
      return true;
    } catch {
      warnings.add('A part of the tab could not be read and was left out.');
      return false;
    }
  });
  if (out.bars > 400) warnings.add('This is a long tab. Consider pasting one part at a time.');

  return { kind, sections, bars: out.bars, events: out.events, warnings: [...warnings], tuning: guessed, bpm, capo: capo || undefined };
}
