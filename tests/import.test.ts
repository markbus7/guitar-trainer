import { describe, expect, it } from 'vitest';
import { chordFromName, importTabText, nameChord } from '../src/music/import';
import { parseTab } from '../src/music/tab';

/** Build a six-line block from the low E line up, filling the other strings with dashes. */
function block(lines: Partial<Record<'e' | 'B' | 'G' | 'D' | 'A' | 'E', string>>, labels = ['e', 'B', 'G', 'D', 'A', 'E']) {
  const keys = ['e', 'B', 'G', 'D', 'A', 'E'] as const;
  const width = Math.max(...Object.values(lines).map((l) => l!.length));
  const template = Object.values(lines).find((l) => l!.length === width)!.replace(/[^|]/g, '-');
  return keys.map((k, i) => `${labels[i]}|${lines[k] ? lines[k]!.padEnd(width, '-') : template}`).join('\n');
}

function only(text: string) {
  const r = importTabText(text);
  expect(r.sections.length).toBe(1);
  return r.sections[0];
}

describe('tab import', () => {
  it('reads eighth notes on one string', () => {
    const s = only(block({ E: '-0-0-3-0-5-0-3-0-|' }));
    expect(s.tab).toBe('e 6:0 6:0 6:3 6:0 6:5 6:0 6:3 6:0 |');
  });

  it('reads quarter-note power chords and names them', () => {
    const s = only(block({ A: '-2---2---5---5---|', E: '-0---0---3---3---|' }));
    expect(s.tab).toBe('q [0,2,x,x,x,x] [0,2,x,x,x,x] [3,5,x,x,x,x] [3,5,x,x,x,x] |');
    const events = parseTab(s.tab).events;
    expect(events.map((e) => e.name)).toEqual(['E5', 'E5', 'G5', 'G5']);
  });

  it('names chords that are not in the library', () => {
    const s = only(block({ G: '-4-------|', D: '-4-------|', A: '-2-------|', E: '---------|' }));
    expect(s.tab).toBe('w [x,2,4,4,x,x=B5] |');
  });

  it('keeps hammer-ons, pull-offs, slides, bends and vibrato', () => {
    const s = only(block({ G: '-5h7-7p5-5/7-7b9~|' }));
    expect(s.tab).toBe('e 3:5 h3:7 3:7 p3:5 3:5 /3:7 q 3:7b2~ |');
    expect(() => parseTab(s.tab)).not.toThrow();
  });

  it('palm mutes the notes under a P.M. line', () => {
    const text = `  PM------------\n${block({ E: '-0-0-0-0-0-0-3-5-|' })}`;
    const s = only(text);
    expect(s.tab).toBe('e 6:0pm 6:0pm 6:0pm 6:0pm 6:0pm 6:0pm 6:3pm 6:5 |');
  });

  it('uses headings and repeat marks', () => {
    const text = `[Verse]\n${block({ E: '-0-3-5-3-|' })} x4`;
    const s = only(text);
    expect(s).toEqual({ name: 'Verse', repeat: 4, tab: 'q 6:0 6:3 6:5 6:3 |' });
  });

  it('reads two-digit frets', () => {
    const s = only(block({ e: '-12-10-------|', B: '-------13-12-|' }));
    expect(s.tab).toBe('q 1:12 1:10 2:13 2:12 |');
  });

  it('splits bars on bar lines and fills empty bars with rests', () => {
    const s = only(block({ E: '-0-------|---------|-3-------|' }));
    expect(s.tab).toBe('w 6:0 | r | 6:3 |');
  });

  it('keeps note lengths from the spacing, with ties when needed', () => {
    const s = only(block({ E: '-0-----------0---|' }));
    // A dotted half (12 sixteenths) then a quarter.
    expect(s.tab).toBe('h. 6:0 q 6:0 |');
    const t = only(block({ E: '---------0-------|' }));
    expect(t.tab).toBe('h r 6:0 |');
  });

  it('joins following blocks into one part and starts a new part at a heading', () => {
    const text = `Intro\n${block({ E: '-0-0-0-0-|' })}\n\n${block({ E: '-3-3-3-3-|' })}\n\nChorus\n${block({ A: '-0-0-0-0-|' })}`;
    const r = importTabText(text);
    expect(r.sections.map((s) => s.name)).toEqual(['Intro', 'Chorus']);
    expect(r.sections[0].tab).toBe('q 6:0 6:0 6:0 6:0 | q 6:3 6:3 6:3 6:3 |');
    expect(r.bars).toBe(3);
    expect(r.events).toBe(12);
  });

  it('guesses Drop D from the string names', () => {
    const r = importTabText(block({ E: '-0-0-0-0-|' }, ['e', 'B', 'G', 'D', 'A', 'D']));
    expect(r.tuning).toBe('dropD');
  });

  it('reads tuning, tempo and capo lines', () => {
    const r = importTabText(`Tuning: Eb Ab Db Gb Bb Eb\nTempo: 132 bpm\nCapo 2\n\n${block({ E: '-0-2-0-2-|' })}`);
    expect(r.tuning).toBe('eflat');
    expect(r.bpm).toBe(132);
    expect(r.capo).toBe(2);
    expect(r.sections[0].tab).toBe('q 6:2 6:4 6:2 6:4 |');
  });

  it('turns crowded tab without bar lines into several bars', () => {
    const line = '-0-0-0-0-3-3-3-3-5-5-5-5-3-3-3-3-0-0-0-0-';
    const r = importTabText(block({ E: line }));
    expect(r.bars).toBe(3);
    for (const s of r.sections) expect(() => parseTab(s.tab)).not.toThrow();
  });

  it('turns muted strums into X', () => {
    const s = only(block({ D: '-x-2-x-2-|', A: '-x-2-x-2-|', E: '-x-0-x-0-|' }));
    expect(s.tab).toBe('q X [0,2,2,x,x,x=E5] X [0,2,2,x,x,x=E5] |');
  });

  it('skips bass tab and explains why', () => {
    const r = importTabText('G|-----|\nD|-----|\nA|-3-5-|\nE|-0---|');
    expect(r.kind).toBe('none');
    expect(r.warnings.join(' ')).toMatch(/6-string/);
  });

  it('says so when nothing is found', () => {
    const r = importTabText('Just some lyrics\nand nothing else');
    expect(r.kind).toBe('none');
    expect(r.sections).toEqual([]);
  });

  it('never produces a tab the parser rejects', () => {
    const messy = [
      'Main riff (x2)',
      '   P.M. - - - - - -',
      'e|---------------------|-------------------------|',
      'B|---------------------|-------------------------|',
      'G|---------------------|--------7b9r7-5----------|',
      'D|-------------5/7-----|---7-5h7-------7-5--(5)--|',
      'A|-----5-7-------------|-------------------------|',
      'E|-0-0-----0-0-----x-x-|-<12>--------------------|',
      '',
      'e|-0--0--0---|',
      'B|-1--1--1---|',
      'G|-0--0--2---|',
      'D|-2--2--2---|',
      'A|-3--3--0---|',
      'E|-------x---| (x3)',
    ].join('\n');
    const r = importTabText(messy);
    expect(r.kind).toBe('tab');
    expect(r.sections.length).toBeGreaterThan(0);
    for (const s of r.sections) expect(() => parseTab(s.tab)).not.toThrow();
  });
});

describe('chord sheet import', () => {
  const sheet = ['[Verse]', 'G       D        Em      C', 'Some words to sing along', 'G       D        C', '', '[Chorus] ', 'C  G  D  (x2)'].join('\n');

  it('makes one bar of strumming per chord', () => {
    const r = importTabText(sheet);
    expect(r.kind).toBe('chords');
    expect(r.sections.map((s) => s.name)).toEqual(['Verse', 'Chorus']);
    expect(r.sections[0].tab.split('|').length - 1).toBe(7);
    expect(r.sections[1].tab.split('|').length - 1).toBe(6);
    expect(r.sections[0].tab.startsWith('q [G]d [G]d [G]d [G]d |')).toBe(true);
    for (const s of r.sections) expect(() => parseTab(s.tab)).not.toThrow();
  });

  it('can play the chords as power chords', () => {
    const r = importTabText(sheet, { voicing: 'power', strum: 'eighths' });
    expect(r.sections[0].tab.startsWith('e P6:3d P6:3d')).toBe(true);
    expect(r.sections[0].tab).toContain('P5:5d');
    for (const s of r.sections) expect(() => parseTab(s.tab)).not.toThrow();
  });

  it('reads chord-pro and labelled lines', () => {
    const r = importTabText('Intro: Am F C G\n[Am]Hello [F]there my [C]friend [G]');
    expect(r.kind).toBe('chords');
    expect(r.sections[0].name).toBe('Intro');
    expect(r.bars).toBe(8);
  });

  it('builds shapes for chords outside the library', () => {
    expect(chordFromName('Ab', 'open', 'standard', 0)?.inner).toBe('4,6,6,5,4,4=Ab');
    expect(chordFromName('C#m7', 'open', 'standard', 0)?.inner).toBe('x,4,6,4,5,4=C#m7');
    expect(chordFromName('Em', 'open', 'standard', 0)?.inner).toBe('Em');
    expect(chordFromName('G/B', 'open', 'standard', 0)?.inner).toBe('G');
    expect(chordFromName('D', 'power', 'dropD', 0)?.power).toBe('PD6:0');
    expect(chordFromName('Hello', 'open', 'standard', 0)).toBeNull();
  });

  it('names common chords from their notes', () => {
    expect(nameChord([40, 47])).toBe('E5');
    expect(nameChord([45, 52, 57, 60, 64])).toBe('Am');
    expect(nameChord([48, 52, 55, 59])).toBe('Cmaj7');
    expect(nameChord([52, 57, 60, 64])).toBe('Am/E');
  });
});
