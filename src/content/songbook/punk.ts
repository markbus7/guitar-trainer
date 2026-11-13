import type { Lesson } from '../types';
import { bars, E44, E8, PM8, rep } from './helpers';

/** Punk and pop-punk: power chords, palm mutes and down-strokes. All original. */

const RIOT_VERSE = bars('q P6:0 P6:0 P6:0 P6:0', 'P6:0 P6:0 P6:0 P6:0', 'P5:0 P5:0 P5:0 P5:0', 'P6:0 P6:0 P6:0 r');
const RIOT_CHORUS = bars('q P5:0 P5:0 P5:0 P5:0', 'P6:0 P6:0 P6:0 P6:0', 'P5:0 P5:0 P5:0 P5:0', 'h P6:0 P6:0');

export const twoChordRiot: Lesson = {
  id: 'sb-two-chord-riot',
  title: 'Two-Chord Riot',
  band: 'The Loose Laces',
  kind: 'song',
  genre: 'punk',
  level: 1,
  style: 'Punk',
  summary: 'Two power chords, one finger each, and a lot of attitude. The perfect first punk song.',
  skills: ['E5 and A5', 'quarter notes', 'down-strokes'],
  bpm: 116,
  tone: 'punk',
  mode: 'practice',
  tips: [
    {
      title: 'One finger per chord',
      body: '**E5**: one finger on the 2nd fret of the A string, strum the low E and A strings. **A5**: the same finger moves down to the 2nd fret of the D string, strum the A and D strings.',
      figure: { type: 'chords', chords: ['E5', 'A5'] },
    },
  ],
  sections: [
    { name: 'Intro', tab: bars('h P6:0 P6:0', 'P5:0 P5:0'), repeat: 2, groove: 'rockHalf', crash: true },
    { name: 'Verse', tab: RIOT_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: RIOT_CHORUS, repeat: 2, groove: 'skate', crash: true, fill: true },
    { name: 'Verse', tab: RIOT_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: RIOT_CHORUS, repeat: 2, groove: 'skate', crash: true },
    { name: 'Outro', tab: bars('q P6:0 r P6:0 r', 'w P6:0'), groove: 'stop', crash: true },
  ],
};

export const garageAnthem: Lesson = {
  id: 'sb-garage-anthem',
  title: 'Garage Anthem',
  band: 'The Basement Kids',
  kind: 'song',
  genre: 'punk',
  level: 2,
  style: 'Punk',
  summary: 'Four open power chords, all quarter notes. Loud, simple and a lot of fun.',
  skills: ['open power chords', 'quarter notes', 'down-strokes'],
  bpm: 132,
  tone: 'punk',
  tips: [
    {
      title: 'Only the bottom strings',
      body: 'Every chord here is a two-string power chord that starts on an open string or the 3rd fret. Aim your pick at the **low strings only** and let the side of your hand rest on the rest.',
    },
  ],
  sections: [
    { name: 'Intro', tab: bars('q P6:0 P6:0 P6:0 P6:0', 'P5:0 P5:0 P4:0 P4:0'), repeat: 2, groove: 'punk', crash: true },
    { name: 'Verse', tab: bars('q P6:0 P6:0 P6:0 P6:0', 'P6:3 P6:3 P5:0 P5:0', 'P6:0 P6:0 P6:0 P6:0', 'P6:3 P6:3 P4:0 P4:0'), repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: bars('h P5:0 P4:0', 'P6:3 P6:0', 'P5:0 P4:0', 'q P6:3 P6:3 P6:0 r'), repeat: 2, groove: 'skate', crash: true, fill: true },
    { name: 'Verse', tab: bars('q P6:0 P6:0 P6:0 P6:0', 'P6:3 P6:3 P5:0 P5:0', 'P6:0 P6:0 P6:0 P6:0', 'P6:3 P6:3 P4:0 P4:0'), repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: bars('h P5:0 P4:0', 'P6:3 P6:0', 'P5:0 P4:0', 'q P6:3 P6:3 P6:0 r'), repeat: 2, groove: 'skate', crash: true },
    { name: 'Bridge', tab: bars('w P6:3', 'P5:0', 'P6:0', 'P6:0'), groove: 'rockHalf', fill: true },
    { name: 'Chorus', tab: bars('h P5:0 P4:0', 'P6:3 P6:0', 'P5:0 P4:0', 'q P6:3 P6:3 P6:0 r'), repeat: 2, groove: 'skate', crash: true },
    { name: 'Outro', tab: bars('q P6:0 r P6:0 r', 'w P6:0'), groove: 'stop', crash: true },
  ],
};

export const summerStatic: Lesson = {
  id: 'sb-summer-static',
  title: 'Summer Static',
  band: 'The Polaroid Hearts',
  kind: 'song',
  genre: 'pop-punk',
  level: 2,
  style: 'Pop-punk',
  summary: 'The four-chord pop-punk progression, slow enough to learn the moves up the neck.',
  skills: ['movable power chords', 'chord changes'],
  bpm: 140,
  tone: 'punk',
  tips: [
    {
      title: 'One shape, four places',
      body: 'D5, A5, B5 and G5 all use the **same two-finger shape**. Keep your hand locked in that shape and slide it between the 5th, 7th and 3rd frets.',
      figure: { type: 'chords', chords: ['D5m', 'A5m', 'G5'] },
    },
  ],
  sections: [
    { name: 'Intro', tab: bars('h P5:5 P6:5', 'P6:7 P6:3'), repeat: 2, groove: 'rockHalf', crash: true },
    { name: 'Verse', tab: bars('q P5:5 P5:5 P5:5 P5:5', 'P6:5 P6:5 P6:5 P6:5', 'P6:7 P6:7 P6:7 P6:7', 'P6:3 P6:3 P6:3 P6:3'), repeat: 2, groove: 'drive' },
    { name: 'Chorus', tab: bars('q P5:5 P5:5 P6:5 P6:5', 'P6:7 P6:7 P6:3 P6:3'), repeat: 4, groove: 'skate', crash: true, fill: true },
    { name: 'Verse', tab: bars('q P5:5 P5:5 P5:5 P5:5', 'P6:5 P6:5 P6:5 P6:5', 'P6:7 P6:7 P6:7 P6:7', 'P6:3 P6:3 P6:3 P6:3'), repeat: 2, groove: 'drive' },
    { name: 'Chorus', tab: bars('q P5:5 P5:5 P6:5 P6:5', 'P6:7 P6:7 P6:3 P6:3'), repeat: 4, groove: 'skate', crash: true },
    { name: 'Bridge', tab: bars('w P6:7', 'P6:3', 'P5:5', 'P6:5'), groove: 'rockHalf', fill: true },
    { name: 'Chorus', tab: bars('q P5:5 P5:5 P6:5 P6:5', 'P6:7 P6:7 P6:3 P6:3'), repeat: 4, groove: 'skate', crash: true },
    { name: 'Outro', tab: bars('q P5:5 P5:5 P5:5 r', 'w P5:5'), groove: 'stop', crash: true },
  ],
};

const SKATE_HOOK = bars('e O5:7 O5:7 O5:7 O5:7 q O5:9 O5:7', 'e O5:4 O5:4 O5:4 O5:4 q O5:2 O5:4');
const SKATE_VERSE = bars(PM8('P6:0'), PM8('P5:2'), PM8('P5:4'), PM8('P5:0'));
const SKATE_CHORUS = bars(E44('P6:0', 'P5:2'), E44('P5:4', 'P5:0'));
const SKATE_PRE = bars('q P5:0 r P5:0 r', 'q P5:2 r e P5:2 P5:2 P5:2 P5:2');

export const skateboardSunday: Lesson = {
  id: 'sb-skateboard-sunday',
  title: 'Skateboard Sunday',
  band: 'Kickflip Club',
  kind: 'song',
  genre: 'pop-punk',
  level: 3,
  style: 'Pop-punk',
  summary: 'An octave hook, palm-muted verses and a chorus that opens up. Classic sunny pop-punk.',
  skills: ['octaves', 'palm muting', 'eighth notes'],
  bpm: 156,
  tone: 'punk',
  tips: [
    {
      title: 'The octave hook',
      body: 'Fret the root on the A string with your **index** and the octave two strings up with your **ring finger**. The string in between must stay silent: let the index finger lean on it.',
    },
    {
      title: 'Mute, then explode',
      body: 'Verses are **palm muted**; the chorus is played open. Lift your palm off the bridge right on the first chorus chord and the song jumps out of the speakers.',
    },
  ],
  sections: [
    { name: 'Hook', tab: SKATE_HOOK, repeat: 2, groove: 'skate', crash: true },
    { name: 'Verse', tab: SKATE_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Pre-chorus', tab: SKATE_PRE, groove: 'stop', fill: true },
    { name: 'Chorus', tab: SKATE_CHORUS, repeat: 4, groove: 'skate', crash: true },
    { name: 'Verse', tab: SKATE_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Pre-chorus', tab: SKATE_PRE, groove: 'stop', fill: true },
    { name: 'Chorus', tab: SKATE_CHORUS, repeat: 4, groove: 'skate', crash: true },
    { name: 'Hook', tab: SKATE_HOOK, repeat: 2, groove: 'skate', crash: true },
    { name: 'Chorus', tab: SKATE_CHORUS, repeat: 4, groove: 'skate', crash: true },
    { name: 'Outro', tab: bars('q P6:0 r P6:0 r', 'w P6:0'), groove: 'stop', crash: true },
  ],
};

const BUS_VERSE = bars(PM8('P6:5'), PM8('P6:1'), PM8('P5:3'), PM8('P6:3'));
const BUS_CHORUS = bars(E44('P6:5', 'P6:1'), E44('P5:3', 'P6:3'));

export const lateBusHome: Lesson = {
  id: 'sb-late-bus-home',
  title: 'Late Bus Home',
  band: 'Northbound Nine',
  kind: 'song',
  genre: 'pop-punk',
  level: 3,
  style: 'Pop-punk',
  summary: 'A bittersweet minor-key progression with muted verses and a stop-start bridge.',
  skills: ['palm muting', 'power chords', 'stops'],
  bpm: 148,
  tone: 'punk',
  tips: [
    {
      title: 'The F5 stretch',
      body: 'F5 sits at the **1st fret**, where the frets are widest. Press with the tip of your index finger right behind the fret and keep your thumb low behind the neck.',
    },
  ],
  sections: [
    { name: 'Intro', tab: bars(E8('P6:5'), E8('P6:1'), E8('P5:3'), E8('P6:3')), groove: 'skate', crash: true },
    { name: 'Verse', tab: BUS_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: BUS_CHORUS, repeat: 4, groove: 'skate', crash: true, fill: true },
    { name: 'Verse', tab: BUS_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: BUS_CHORUS, repeat: 4, groove: 'skate', crash: true },
    { name: 'Bridge', tab: bars('q P6:1 r P6:1 r', 'P5:3 r P5:3 r', 'P6:3 r P6:3 r', E8('P6:3')), groove: 'stop', fill: true },
    { name: 'Chorus', tab: BUS_CHORUS, repeat: 4, groove: 'skate', crash: true },
    { name: 'Outro', tab: bars('q P6:5 r P6:5 r', 'w P6:5'), groove: 'stop', crash: true },
  ],
};

const NEON_HOOK = bars('e O6:3 O6:3 O6:5 O6:3 q O6:7 O6:5', 'e O6:3 O6:3 O6:5 O6:3 q O6:10 O6:8');
const NEON_VERSE = bars(PM8('P6:3'), PM8('P5:5'), PM8('P5:7'), PM8('P5:3'));
const NEON_PRE = bars('q P6:3 r P6:3 r', 'P5:5 r P5:5 P5:5');
const NEON_CHORUS = bars(E44('P6:3', 'P5:5'), E44('P5:7', 'P5:3'));

export const neonYouth: Lesson = {
  id: 'sb-neon-youth',
  title: 'Neon Youth',
  band: 'Rooftop Riot',
  kind: 'song',
  genre: 'pop-punk',
  level: 4,
  style: 'Pop-punk',
  summary: 'Fast, bright and relentless: an octave lead, muted verses, a half-time bridge and a huge last chorus.',
  skills: ['octaves', 'fast down-strokes', 'palm muting'],
  bpm: 184,
  tone: 'punk',
  tips: [
    {
      title: 'Down-strokes at speed',
      body: 'At 184 bpm, all-down-strokes is a workout. Keep the motion **small** and from the wrist. Start at 70% and let your arm learn it before you chase full speed.',
    },
  ],
  sections: [
    { name: 'Hook', tab: NEON_HOOK, repeat: 2, groove: 'skate', crash: true },
    { name: 'Verse', tab: NEON_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Pre-chorus', tab: NEON_PRE, groove: 'stop', fill: true },
    { name: 'Chorus', tab: NEON_CHORUS, repeat: 4, groove: 'skate', crash: true },
    { name: 'Hook', tab: NEON_HOOK, groove: 'skate', crash: true },
    { name: 'Verse', tab: NEON_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Pre-chorus', tab: NEON_PRE, groove: 'stop', fill: true },
    { name: 'Chorus', tab: NEON_CHORUS, repeat: 4, groove: 'skate', crash: true },
    { name: 'Bridge', tab: bars('h P5:7 P5:3', 'P6:3 P5:5'), repeat: 2, groove: 'rockHalf' },
    { name: 'Build', tab: bars('q P5:5 r P5:5 r', E8('P5:5')), groove: 'stop', fill: true },
    { name: 'Chorus', tab: NEON_CHORUS, repeat: 4, groove: 'skate', crash: true },
    { name: 'Outro', tab: bars('q P6:3 P6:3 P6:3 r', 'w P6:3'), groove: 'stop', crash: true },
  ],
};

const VEL_VERSE = bars(PM8('P6:0'), PM8('P6:0'), PM8('P6:3'), E44('P6:5', 'P6:3'));
const VEL_CHORUS = bars(E44('P5:3', 'P5:5'), E8('P6:0'), E44('P5:3', 'P5:5'), E44('P6:5', 'P6:3'));

export const velocity: Lesson = {
  id: 'sb-velocity',
  title: 'Velocity',
  band: 'Redline Rats',
  kind: 'song',
  genre: 'punk',
  level: 5,
  style: 'Hardcore punk',
  summary: 'Two hundred beats per minute of down-picked power chords. Short, fast and exhausting in the best way.',
  skills: ['speed', 'down-strokes', 'palm muting'],
  bpm: 200,
  tone: 'punk',
  tips: [
    {
      title: 'Build up to it',
      body: 'Play it at 50%, then 70%, then 85%. Speed comes from **relaxed** muscles: if your forearm burns, shake it out and slow down.',
    },
  ],
  sections: [
    { name: 'Intro', tab: bars(E8('P6:0'), E44('P6:3', 'P6:5')), repeat: 2, groove: 'skate', crash: true },
    { name: 'Verse', tab: VEL_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: VEL_CHORUS, repeat: 2, groove: 'skate', crash: true, fill: true },
    { name: 'Verse', tab: VEL_VERSE, repeat: 2, groove: 'punk' },
    { name: 'Chorus', tab: VEL_CHORUS, repeat: 2, groove: 'skate', crash: true },
    { name: 'Breakdown', tab: bars('q P6:0 r P6:0 r', `e ${rep('P6:0', 4)} q P6:3 P6:5`), repeat: 2, groove: 'stop', fill: true },
    { name: 'Verse', tab: VEL_VERSE, groove: 'punk' },
    { name: 'Chorus', tab: VEL_CHORUS, repeat: 2, groove: 'skate', crash: true },
    { name: 'Outro', tab: bars('q P6:0 P6:0 P6:0 r', 'w P6:0'), groove: 'stop', crash: true },
  ],
};
