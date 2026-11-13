import type { Lesson } from '../types';
import { bars, DOWN4, STRUM } from './helpers';

/** Acoustic: open chords, strumming and picking. Perfect for a semi-acoustic. All original. */

const LIGHT_VERSE = bars('h [Em]d [Em]d', '[Em7]d [Em7]d', '[Em]d [Em]d', 'q 3:0 2:0 1:0 r');
const LIGHT_CHORUS = bars('h [Asus2]d [Asus2]d', '[Em]d [Em]d', '[Asus2]d [Asus2]d', 'w [Em]d');

export const firstLight: Lesson = {
  id: 'sb-first-light',
  title: 'First Light',
  band: 'Paper Lanterns',
  kind: 'song',
  genre: 'acoustic',
  level: 1,
  style: 'Acoustic',
  summary: 'Three of the easiest chords there are, slow half-note strums and a little melody on the open strings.',
  skills: ['first chords', 'half notes', 'open strings'],
  bpm: 72,
  tone: 'acoustic',
  mode: 'practice',
  tips: [
    {
      title: 'Two fingers is enough',
      body: '**Em** uses two fingers. Lift your ring finger off and you have **Em7**. Move both fingers down one string for **Asus2**. Strum slowly and let every chord ring.',
      figure: { type: 'chords', chords: ['Em', 'Em7', 'Asus2'] },
    },
  ],
  sections: [
    { name: 'Intro', tab: bars('w [Em]d', '[Em7]d'), repeat: 2, groove: 'ballad', crash: true },
    { name: 'Verse', tab: LIGHT_VERSE, repeat: 2, groove: 'ballad' },
    { name: 'Chorus', tab: LIGHT_CHORUS, repeat: 2, groove: 'ballad', crash: true, fill: true },
    { name: 'Verse', tab: LIGHT_VERSE, repeat: 2, groove: 'ballad' },
    { name: 'Chorus', tab: LIGHT_CHORUS, repeat: 2, groove: 'ballad', crash: true },
    { name: 'Outro', tab: bars('w [Em7]d', '[Em]d'), groove: 'stop', crash: true },
  ],
};

const CAMP_VERSE = bars(DOWN4('G'), DOWN4('C'), DOWN4('G'), DOWN4('D'));
const CAMP_CHORUS = bars('q [C]d [C]d [D]d [D]d', '[G]d [G]d [Em]d [Em]d', '[C]d [C]d [D]d [D]d', 'w [G]d');

export const campfireStories: Lesson = {
  id: 'sb-campfire-stories',
  title: 'Campfire Stories',
  band: 'The Wanderlights',
  kind: 'song',
  genre: 'acoustic',
  level: 2,
  style: 'Folk rock',
  summary: 'G, C, D and Em: the four chords behind half the songs ever sung around a fire, with steady down-strums.',
  skills: ['open chords', 'chord changes', 'down-strums'],
  bpm: 84,
  tone: 'acoustic',
  tips: [
    {
      title: 'Change early',
      body: 'Start moving to the next chord on the **last beat** of the bar. It is fine if that last strum is a bit messy: landing on beat one is what counts.',
      figure: { type: 'chords', chords: ['G', 'C', 'D', 'Em'] },
    },
  ],
  sections: [
    { name: 'Intro', tab: bars('w [G]d', '[C]d', '[G]d', '[D]d'), groove: 'ballad', crash: true },
    { name: 'Verse', tab: CAMP_VERSE, repeat: 2, groove: 'ballad' },
    { name: 'Chorus', tab: CAMP_CHORUS, repeat: 2, groove: 'rock', crash: true, fill: true },
    { name: 'Verse', tab: CAMP_VERSE, repeat: 2, groove: 'ballad' },
    { name: 'Chorus', tab: CAMP_CHORUS, repeat: 2, groove: 'rock', crash: true },
    { name: 'Chorus', tab: CAMP_CHORUS, groove: 'rock', crash: true },
    { name: 'Outro', tab: bars('w [C]d', '[G]d'), groove: 'stop', crash: true },
  ],
};

// Four shapes that share the same two fingers on the top strings (3rd fret, B and high E).
const EM7 = '022033=Em7';
const DINER_ARP = bars(
  'e 6:3 4:0 3:0 2:3 1:3 2:3 3:0 4:0',
  'e 5:3 4:2 3:0 2:3 1:3 2:3 3:0 4:2',
  'e 6:0 4:2 3:0 2:3 1:3 2:3 3:0 4:2',
  'e 4:0 3:2 2:3 1:3 2:3 3:2 4:0 3:2',
);
const DINER_VERSE = bars(STRUM('G-rock'), STRUM('Cadd9'), STRUM(EM7), STRUM('Dsus4'));
const DINER_CHORUS = bars(STRUM('Cadd9'), STRUM('G-rock'), STRUM('Dsus4'), `q [${EM7}]d [${EM7}]d h [Dsus4]d`);

export const allNightDiner: Lesson = {
  id: 'sb-all-night-diner',
  title: 'All-Night Diner',
  band: 'The Late Shift',
  kind: 'song',
  genre: 'acoustic',
  level: 4,
  style: 'Acoustic rock',
  summary: 'Picked chord shapes that ring into each other, a syncopated strum and a quiet bridge. Made for a semi-acoustic.',
  skills: ['fingerpicked arpeggios', 'syncopated strumming', 'anchor fingers'],
  bpm: 92,
  tone: 'acoustic',
  tips: [
    {
      title: 'Anchor fingers',
      body: 'G, Cadd9, Em7 and Dsus4 here all keep your **ring and pinky on the 3rd fret** of the B and high E strings. Leave them down the whole song and only move the other fingers.',
      figure: { type: 'chords', chords: ['G-rock', 'Cadd9', 'Dsus4'] },
    },
    {
      title: 'The strum',
      body: 'Down, (skip), down, up, (skip), up, down, up. Keep your hand moving down and up all the time and just miss the strings on the skips.',
      figure: { type: 'art', art: 'strum' },
    },
  ],
  sections: [
    { name: 'Intro', tab: DINER_ARP, repeat: 2, groove: 'ballad', bass: 'G C E D', crash: true },
    { name: 'Verse', tab: DINER_VERSE, repeat: 2, groove: 'ballad', bass: 'G C E D' },
    { name: 'Chorus', tab: DINER_CHORUS, repeat: 2, groove: 'rock', bass: 'C G D E', crash: true, fill: true },
    { name: 'Verse', tab: DINER_VERSE, repeat: 2, groove: 'ballad', bass: 'G C E D' },
    { name: 'Chorus', tab: DINER_CHORUS, repeat: 2, groove: 'rock', bass: 'C G D E', crash: true },
    { name: 'Bridge', tab: bars('h [Em]d [Em]d', '[Cadd9]d [Cadd9]d', '[G-rock]d [G-rock]d', '[Dsus4]d [D]d'), groove: 'rockHalf', bass: 'E C G D', fill: true },
    { name: 'Chorus', tab: DINER_CHORUS, repeat: 2, groove: 'rock', bass: 'C G D E', crash: true },
    { name: 'Outro', tab: bars('w [G-rock]d'), groove: 'stop', bass: 'G', crash: true },
  ],
};
