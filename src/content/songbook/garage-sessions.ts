import type { Lesson } from '../types';
import { bars, DOWN4, E8, PM8, rep, STRUM } from './helpers';

/**
 * The Garage Sessions: nine more original songs, mostly for the first months.
 * Punk, pop-punk, rock, blues, metal and one for the semi-acoustic.
 */

// ── Level 1 ──────────────────────────────────────────────────────────────

const ALARM_VERSE = bars('q P6:0 P6:0 P6:0 P6:0', 'P5:0 P5:0 P5:0 P5:0', 'P6:0 P6:0 P6:0 P6:0', 'P4:0 P4:0 P5:0 P5:0');
const ALARM_CHORUS = bars('h P5:0 P4:0', 'P5:0 P6:0', 'P5:0 P4:0', 'q P5:0 P5:0 P6:0 r');

export const threeChordAlarm: Lesson = {
  id: 'sb-three-chord-alarm',
  title: 'Three Chord Alarm',
  band: 'The Snooze Buttons',
  kind: 'song',
  genre: 'punk',
  level: 1,
  style: 'Punk',
  summary: 'E5, A5 and D5, one finger each, all on the beat. Loud enough to wake the whole street.',
  skills: ['open power chords', 'quarter notes'],
  bpm: 112,
  tone: 'punk',
  mode: 'practice',
  tips: [
    {
      title: 'One finger, three chords',
      body: 'Each chord is an **open string plus one finger on the 2nd fret** of the next string. Your finger just hops across: E5, A5, D5.',
      figure: { type: 'chords', chords: ['E5', 'A5', 'D5'] },
    },
  ],
  sections: [
    { name: 'Intro', tab: bars('h P6:0 P6:0', 'P5:0 P4:0'), repeat: 2, groove: 'rockHalf', crash: true },
    { name: 'Verse', tab: ALARM_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: ALARM_CHORUS, repeat: 2, groove: 'skate', crash: true, fill: true },
    { name: 'Verse', tab: ALARM_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: ALARM_CHORUS, repeat: 2, groove: 'skate', crash: true },
    { name: 'Outro', tab: bars('q P6:0 r P6:0 r', 'w P6:0'), groove: 'stop', crash: true },
  ],
};

const THUNDER_RIFF = bars('q 6:0pm 6:0pm 6:0pm 6:3', '6:0pm 6:0pm 6:0pm 6:2');
const THUNDER_CHORUS = bars('h 6:0 6:3', 'w 6:2');

export const lowStringThunder: Lesson = {
  id: 'sb-low-string-thunder',
  title: 'Low String Thunder',
  band: 'Gravel Mouth',
  kind: 'song',
  genre: 'metal',
  level: 1,
  style: 'Heavy metal',
  summary: 'Your first metal song lives on one string: chunky palm mutes and two fretted notes.',
  skills: ['low E riffs', 'palm muting'],
  bpm: 92,
  tone: 'metal',
  mode: 'practice',
  tips: [
    {
      title: 'Only the thickest string',
      body: 'Everything is on the **low E string**: open, 2nd fret (middle finger) and 3rd fret (ring finger). Rest the side of your picking hand on the string near the bridge for the muted **pm** notes.',
      figure: { type: 'art', art: 'palm-mute' },
    },
  ],
  sections: [
    { name: 'Intro', tab: THUNDER_RIFF, repeat: 2, groove: 'tom', crash: true },
    { name: 'Verse', tab: THUNDER_RIFF, repeat: 4, groove: 'metal' },
    { name: 'Chorus', tab: THUNDER_CHORUS, repeat: 2, groove: 'rockHalf', crash: true, fill: true },
    { name: 'Verse', tab: THUNDER_RIFF, repeat: 4, groove: 'metal' },
    { name: 'Chorus', tab: THUNDER_CHORUS, repeat: 2, groove: 'rockHalf', crash: true },
    { name: 'Outro', tab: bars('q 6:0pm 6:0pm 6:0pm 6:0pm', 'w 6:0'), groove: 'stop', crash: true },
  ],
};

// ── Level 2 ──────────────────────────────────────────────────────────────

const HOMEWORK_VERSE = bars(DOWN4('G5'), DOWN4('C5'), DOWN4('G5'), 'q P5:5 P5:5 P6:3 P6:3');
const HOMEWORK_CHORUS = bars('h P6:3 P5:5', 'P5:3 P6:3', 'P6:3 P5:5', 'q P5:3 P5:3 P6:3 r');

export const homeworkCanWait: Lesson = {
  id: 'sb-homework-can-wait',
  title: 'Homework Can Wait',
  band: 'Detention Club',
  kind: 'song',
  genre: 'pop-punk',
  level: 2,
  style: 'Pop-punk',
  summary: 'Your first movable power chords: G5, C5 and D5, the classic pop-punk trio.',
  skills: ['movable power chords', 'down-strokes'],
  bpm: 132,
  tone: 'punk',
  tips: [
    {
      title: 'One shape, three places',
      body: 'Index finger on the root, ring finger two frets higher on the next string. **G5**: low E, 3rd fret. **C5**: A string, 3rd fret. **D5**: A string, 5th fret. Keep the shape locked and move your whole arm.',
      figure: { type: 'chords', chords: ['G5', 'C5', 'D5m'] },
    },
  ],
  sections: [
    { name: 'Intro', tab: bars('h P6:3 P6:3', 'P5:3 P5:5'), repeat: 2, groove: 'rockHalf', crash: true },
    { name: 'Verse', tab: HOMEWORK_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: HOMEWORK_CHORUS, repeat: 2, groove: 'skate', crash: true, fill: true },
    { name: 'Verse', tab: HOMEWORK_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: HOMEWORK_CHORUS, repeat: 2, groove: 'skate', crash: true },
    { name: 'Outro', tab: bars('q P6:3 r P5:5 r', 'w P6:3'), groove: 'stop', crash: true },
  ],
};

const RUST_RIFF = bars('e 6:0 6:0 6:3 6:0 5:0 5:2 q 5:0', 'e 6:0 6:0 6:3 6:0 q 6:5 6:3');
const RUST_CHORUS = bars('h P5:0 P4:0', 'P5:0 P6:0', 'P5:0 P4:0', 'w P6:0');

export const rustAndChrome: Lesson = {
  id: 'sb-rust-and-chrome',
  title: 'Rust & Chrome',
  band: 'Highway Saints',
  kind: 'song',
  genre: 'rock',
  level: 2,
  style: 'Hard rock',
  summary: 'A swaggering riff across two strings and a chorus of open power chords.',
  skills: ['single-note riffs', 'open power chords'],
  bpm: 100,
  tone: 'crunch',
  tips: [
    {
      title: 'Fingers for the riff',
      body: 'Use your **index finger** for every 2nd and 3rd fret and your **ring finger** for the 5th fret. Let the open strings ring while your hand gets ready for the next note.',
    },
  ],
  sections: [
    { name: 'Riff', tab: RUST_RIFF, repeat: 2, groove: 'rock', crash: true },
    { name: 'Verse', tab: RUST_RIFF, repeat: 2, groove: 'rock' },
    { name: 'Chorus', tab: RUST_CHORUS, repeat: 2, groove: 'drive', crash: true, fill: true },
    { name: 'Verse', tab: RUST_RIFF, repeat: 2, groove: 'rock' },
    { name: 'Chorus', tab: RUST_CHORUS, repeat: 2, groove: 'drive', crash: true },
    { name: 'Outro', tab: bars('e 6:0 6:0 6:3 6:0 q 6:5 6:3', 'w 6:0'), groove: 'stop', crash: true },
  ],
};

/** The boogie: root and fifth, then the root and sixth. Two strings, rock and roll since forever. */
const BOOGIE = (s: 6 | 5 | 4) => {
  const low = s;
  const high = s - 1;
  const c5 = `[${frets(low, high, 2)}=${ROOT[s]}5]`;
  const c6 = `[${frets(low, high, 4)}=${ROOT[s]}6]`;
  return `e ${c5} ${c5} ${c6} ${c6} ${c5} ${c5} ${c6} ${c6}`;
};
const ROOT = { 6: 'E', 5: 'A', 4: 'D' } as const;
/** Raw frets string with the low string open and the next string at `fret`. */
function frets(low: number, high: number, fret: number) {
  return [6, 5, 4, 3, 2, 1].map((s) => (s === low ? '0' : s === high ? String(fret) : 'x')).join('');
}
const BOOGIE_12 = bars(BOOGIE(6), BOOGIE(6), BOOGIE(6), BOOGIE(6), BOOGIE(5), BOOGIE(5), BOOGIE(6), BOOGIE(6), BOOGIE(4), BOOGIE(5), BOOGIE(6), 'q P6:0 r P5:0 r');

export const porchLightBoogie: Lesson = {
  id: 'sb-porch-light-boogie',
  title: 'Porch Light Boogie',
  band: 'Hollow Creek',
  kind: 'song',
  genre: 'blues',
  level: 2,
  style: 'Blues rock',
  summary: 'The twelve-bar blues with the boogie rhythm: two strings, two frets, endless groove.',
  skills: ['twelve-bar blues', 'boogie rhythm'],
  bpm: 104,
  tone: 'crunch',
  tips: [
    {
      title: 'The boogie',
      body: 'Play the open string with your **index on the 2nd fret** of the next string, twice. Then reach your **ring finger to the 4th fret**, twice. Back and forth. Keep the open string ringing under it.',
      figure: { type: 'fretboard', marks: [{ string: 6, fret: 0 }, { string: 5, fret: 2, label: '1' }, { string: 5, fret: 4, label: '3' }], caption: 'E5 to E6 on the low strings' },
    },
    {
      title: 'Twelve bars',
      body: 'Four bars on **E**, two on **A**, two on **E**, then **D**, **A**, **E** and a stop. That order is the twelve-bar blues, the backbone of rock and roll.',
    },
  ],
  sections: [
    { name: 'Intro', tab: bars('q 6:0 r 6:0 r', 'e 4:2 4:1 4:0 5:4 5:2 5:0 q 6:0'), groove: 'stop', bass: 'none', crash: true },
    { name: 'Chorus 1', tab: BOOGIE_12, groove: 'rock', bass: 'E E E E A A E E D A E E', crash: true },
    { name: 'Chorus 2', tab: BOOGIE_12, groove: 'drive', bass: 'E E E E A A E E D A E E', crash: true, fill: true },
    { name: 'Chorus 3', tab: BOOGIE_12, groove: 'rock', bass: 'E E E E A A E E D A E E', crash: true },
    { name: 'Outro', tab: bars('e 4:2 4:1 4:0 5:4 5:2 5:0 q 6:0', 'w P6:0'), groove: 'stop', crash: true },
  ],
};

export const kitchenTable: Lesson = {
  id: 'sb-kitchen-table',
  title: 'Kitchen Table',
  band: 'The Small Hours',
  kind: 'song',
  genre: 'acoustic',
  level: 2,
  style: 'Acoustic pop',
  summary: 'Made for the semi-acoustic: G, C, D and Em with the go-to strum. Four chords, a thousand songs.',
  skills: ['open chords', 'strumming', 'chord changes'],
  bpm: 80,
  tone: 'acoustic',
  tips: [
    {
      title: 'Four chords',
      body: 'G, C, D and Em. If a change is too slow, keep strumming anyway and land late: never stop the strumming hand.',
      figure: { type: 'chords', chords: ['G', 'C', 'D', 'Em'] },
    },
  ],
  sections: [
    { name: 'Intro', tab: bars('h [G]d [G]d', '[C]d [C]d', '[D]d [D]d', '[G]d [G]d'), groove: 'none', bass: 'G C D G' },
    { name: 'Verse', tab: bars(STRUM('G'), STRUM('C'), STRUM('G'), STRUM('D')), repeat: 2, groove: 'ballad', bass: 'G C G D', crash: true },
    { name: 'Chorus', tab: bars(STRUM('Em'), STRUM('C'), STRUM('G'), STRUM('D')), repeat: 2, groove: 'rockHalf', bass: 'E C G D', crash: true, fill: true },
    { name: 'Verse', tab: bars(STRUM('G'), STRUM('C'), STRUM('G'), STRUM('D')), groove: 'ballad', bass: 'G C G D' },
    { name: 'Chorus', tab: bars(STRUM('Em'), STRUM('C'), STRUM('G'), STRUM('D')), repeat: 2, groove: 'rockHalf', bass: 'E C G D', crash: true },
    { name: 'Outro', tab: bars('h [C]d [D]d', 'w [G]d'), groove: 'stop', bass: 'C G', crash: true },
  ],
};

// ── Level 3 ──────────────────────────────────────────────────────────────

const TRAIN_VERSE = bars(PM8('P6:0'), PM8('P6:0'), PM8('P5:0'), PM8('P6:3'));
const TRAIN_CHORUS = bars(E8('P5:0'), E8('P6:3'), E8('P6:0'), `e ${rep('P5:2', 4)} ${rep('P5:0', 4)}`);

export const lastTrainOut: Lesson = {
  id: 'sb-last-train-out',
  title: 'Last Train Out',
  band: 'The Station Rats',
  kind: 'song',
  genre: 'punk',
  level: 3,
  style: 'Skate punk',
  summary: 'Muted eighths that rumble like a train, then a chorus that throws the doors open.',
  skills: ['palm muting', 'eighth notes', 'dynamics'],
  bpm: 148,
  tone: 'punk',
  tips: [
    {
      title: 'Quiet, then loud',
      body: 'The verse is **palm muted**: tight and chugging. In the chorus lift your palm and let every chord ring. That jump in volume is what makes punk exciting.',
    },
    {
      title: 'All down-strokes',
      body: 'Pick every eighth note with a **down-stroke**. If your arm tires, start at 70% and let the wrist do the work, not the shoulder.',
    },
  ],
  sections: [
    { name: 'Intro', tab: bars('q P6:0 P6:0 P6:0 P6:0', 'P5:0 P5:0 P6:3 r'), repeat: 2, groove: 'skate', crash: true },
    { name: 'Verse', tab: TRAIN_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: TRAIN_CHORUS, repeat: 2, groove: 'skate', crash: true, fill: true },
    { name: 'Verse', tab: TRAIN_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: TRAIN_CHORUS, repeat: 2, groove: 'skate', crash: true },
    { name: 'Bridge', tab: bars('h P6:3 P5:0', 'P6:0 r', 'P6:3 P5:0', 'q P5:2 P5:2 P5:2 P5:2'), groove: 'rockHalf', fill: true },
    { name: 'Chorus', tab: TRAIN_CHORUS, repeat: 2, groove: 'skate', crash: true },
    { name: 'Outro', tab: bars('q P5:0 r P5:0 r', 'w P6:0'), groove: 'stop', crash: true },
  ],
};

const GRINDER_GALLOP = 'e 6:0pm s 6:0pm 6:0pm';
const GRINDER_RIFF = bars(`${GRINDER_GALLOP} ${GRINDER_GALLOP} q P6:3 P6:5`, `${GRINDER_GALLOP} ${GRINDER_GALLOP} q P6:6 P6:5`);
const GRINDER_CHORUS = bars('h P6:0 P6:5', 'P6:3 P6:1', 'P6:0 P6:5', 'w P6:7');

export const grinder: Lesson = {
  id: 'sb-grinder',
  title: 'Grinder',
  band: 'Rust Throne',
  kind: 'song',
  genre: 'metal',
  level: 3,
  style: 'Heavy metal',
  summary: 'Galloping open-E chugs answered by power chord stabs. The classic heavy metal engine.',
  skills: ['gallop', 'palm muting', 'power chords'],
  bpm: 104,
  tone: 'metal',
  tips: [
    {
      title: 'The gallop',
      body: 'One eighth and two sixteenths: **da-ga-da, da-ga-da**. Pick it down-down-up, or all down once you are fast. Keep it muted and tight.',
      figure: { type: 'tab', tab: `${GRINDER_GALLOP} ${GRINDER_GALLOP} q P6:3 P6:5 |`, caption: 'Two gallops, then G5 and A5' },
    },
  ],
  sections: [
    { name: 'Intro', tab: GRINDER_RIFF, repeat: 2, groove: 'tom', crash: true },
    { name: 'Riff', tab: GRINDER_RIFF, repeat: 2, groove: 'gallop' },
    { name: 'Chorus', tab: GRINDER_CHORUS, repeat: 2, groove: 'drive', crash: true, fill: true },
    { name: 'Riff', tab: GRINDER_RIFF, repeat: 2, groove: 'gallop' },
    { name: 'Chorus', tab: GRINDER_CHORUS, repeat: 2, groove: 'drive', crash: true },
    { name: 'Outro', tab: bars(`${GRINDER_GALLOP} ${GRINDER_GALLOP} q P6:0 r`, 'w P6:0'), groove: 'stop', crash: true },
  ],
};

const FLAT_TIRE_VERSE = bars(PM8('P6:5'), PM8('P6:8'), PM8('P5:7'), `e ${rep('P5:5pm', 4)} ${rep('P5:7pm', 4)}`);
const FLAT_TIRE_CHORUS = bars('q P6:5 P6:5 e P6:5 P6:8 q P6:8', 'P5:7 P5:7 e P5:7 P5:5 q P5:5', 'P6:5 P6:5 e P6:5 P6:8 q P6:8', 'h P5:7 P5:7');

export const flatTireSummer: Lesson = {
  id: 'sb-flat-tire-summer',
  title: 'Flat Tire Summer',
  band: 'Backyard Ramps',
  kind: 'song',
  genre: 'pop-punk',
  level: 3,
  style: 'Pop-punk',
  summary: 'A sunny four-chord singalong higher up the neck, with a syncopated chorus push.',
  skills: ['movable power chords', 'palm muting', 'syncopation'],
  bpm: 152,
  tone: 'punk',
  tips: [
    {
      title: 'Up the neck',
      body: 'The chords are **A5** (low E, 5th fret), **C5** (low E, 8th fret), **E5** (A string, 7th fret) and **D5** (A string, 5th fret). Look at the fret dots: the 5th and 7th frets have one dot each.',
    },
    {
      title: 'The push',
      body: 'In the chorus the chord changes **half a beat early**, on the "and". Count "1, 2, 3 and 4" and change on the "and".',
    },
  ],
  sections: [
    { name: 'Intro', tab: FLAT_TIRE_CHORUS, groove: 'skate', crash: true },
    { name: 'Verse', tab: FLAT_TIRE_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: FLAT_TIRE_CHORUS, repeat: 2, groove: 'skate', crash: true, fill: true },
    { name: 'Verse', tab: FLAT_TIRE_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: FLAT_TIRE_CHORUS, repeat: 2, groove: 'skate', crash: true },
    { name: 'Outro', tab: bars('q P6:5 r P6:8 r', 'w P6:5'), groove: 'stop', crash: true },
  ],
};
