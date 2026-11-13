import type { Lesson } from '../types';
import { bars, rep } from './helpers';

/** Rock and blues rock: open-string riffs, power chords, hammer-ons and first solos. All original. */

const ROAD_VERSE = bars('q 6:0 6:0 6:0 6:0', '5:0 5:0 5:0 5:0', '6:0 6:0 6:0 6:0', '4:0 4:0 5:0 5:0');
const ROAD_CHORUS = bars('h 5:0 5:0', '4:0 4:0', '6:0 6:0', 'q 5:0 5:0 6:0 6:0');

export const openRoad: Lesson = {
  id: 'sb-open-road',
  title: 'Open Road',
  band: 'The Backroad Bandits',
  kind: 'song',
  genre: 'rock',
  level: 1,
  style: 'Rock',
  summary: 'Three open strings and a steady beat. Your first full song with a band, no fretting needed.',
  skills: ['open strings', 'quarter notes', 'counting'],
  bpm: 84,
  tone: 'crunch',
  mode: 'practice',
  tips: [
    {
      title: 'Count along',
      body: 'Every note lands on a beat: count **1, 2, 3, 4** out loud with the drums. Half notes in the chorus last two beats, so let them ring.',
    },
  ],
  sections: [
    { name: 'Intro', tab: bars('q 6:0 6:0 6:0 6:0', '6:0 6:0 5:0 5:0'), repeat: 2, groove: 'rockHalf', crash: true },
    { name: 'Verse', tab: ROAD_VERSE, repeat: 2, groove: 'rock' },
    { name: 'Chorus', tab: ROAD_CHORUS, repeat: 2, groove: 'drive', crash: true, fill: true },
    { name: 'Verse', tab: ROAD_VERSE, repeat: 2, groove: 'rock' },
    { name: 'Chorus', tab: ROAD_CHORUS, repeat: 2, groove: 'drive', crash: true },
    { name: 'Outro', tab: bars('q 6:0 5:0 4:0 5:0', 'w 6:0'), groove: 'stop', crash: true },
  ],
};

const SPEAKER_RIFF = bars('e 6:0 6:0 q 6:3 e 6:0 6:0 q 6:5', 'e 6:0 6:0 q 6:3 e 6:5 6:3 q 6:0');
const SPEAKER_CHORUS = bars('q P5:0 P5:0 P5:0 e P5:0 P6:3', 'h P6:3 q P6:3 r', 'q P5:5 P5:5 P5:5 e P5:5 P6:0', 'h P6:0 q P6:0 r');

export const brokenSpeakers: Lesson = {
  id: 'sb-broken-speakers',
  title: 'Broken Speakers',
  band: 'Static Kings',
  kind: 'song',
  genre: 'rock',
  level: 3,
  style: 'Hard rock',
  summary: 'A swaggering low-E riff, a chorus of big power chords and a pentatonic break.',
  skills: ['single-note riffs', 'power chords', 'minor pentatonic'],
  bpm: 112,
  tone: 'crunch',
  tips: [
    {
      title: 'The riff lives on one string',
      body: 'The main riff stays on the **low E string**: open, 3rd fret and 5th fret. Use your index for the 3rd fret and your ring finger for the 5th.',
    },
  ],
  sections: [
    { name: 'Riff', tab: SPEAKER_RIFF, repeat: 2, groove: 'rock', crash: true },
    { name: 'Verse', tab: SPEAKER_RIFF, repeat: 4, groove: 'rock' },
    { name: 'Chorus', tab: SPEAKER_CHORUS, repeat: 2, groove: 'drive', crash: true, fill: true },
    { name: 'Verse', tab: SPEAKER_RIFF, repeat: 4, groove: 'rock' },
    { name: 'Chorus', tab: SPEAKER_CHORUS, repeat: 2, groove: 'drive', crash: true },
    { name: 'Break', tab: bars('e 6:0 6:3 5:0 5:2 4:0 4:2 q 5:0', 'e 5:2 5:0 6:3 6:0 q 6:3 6:0'), repeat: 2, groove: 'rock', fill: true },
    { name: 'Chorus', tab: SPEAKER_CHORUS, repeat: 2, groove: 'drive', crash: true },
    { name: 'Outro', tab: bars('q P6:0 r P6:0 r', 'w P6:0'), groove: 'stop', crash: true },
  ],
};

// A boogie: the root plus a fifth that rocks up to a sixth, eighth notes.
const BOOGIE = (root: 'E' | 'A' | 'D') => {
  const five = root === 'E' ? '[02xxxx=E5]' : root === 'A' ? '[x02xxx=A5]' : '[xx02xx=D5]';
  const six = root === 'E' ? '[04xxxx=E6]' : root === 'A' ? '[x04xxx=A6]' : '[xx04xx=D6]';
  return `e ${rep(five, 2)} ${rep(six, 2)} ${rep(five, 2)} ${rep(six, 2)}`;
};
const TWELVE_BAR = bars(
  BOOGIE('A'), BOOGIE('A'), BOOGIE('A'), BOOGIE('A'),
  BOOGIE('D'), BOOGIE('D'), BOOGIE('A'), BOOGIE('A'),
  BOOGIE('E'), BOOGIE('D'), BOOGIE('A'), BOOGIE('E'),
);

export const dustAndDiesel: Lesson = {
  id: 'sb-dust-and-diesel',
  title: 'Dust & Diesel',
  band: 'The Rust Belt Revival',
  kind: 'song',
  genre: 'blues',
  level: 3,
  style: 'Blues rock',
  summary: 'A twelve-bar boogie in A with a pentatonic solo break. The rhythm behind a thousand rock songs.',
  skills: ['12-bar blues', 'boogie rhythm', 'minor pentatonic'],
  bpm: 104,
  tone: 'crunch',
  tips: [
    {
      title: 'The boogie move',
      body: 'Hold the 2nd fret with your **index** and reach two frets further with your **ring finger** to turn the fifth into a sixth. Index stays down the whole time: only the ring finger moves.',
    },
    {
      title: 'Twelve bars',
      body: 'Four bars of A, two of D, two of A, then E, D, A, E. Once you feel it, you will hear this shape everywhere in rock and blues.',
    },
  ],
  sections: [
    { name: 'Intro', tab: TWELVE_BAR, groove: 'drive', crash: true, fill: true },
    { name: 'Verse', tab: TWELVE_BAR, groove: 'rock', fill: true },
    {
      name: 'Solo',
      tab: bars('e 2:5 2:8 3:5 3:7 q 3:7b2 3:5', 'e 4:7 4:5 5:7 5:5 q 6:5 r', 'q 2:5 e 2:8 2:5 q 3:7 3:5', 'e 4:7 h4:9 4:7 4:5 h 5:7'),
      repeat: 2,
      groove: 'drive',
      bass: 'A A D A',
      backing: 'A7 A7 D7 A7',
      crash: true,
    },
    { name: 'Verse', tab: TWELVE_BAR, groove: 'rock', crash: true, fill: true },
    { name: 'Outro', tab: bars(`e ${rep('[x02xxx=A5]', 2)} ${rep('[x04xxx=A6]', 2)} q [x02xxx=A5] r`, 'w [x02xxx=A5]'), groove: 'stop', crash: true },
  ],
};

const FIRE_RIFF = bars('e 5:0 h5:3 5:0 4:2 h4:5 4:2 q 5:3', 'e 5:0 h5:3 5:0 4:2 q 5:3 5:0');
const FIRE_CHORUS = bars('q P5:0 P5:0 e P5:0 P5:3 q P5:3', 'q P6:3 P6:3 e P6:3 P5:5 q P5:5');

export const wildfireSeason: Lesson = {
  id: 'sb-wildfire-season',
  title: 'Wildfire Season',
  band: 'Ember & Ash',
  kind: 'song',
  genre: 'rock',
  level: 4,
  style: 'Rock',
  summary: 'A hammer-on riff in A minor, a driving chorus and a full guitar solo with bends and a slide.',
  skills: ['hammer-ons', 'bends', 'solo'],
  bpm: 124,
  tone: 'lead',
  tips: [
    {
      title: 'Hammer, don’t pick',
      body: 'In the riff, pick the open string and **hammer** your finger onto the fret without picking again. Hit it hard and fast so the note keeps ringing.',
    },
    {
      title: 'Bend in tune',
      body: 'A full bend raises the note **two frets**. Push with three fingers together and listen: the highway shows when you hit the target.',
    },
  ],
  sections: [
    { name: 'Riff', tab: FIRE_RIFF, repeat: 2, groove: 'rock', crash: true },
    { name: 'Verse', tab: FIRE_RIFF, repeat: 4, groove: 'rock' },
    { name: 'Chorus', tab: FIRE_CHORUS, repeat: 4, groove: 'drive', crash: true, fill: true },
    { name: 'Verse', tab: FIRE_RIFF, repeat: 4, groove: 'rock' },
    { name: 'Chorus', tab: FIRE_CHORUS, repeat: 4, groove: 'drive', crash: true },
    {
      name: 'Solo',
      tab: bars('e 1:5 1:8 2:5 2:8 q 3:7b2 3:5', 'e 3:7 p3:5 4:7 4:5 q 4:7 /4:9', 'q 2:8b2 e 2:8 2:5 q 3:7 3:5', 'e 4:7 4:5 5:7 5:5 h 5:7~'),
      repeat: 2,
      groove: 'drive',
      bass: 'A C G D',
      backing: 'Am C G D',
      crash: true,
      fill: true,
    },
    { name: 'Chorus', tab: FIRE_CHORUS, repeat: 4, groove: 'drive', crash: true },
    { name: 'Outro', tab: bars('q P5:0 r P5:0 r', 'w P5:0'), groove: 'stop', crash: true },
  ],
};

const GLOW_ARP = bars('e 6:0 4:2 3:0 2:0 1:0 2:0 3:0 4:2', 'e 5:3 4:2 3:0 2:1 1:0 2:1 3:0 4:2', 'e 6:3 5:2 4:0 3:0 2:0 1:3 2:0 3:0', 'e 4:0 3:2 2:3 1:2 2:3 3:2 4:0 3:2');
const GLOW_VERSE = bars(
  'e [Em]d r [Em]d [Em]u r [Em]u [Em]d [Em]u',
  'e [C]d r [C]d [C]u r [C]u [C]d [C]u',
  'e [G]d r [G]d [G]u r [G]u [G]d [G]u',
  'e [D]d r [D]d [D]u r [D]u [D]d [D]u',
);
const GLOW_LEAD = bars('q 2:15b2 e 2:15 2:12 q 1:12 1:15', 'h 1:15~ q 1:12 2:15', 'e 2:12 2:15 3:14 3:12 q 3:14b1 3:12', 'w 4:14~');

export const afterglow: Lesson = {
  id: 'sb-afterglow',
  title: 'Afterglow',
  band: 'Lights Out Parade',
  kind: 'song',
  genre: 'rock',
  level: 5,
  style: 'Rock ballad',
  summary: 'Picked arpeggios, strummed verses and a singing lead line high up the neck with bends and vibrato.',
  skills: ['arpeggios', 'strumming', 'bends', 'vibrato'],
  bpm: 76,
  tone: 'lead',
  tips: [
    {
      title: 'Let the arpeggios ring',
      body: 'Hold the whole chord shape down while you pick the strings one at a time, so every note keeps ringing into the next.',
      figure: { type: 'chords', chords: ['Em', 'C', 'G', 'D'] },
    },
    {
      title: 'Up the neck',
      body: 'The lead sits at the **12th fret**: the same minor pentatonic box as the open position, one octave higher. Bends feel easier up here.',
    },
  ],
  sections: [
    { name: 'Intro', tab: GLOW_ARP, repeat: 2, groove: 'ballad', bass: 'E C G D', crash: true },
    { name: 'Verse', tab: GLOW_VERSE, repeat: 2, groove: 'ballad', bass: 'E C G D' },
    { name: 'Chorus', tab: GLOW_LEAD, repeat: 2, groove: 'rockHalf', bass: 'C G D E', backing: 'C G D Em', crash: true, fill: true },
    { name: 'Verse', tab: GLOW_VERSE, repeat: 2, groove: 'ballad', bass: 'E C G D' },
    { name: 'Chorus', tab: GLOW_LEAD, repeat: 2, groove: 'rockHalf', bass: 'C G D E', backing: 'C G D Em', crash: true },
    { name: 'Outro', tab: GLOW_ARP, groove: 'ballad', bass: 'E C G D' },
    { name: 'End', tab: bars('w [Em]d'), groove: 'stop', bass: 'E', crash: true },
  ],
};
