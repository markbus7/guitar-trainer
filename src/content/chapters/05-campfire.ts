import type { Chapter } from '../types';

const STRUM = (c: string) => `e [${c}]d r [${c}]d [${c}]u r [${c}]u [${c}]d [${c}]u |`;

export const campfire: Chapter = {
  id: 'campfire',
  venue: 'The Campfire',
  title: 'Open Chords',
  blurb: 'Grab the semi-acoustic: the six chords and one strum that unlock thousands of songs.',
  accent: '#ffd166',
  art: 'campfire',
  lessons: [
    {
      id: 'camp-em',
      title: 'Your first chord: Em',
      kind: 'exercise',
      summary: 'Two fingers, all six strings. E minor is the easiest full chord there is.',
      skills: ['open chords', 'strumming'],
      bpm: 60,
      tone: 'acoustic',
      mode: 'practice',
      tips: [
        {
          title: 'The shape',
          body: 'Middle and ring fingers on the **2nd fret** of the A and D strings. Arch your fingers so they do not touch the strings below, then strum all six.',
          figure: { type: 'chord', chord: 'Em' },
        },
        {
          title: 'Strum from the elbow',
          body: 'One relaxed sweep across all the strings. Let the chord ring until the next one.',
        },
      ],
      sections: [
        { tab: 'w [Em] | [Em] | h [Em] [Em] | [Em] [Em] |' },
        { tab: 'q [Em] [Em] [Em] [Em] | [Em] [Em] [Em] [Em] | h [Em] [Em] | w [Em] |' },
      ],
    },
    {
      id: 'camp-e',
      title: 'Minor to major',
      kind: 'exercise',
      summary: 'Add one finger and E minor turns into E major. Hear the mood flip.',
      skills: ['open chords'],
      bpm: 60,
      tone: 'acoustic',
      tips: [
        {
          title: 'One finger difference',
          body: 'Keep the Em shape and drop your **index finger** on the G string, 1st fret. Minor sounds dark, major sounds bright.',
          figure: { type: 'chords', chords: ['Em', 'E'] },
        },
      ],
      sections: [
        { tab: 'h [Em] [Em] | [E] [E] | [Em] [E] | w [Em] |' },
        { tab: 'q [E] [E] [Em] [Em] | [E] [E] [Em] [Em] | h [E] [Em] | w [E] |' },
      ],
    },
    {
      id: 'camp-am-c',
      title: 'Am and C',
      kind: 'exercise',
      summary: 'Two chords that share fingers, so switching barely moves your hand.',
      skills: ['open chords', 'chord changes'],
      bpm: 64,
      tone: 'acoustic',
      tips: [
        {
          title: 'Anchor fingers',
          body: 'Am and C share your index finger (B string, 1st fret) and middle finger (D string, 2nd fret). To switch, only your **ring finger** moves. For C, start the strum one string lower, on the A string.',
          figure: { type: 'chords', chords: ['Am', 'C'] },
        },
      ],
      sections: [
        { tab: 'h [Am] [Am] | [C] [C] | [Am] [C] | w [Am] |' },
        { tab: 'q [Am] [Am] [C] [C] | [Am] [Am] [C] [C] | h [Am] [C] | w [Am] |' },
      ],
    },
    {
      id: 'camp-g-d',
      title: 'G and D',
      kind: 'exercise',
      summary: 'Two big, bright chords. Together with Em and C they make a whole songbook.',
      skills: ['open chords', 'chord changes'],
      bpm: 64,
      tone: 'acoustic',
      tips: [
        {
          title: 'G is a stretch, D is a triangle',
          body: 'G uses the outer strings, so arch your fingers high. For D, only strum the top four strings, starting from the open D.',
          figure: { type: 'chords', chords: ['G', 'D'] },
        },
      ],
      sections: [
        { tab: 'h [G] [G] | [D] [D] | [G] [D] | w [G] |' },
        { tab: 'q [G] [G] [D] [D] | [G] [G] [D] [D] | h [G] [D] | w [G] |' },
      ],
    },
    {
      id: 'camp-drill',
      title: 'One-minute changes',
      kind: 'drill',
      summary: 'How many clean switches can you make in 60 seconds? Beat your record every day.',
      skills: ['chord changes', 'speed'],
      tone: 'acoustic',
      drill: { chords: ['Em', 'G'], seconds: 60 },
      tips: [
        {
          title: 'Why this works',
          body: 'Chord changes, not chords, are what slow beginners down. Short daily drills on one pair build the muscle memory faster than anything else. You can pick other pairs before you start.',
        },
      ],
    },
    {
      id: 'camp-strum',
      title: 'The go-to strum',
      kind: 'exercise',
      summary: 'Down, down-up, up-down-up. The pattern that fits almost any song.',
      skills: ['strumming', 'rhythm'],
      bpm: 72,
      tone: 'acoustic',
      tips: [
        {
          title: 'Never stop the hand',
          body: 'Your strumming hand swings down on the numbers and up on the "&"s **all the time**. On the gaps, just miss the strings. That is how the rhythm stays even.',
          figure: { type: 'art', art: 'strum' },
        },
      ],
      sections: [
        { tab: `${STRUM('Em')} ${STRUM('Em')}`, groove: 'ballad' },
        { tab: `${STRUM('G')} ${STRUM('D')}`, groove: 'ballad' },
        { tab: `${STRUM('C')} ${STRUM('G')}`, groove: 'ballad' },
      ],
    },
    {
      id: 'camp-gig',
      title: 'Embers',
      kind: 'song',
      style: 'Rock ballad',
      genre: 'acoustic',
      level: 2,
      summary: 'A slow-burning campfire ballad: strummed verses and a big chorus.',
      skills: ['open chords', 'strumming'],
      bpm: 76,
      tone: 'acoustic',
      sections: [
        { name: 'Verse', tab: `${STRUM('Em')} ${STRUM('C')} ${STRUM('G')} ${STRUM('D')}`, groove: 'ballad', bass: 'E C G D' },
        {
          name: 'Chorus',
          tab: 'q [C]d [C]d [C]d [C]u | [G]d [G]d [G]d [G]u | [D]d [D]d [D]d [D]u | [Em]d [Em]d [Em]d [Em]u |',
          repeat: 2,
          groove: 'rockHalf',
          bass: 'C G D E',
          crash: true,
        },
        { name: 'Verse', tab: `${STRUM('Em')} ${STRUM('C')} ${STRUM('G')} ${STRUM('D')}`, groove: 'ballad', bass: 'E C G D' },
        {
          name: 'Chorus',
          tab: 'q [C]d [C]d [C]d [C]u | [G]d [G]d [G]d [G]u | [D]d [D]d [D]d [D]u | [Em]d [Em]d [Em]d [Em]u |',
          repeat: 2,
          groove: 'rockHalf',
          bass: 'C G D E',
          crash: true,
        },
        { name: 'Outro', tab: 'w [Em] |', groove: 'stop', bass: 'E' },
      ],
    },
  ],
};
