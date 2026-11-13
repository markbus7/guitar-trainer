import type { Chapter } from '../types';

export const divebar: Chapter = {
  id: 'divebar',
  venue: 'The Dive Bar',
  title: 'Power Chords',
  blurb: 'Two fingers, enormous sound. The power chord is the engine of rock, punk and metal.',
  accent: '#ff4d6d',
  art: 'divebar',
  lessons: [
    {
      id: 'bar-power-intro',
      title: 'The power chord',
      kind: 'learn',
      summary: 'What a power chord is and how to play E5 and A5 with open strings.',
      skills: ['power chords'],
      steps: [
        {
          title: 'Two notes, huge sound',
          body: 'A power chord is just two notes: a **root** and the note a **fifth** above it. It is neither happy nor sad, just strong. Through a distorted amp it is the sound of rock, punk and metal.',
          figure: { type: 'chord', chord: 'E5' },
        },
        {
          title: 'Open E5',
          body: 'Play the **open low E** together with the **A string at the 2nd fret** (index finger). Strum only those two strings and stop the pick before the D string.',
          figure: { type: 'chord', chord: 'E5' },
          check: { prompt: 'Strum E5', chord: 'E5' },
        },
        {
          title: 'Open A5',
          body: 'Same idea, one string over: the **open A string** plus the **D string at the 2nd fret**.',
          figure: { type: 'chord', chord: 'A5' },
          check: { prompt: 'Strum A5', chord: 'A5' },
        },
        {
          title: 'Mute the rest',
          body: 'Let the underside of your fretting finger lightly touch the thinner strings. If your pick goes too far, those strings stay silent and the chord stays tight. Muting is half of sounding good.',
        },
      ],
    },
    {
      id: 'bar-open-power',
      title: 'E5, A5 and D5',
      kind: 'exercise',
      summary: 'Switch between the three open-string power chords.',
      skills: ['power chords', 'chord changes'],
      bpm: 66,
      tone: 'crunch',
      mode: 'practice',
      tips: [
        {
          title: 'Same shape, three places',
          body: 'E5, A5 and D5 are the same shape on different strings: open string plus one finger on the 2nd fret of the next string.',
          figure: { type: 'chords', chords: ['E5', 'A5', 'D5'] },
        },
      ],
      sections: [
        { tab: 'h P6:0 P6:0 | P5:0 P5:0 | P6:0 P5:0 | w P6:0 |' },
        { tab: 'q P6:0 P6:0 P5:0 P5:0 | P4:0 P4:0 P5:0 P5:0 | P6:0 P5:0 P4:0 P5:0 | w P6:0 |' },
      ],
    },
    {
      id: 'bar-movable',
      title: 'Movable power chords',
      kind: 'exercise',
      summary: 'Lock a two-finger shape and slide it along the low E string.',
      skills: ['power chords', 'shifting'],
      bpm: 66,
      tone: 'crunch',
      tips: [
        {
          title: 'Lock the shape',
          body: 'Index finger on the 6th string, ring finger **two frets higher** on the 5th string. Keep that shape frozen and move your whole hand. The fret of your index finger names the chord: 3rd fret = G5, 5th fret = A5, 7th fret = B5.',
          figure: { type: 'chord', chord: 'G5' },
        },
      ],
      sections: [
        { tab: 'h P6:3 P6:3 | P6:5 P6:5 | P6:3 P6:5 | w P6:3 |' },
        { tab: 'q P6:3 P6:3 P6:5 P6:5 | P6:7 P6:7 P6:5 P6:5 | P6:3 P6:3 P6:5 P6:7 | w P6:5 |' },
      ],
    },
    {
      id: 'bar-astring',
      title: 'Roots on the A string',
      kind: 'exercise',
      summary: 'The same shape one string over, and jumping between the two.',
      skills: ['power chords', 'string changes'],
      bpm: 70,
      tone: 'crunch',
      tips: [
        {
          title: 'Same fret, new string',
          body: 'Move the shape to the A string: index on the 5th string, ring finger on the 4th. The 3rd fret gives C5, the 5th fret D5. Jumping between strings at the same fret is a move you will use in thousands of songs.',
          figure: { type: 'chords', chords: ['C5', 'D5m'] },
        },
      ],
      sections: [
        { tab: 'h P5:3 P5:3 | P5:5 P5:5 | P5:3 P5:5 | w P5:7 |' },
        { tab: 'q P6:3 P6:3 P5:3 P5:3 | P6:5 P6:5 P5:5 P5:5 | P6:3 P6:5 P5:3 P5:5 | w P6:0 |' },
      ],
    },
    {
      id: 'bar-eighths',
      title: 'Rocking eighths',
      kind: 'riff',
      summary: 'Drive eighth-note power chords like a freight train.',
      skills: ['power chords', 'eighth notes'],
      bpm: 84,
      tone: 'crunch',
      tips: [
        {
          title: 'Even and steady',
          body: 'All down-strokes. Keep the shape locked and let your wrist do the work. If your arm starts to burn, relax your grip, not the tempo.',
        },
      ],
      sections: [
        {
          tab: `e P6:0 P6:0 P6:0 P6:0 P6:0 P6:0 P6:0 P6:0 | P6:3 P6:3 P6:3 P6:3 P6:5 P6:5 P6:5 P6:5 |
                e P6:0 P6:0 P6:0 P6:0 P6:0 P6:0 P6:0 P6:0 | P5:3 P5:3 P5:3 P5:3 P6:5 P6:5 P6:5 P6:5 |`,
          repeat: 2,
          groove: 'rock',
        },
      ],
    },
    {
      id: 'bar-gig',
      title: 'Neon Nights',
      kind: 'song',
      style: 'Classic rock',
      summary: 'A bar-room rocker built from stabs, eighth notes and a big chorus.',
      skills: ['power chords'],
      bpm: 104,
      tone: 'crunch',
      sections: [
        { name: 'Intro', tab: 'q P6:5 r e P6:5 P6:5 q P5:5 | q P6:3 r e P6:3 P6:3 q P5:3 |', repeat: 2, groove: 'rock', crash: true },
        {
          name: 'Verse',
          tab: 'e P6:5 P6:5 P6:5 P6:5 P6:5 P6:5 P5:5 P5:5 | P6:3 P6:3 P6:3 P6:3 P6:3 P6:3 P5:3 P5:3 |',
          repeat: 2,
          groove: 'rock',
        },
        { name: 'Chorus', tab: 'h P5:5 q P5:7 P5:5 | h P6:3 q P5:3 P6:3 | h P6:5 q P5:5 P5:7 | w P6:5 |', groove: 'drive', crash: true, fill: true },
        {
          name: 'Verse',
          tab: 'e P6:5 P6:5 P6:5 P6:5 P6:5 P6:5 P5:5 P5:5 | P6:3 P6:3 P6:3 P6:3 P6:3 P6:3 P5:3 P5:3 |',
          repeat: 2,
          groove: 'rock',
        },
        { name: 'Chorus', tab: 'h P5:5 q P5:7 P5:5 | h P6:3 q P5:3 P6:3 | h P6:5 q P5:5 P5:7 | w P6:5 |', repeat: 2, groove: 'drive', crash: true },
        { name: 'Outro', tab: 'q P6:5 r e P6:5 P6:5 q P5:5 | w P6:5 |', groove: 'stop', crash: true },
      ],
    },
  ],
};
