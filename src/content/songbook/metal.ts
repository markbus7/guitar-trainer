import type { Lesson } from '../types';
import { bars, rep } from './helpers';

/** Metal: palm-muted chugs, gallops, Drop D and a shred solo. All original. */

/** One beat of gallop: an eighth and two sixteenths on the open low string. */
const GALLOP = 'e 6:0pm s 6:0pm 6:0pm';

const WATER_RIFF = bars('e 6:0pm 6:0pm q 6:0pm e 6:0pm 6:0pm q 6:3', 'e 6:0pm 6:0pm q 6:0pm e 6:5 6:3 q 6:0');
const WATER_CHORUS = bars('h P6:0 P6:3', 'P6:5 P6:3', 'P6:0 P6:3', 'w P6:1');

export const heavyWater: Lesson = {
  id: 'sb-heavy-water',
  title: 'Heavy Water',
  band: 'The Lead Weights',
  kind: 'song',
  genre: 'metal',
  level: 2,
  style: 'Doom metal',
  summary: 'Slow, heavy and easy to start with: low E chugs, three notes on one string and a chorus of long power chords.',
  skills: ['palm muting', 'low E riffs', 'power chords'],
  bpm: 96,
  tone: 'metal',
  mode: 'practice',
  tips: [
    {
      title: 'Chug, don’t ring',
      body: 'Rest the side of your picking hand on the strings right at the bridge for the **pm** notes. They should sound tight and chunky, not ringing.',
      figure: { type: 'art', art: 'palm-mute' },
    },
  ],
  sections: [
    { name: 'Intro', tab: WATER_RIFF, repeat: 2, groove: 'tom', crash: true },
    { name: 'Verse', tab: WATER_RIFF, repeat: 4, groove: 'metal' },
    { name: 'Chorus', tab: WATER_CHORUS, repeat: 2, groove: 'rockHalf', crash: true, fill: true },
    { name: 'Verse', tab: WATER_RIFF, repeat: 4, groove: 'metal' },
    { name: 'Chorus', tab: WATER_CHORUS, repeat: 2, groove: 'rockHalf', crash: true },
    { name: 'Breakdown', tab: bars('q 6:0pm r 6:0pm r', '6:0pm 6:0pm r r'), repeat: 2, groove: 'stop', fill: true },
    { name: 'Chorus', tab: WATER_CHORUS, repeat: 2, groove: 'rockHalf', crash: true },
    { name: 'Outro', tab: bars('w P6:0', 'P6:0'), groove: 'stop', crash: true },
  ],
};

const SKY_A = bars(`e ${rep('6:0pm', 4)} q P6:3 P6:5`, `e ${rep('6:0pm', 4)} q P6:6 P6:5`);
const SKY_B = bars('e 6:0pm 6:0pm P6:1 6:0pm 6:0pm P6:3 6:0pm 6:0pm', 'q P6:5 P6:3 h P6:1');
const SKY_CHORUS = bars('h P6:0 P6:3', 'P6:5 q P6:6 P6:5', 'h P6:0 P6:3', 'w P6:1');

export const coldIronSky: Lesson = {
  id: 'sb-cold-iron-sky',
  title: 'Cold Iron Sky',
  band: 'Saltwolf',
  kind: 'song',
  genre: 'metal',
  level: 3,
  style: 'Heavy metal',
  summary: 'Chugs answered by power chords, a dark half-step riff and a chorus that rings out over the drums.',
  skills: ['palm muting', 'power chords', 'chromatic moves'],
  bpm: 120,
  tone: 'metal',
  tips: [
    {
      title: 'The dark half step',
      body: 'F5 at the **1st fret** right next to the open E is what makes this riff sound evil. Keep the open chugs palm muted and lift your palm for the power chords.',
    },
  ],
  sections: [
    { name: 'Intro', tab: SKY_A, repeat: 2, groove: 'tom', crash: true },
    { name: 'Riff', tab: SKY_A, repeat: 2, groove: 'metal', crash: true },
    { name: 'Verse', tab: SKY_B, repeat: 4, groove: 'metal' },
    { name: 'Chorus', tab: SKY_CHORUS, repeat: 2, groove: 'drive', crash: true, fill: true },
    { name: 'Riff', tab: SKY_A, repeat: 2, groove: 'metal', crash: true },
    { name: 'Verse', tab: SKY_B, repeat: 4, groove: 'metal' },
    { name: 'Chorus', tab: SKY_CHORUS, repeat: 2, groove: 'drive', crash: true },
    { name: 'Breakdown', tab: bars('q 6:0pm r 6:0pm 6:0pm', 'r 6:0pm 6:0pm r'), repeat: 4, groove: 'rockHalf', crash: true, fill: true },
    { name: 'Chorus', tab: SKY_CHORUS, repeat: 2, groove: 'drive', crash: true },
    { name: 'Outro', tab: bars('q P6:1 r P6:1 r', 'w P6:0'), groove: 'stop', crash: true },
  ],
};

const CROWN_A = bars(`${GALLOP} ${GALLOP} q PD6:3 PD6:5`, `${GALLOP} ${GALLOP} q PD6:6 PD6:5`);
const CROWN_B = bars('e PD6:0 6:0pm 6:0pm PD6:1 6:0pm 6:0pm PD6:3 PD6:1', 'q PD6:0 PD6:5 h PD6:6');
const CROWN_CHORUS = bars('h PD6:0 PD6:5', 'PD6:3 q PD6:1 PD6:3', 'h PD6:0 PD6:5', 'w PD6:6');

export const crownless: Lesson = {
  id: 'sb-crownless',
  title: 'Crownless',
  band: 'Grave Tide',
  kind: 'song',
  genre: 'metal',
  level: 4,
  style: 'Groove metal',
  summary: 'Drop D gallops, one-finger power chords sliding along the low string and a pounding breakdown.',
  skills: ['drop D', 'gallop', 'one-finger power chords'],
  bpm: 138,
  tuning: 'dropD',
  tone: 'metal',
  tips: [
    {
      title: 'Tune down to Drop D',
      body: 'Lower only the **low E string** to **D**. Open the tuner from this screen and match it before you start.',
      figure: { type: 'art', art: 'drop-d' },
    },
    {
      title: 'One finger, three strings',
      body: 'In Drop D, a power chord is just **one finger** laid flat across the bottom three strings at the same fret. Slide it between the frets and keep the open chugs muted.',
    },
  ],
  sections: [
    { name: 'Intro', tab: bars('w PD6:0', 'PD6:5', 'PD6:3', 'h PD6:1 PD6:0'), groove: 'rockHalf', crash: true, fill: true },
    { name: 'Riff', tab: CROWN_A, repeat: 2, groove: 'gallop', crash: true },
    { name: 'Verse', tab: CROWN_B, repeat: 4, groove: 'metal' },
    { name: 'Chorus', tab: CROWN_CHORUS, repeat: 2, groove: 'drive', crash: true, fill: true },
    { name: 'Riff', tab: CROWN_A, repeat: 2, groove: 'gallop', crash: true },
    { name: 'Verse', tab: CROWN_B, repeat: 4, groove: 'metal' },
    { name: 'Chorus', tab: CROWN_CHORUS, repeat: 2, groove: 'drive', crash: true },
    { name: 'Breakdown', tab: bars('q PD6:0 r PD6:0 PD6:0', 'r PD6:0 e PD6:0 PD6:0 q PD6:0'), repeat: 4, groove: 'rockHalf', crash: true, fill: true },
    { name: 'Riff', tab: CROWN_A, repeat: 2, groove: 'gallop', crash: true },
    { name: 'Outro', tab: bars('q PD6:0 r PD6:0 r', 'w PD6:0'), groove: 'stop', crash: true },
  ],
};

const STEEL_A = bars(`${GALLOP} ${GALLOP} ${GALLOP} q P6:5`, `${GALLOP} ${GALLOP} q P6:3 P6:6`);
const STEEL_B = bars('e 6:0 6:0 6:5 6:0 6:6 6:0 6:5 6:3', 'e 6:0 6:0 5:2 6:0 5:3 6:0 5:2 6:5');
const STEEL_CHORUS = bars('q P6:0 e P6:0 P6:3 q P6:5 e P6:5 P6:3', 'q P6:6 e P6:6 P6:5 h P6:3');

export const steelHorizon: Lesson = {
  id: 'sb-steel-horizon',
  title: 'Steel Horizon',
  band: 'Thunder Foundry',
  kind: 'song',
  genre: 'metal',
  level: 5,
  style: 'Speed metal',
  summary: 'The full metal workout: fast gallops, a pedal-point riff, a big chorus and a pentatonic solo at the 12th fret.',
  skills: ['gallop', 'pedal-point riffs', 'solo', 'bends'],
  bpm: 168,
  tone: 'metal',
  tips: [
    {
      title: 'Pedal point',
      body: 'The verse riff keeps coming back to the **open low E** between every fretted note. Let the open string do the work and only think about the fretted notes.',
    },
    {
      title: 'The solo box',
      body: 'The solo lives in the E minor pentatonic box at the **12th fret**. Bend the 14th fret on the G string and the 15th fret on the B string up a whole step.',
      figure: {
        type: 'fretboard',
        frets: [11, 16],
        marks: [
          { string: 6, fret: 12, root: true },
          { string: 6, fret: 15 },
          { string: 5, fret: 12 },
          { string: 5, fret: 14 },
          { string: 4, fret: 12 },
          { string: 4, fret: 14, root: true },
          { string: 3, fret: 12 },
          { string: 3, fret: 14 },
          { string: 2, fret: 12 },
          { string: 2, fret: 15 },
          { string: 1, fret: 12, root: true },
          { string: 1, fret: 15 },
        ],
      },
    },
  ],
  sections: [
    { name: 'Intro', tab: bars('w P6:0', 'P6:3', 'P6:5', 'h P6:6 P6:5'), groove: 'rockHalf', crash: true, fill: true },
    { name: 'Riff', tab: STEEL_A, repeat: 2, groove: 'gallop', crash: true },
    { name: 'Verse', tab: STEEL_B, repeat: 4, groove: 'thrash' },
    { name: 'Chorus', tab: STEEL_CHORUS, repeat: 2, groove: 'metal', crash: true, fill: true },
    { name: 'Riff', tab: STEEL_A, repeat: 2, groove: 'gallop', crash: true },
    { name: 'Verse', tab: STEEL_B, repeat: 4, groove: 'thrash' },
    { name: 'Chorus', tab: STEEL_CHORUS, repeat: 2, groove: 'metal', crash: true },
    {
      name: 'Solo',
      tab: bars(
        'e 1:12 1:15 2:12 2:15 q 3:14b2 3:12',
        'e 3:14 p3:12 4:14 4:12 q 5:12 /5:14',
        'e 1:15 1:12 1:15 1:12 q 2:15b2 2:12',
        'e 3:14 3:12 4:14 4:12 h 6:12~',
      ),
      repeat: 2,
      groove: 'metal',
      bass: 'E E C D',
      backing: 'Em Em C D',
      crash: true,
      fill: true,
    },
    { name: 'Chorus', tab: STEEL_CHORUS, repeat: 2, groove: 'metal', crash: true },
    { name: 'Outro', tab: bars('q P6:0 r P6:0 r', 'w P6:0'), groove: 'stop', crash: true },
  ],
};
