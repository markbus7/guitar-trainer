import type { Chapter } from '../types';

export const basement: Chapter = {
  id: 'basement',
  venue: 'The Basement',
  title: 'First Frets',
  blurb: 'Press your first frets, train every finger and play riffs on the low strings.',
  accent: '#ffb347',
  art: 'basement',
  lessons: [
    {
      id: 'basement-fretting',
      title: 'Pressing frets',
      kind: 'learn',
      summary: 'Where to put your fingers so notes ring clean instead of buzzing.',
      skills: ['fretting', 'finger numbers'],
      steps: [
        {
          title: 'Your fretting hand',
          body: 'Your other hand presses strings against the frets to change the note. Fingers are numbered: **index 1, middle 2, ring 3, pinky 4**. Tab never tells you which finger to use, but Fretforge shows a suggestion on the fretboard.',
          figure: { type: 'art', art: 'fret-hand' },
        },
        {
          title: 'Where to press',
          body: 'Press with the **tip** of your finger, just **behind the metal fret wire**, not on top of it and not in the middle of the gap. Close to the fret needs less pressure and kills buzz.\n\nKeep your thumb on the back of the neck, roughly behind your middle finger.',
          figure: {
            type: 'fretboard',
            frets: [0, 5],
            marks: [
              { string: 6, fret: 1, label: '1' },
              { string: 6, fret: 2, label: '2' },
              { string: 6, fret: 3, label: '3' },
              { string: 6, fret: 4, label: '4' },
            ],
            caption: 'One finger per fret on the low E string.',
          },
        },
        {
          title: 'Try it',
          body: 'Put your **ring finger (3)** on the 6th string at the **3rd fret** and pluck. That note is G.',
          check: { prompt: '6th string, 3rd fret (G)', midi: [43] },
        },
        {
          title: 'One more',
          body: 'Now your **middle finger (2)** on the 5th string at the **2nd fret**. That is B.',
          check: { prompt: '5th string, 2nd fret (B)', midi: [47] },
        },
        {
          title: 'Buzz or thud?',
          body: 'A **buzz** means you are too far from the fret or not pressing hard enough. A dead **thud** means part of a finger is touching the string. Tiny adjustments fix both, and after a few days it will feel natural.',
        },
      ],
    },
    {
      id: 'basement-first-notes',
      title: 'First fretted notes',
      kind: 'exercise',
      summary: 'Frets 1, 2 and 3 on the two lowest strings.',
      skills: ['fretting'],
      bpm: 60,
      tone: 'clean',
      mode: 'practice',
      tips: [
        {
          title: 'Fret, then pick',
          body: 'Get the finger down first, then pick. When you are ready to move on, let the next finger land before you lift the last one.',
        },
      ],
      sections: [
        { tab: 'h 6:1 6:1 | 6:2 6:2 | 6:3 6:3 | 6:0 r |' },
        { tab: 'h 5:1 5:1 | 5:2 5:2 | 5:3 5:3 | 5:0 r |' },
        { tab: 'q 6:0 6:1 6:2 6:3 | 5:0 5:1 5:2 5:3 | 5:3 5:2 5:1 5:0 | 6:3 6:2 6:1 6:0 |' },
      ],
    },
    {
      id: 'basement-chromatic',
      title: 'One finger per fret',
      kind: 'exercise',
      summary: 'Fingers 1-2-3-4 on frets 1-2-3-4. Wakes up your pinky.',
      skills: ['finger independence'],
      bpm: 66,
      tone: 'clean',
      tips: [
        {
          title: 'Leave them down',
          body: 'Going up, keep each finger on the string after you play it. Going down, lift one finger at a time. It builds strength and accuracy fast.',
          figure: {
            type: 'fretboard',
            frets: [0, 5],
            marks: [
              { string: 4, fret: 1, label: '1' },
              { string: 4, fret: 2, label: '2' },
              { string: 4, fret: 3, label: '3' },
              { string: 4, fret: 4, label: '4' },
            ],
          },
        },
      ],
      sections: [
        { tab: 'q 6:1 6:2 6:3 6:4 | 5:1 5:2 5:3 5:4 | 4:1 4:2 4:3 4:4 | h 4:4 r |' },
        { tab: 'q 4:4 4:3 4:2 4:1 | 5:4 5:3 5:2 5:1 | 6:4 6:3 6:2 6:1 | h 6:0 r |' },
      ],
    },
    {
      id: 'basement-spider',
      title: 'The Spider',
      kind: 'exercise',
      summary: 'The classic warm-up: crawl up and down all six strings.',
      skills: ['warm-up', 'finger independence'],
      bpm: 70,
      tone: 'clean',
      tips: [
        {
          title: 'Warm up daily',
          body: 'Thirty seconds of the Spider before you play loosens your fingers and syncs both hands. Slow and even beats fast and sloppy.',
        },
      ],
      sections: [
        {
          tab: `e 6:1 6:2 6:3 6:4 5:1 5:2 5:3 5:4 | 4:1 4:2 4:3 4:4 3:1 3:2 3:3 3:4 |
                2:1 2:2 2:3 2:4 1:1 1:2 1:3 1:4 | 1:4 1:3 1:2 1:1 2:4 2:3 2:2 2:1 |
                3:4 3:3 3:2 3:1 4:4 4:3 4:2 4:1 | 5:4 5:3 5:2 5:1 6:4 6:3 6:2 6:1 |`,
        },
      ],
    },
    {
      id: 'basement-lowriff',
      title: 'Rust Belt riff',
      kind: 'riff',
      summary: 'Your first real riff, all on the low E string.',
      skills: ['riffs', 'low E string'],
      bpm: 80,
      tone: 'crunch',
      tips: [
        {
          title: 'Stay on one string',
          body: 'Everything here lives on the 6th string. Use finger 2 for fret 2, 3 for fret 3, and 4 (or 3) for fret 5.',
        },
      ],
      sections: [
        { name: 'Riff A', tab: 'e 6:0 6:0 6:3 6:0 6:5 6:3 6:0 6:0 | 6:0 6:0 6:3 6:0 q 6:2 6:3 |', repeat: 2, groove: 'rock' },
        { name: 'Riff B', tab: 'e 6:0 6:0 6:5 6:0 6:3 6:0 6:2 6:0 | q 6:0 e 6:3 6:5 h 6:0 |', repeat: 2, groove: 'rock' },
        { name: 'Riff A', tab: 'e 6:0 6:0 6:3 6:0 6:5 6:3 6:0 6:0 | 6:0 6:0 6:3 6:0 q 6:2 6:3 |', repeat: 2, groove: 'rock', fill: true },
      ],
    },
    {
      id: 'basement-tworiff',
      title: 'Across two strings',
      kind: 'riff',
      summary: 'A riff that hops between the 6th and 5th strings.',
      skills: ['riffs', 'string changes'],
      bpm: 84,
      tone: 'crunch',
      tips: [
        {
          title: 'Mute what you leave',
          body: 'When you move to the A string, let the low E stop ringing by touching it lightly with your fretting fingers. Riffs sound tighter when old notes do not pile up.',
        },
      ],
      sections: [
        { name: 'Riff A', tab: 'e 6:0 6:3 5:0 5:2 6:0 6:3 5:2 5:0 | 6:0 6:3 5:0 5:2 q 5:3 5:2 |', repeat: 2, groove: 'rock' },
        { name: 'Riff B', tab: 'e 5:0 5:0 5:3 5:0 6:3 6:3 6:0 6:3 | q 5:0 5:2 h 6:0 |', repeat: 2, groove: 'rock' },
        { name: 'Riff A', tab: 'e 6:0 6:3 5:0 5:2 6:0 6:3 5:2 5:0 | 6:0 6:3 5:0 5:2 q 5:3 5:2 |', repeat: 2, groove: 'rock' },
      ],
    },
    {
      id: 'basement-melody',
      title: 'Your first melody',
      kind: 'exercise',
      summary: 'A short tune on the thin strings. Same skills, brand new sound.',
      skills: ['melody', 'high strings'],
      bpm: 80,
      tone: 'clean',
      sections: [
        { tab: 'q 1:0 1:3 2:3 2:1 | 2:0 3:2 h 3:0 | q 1:0 1:3 1:5 1:3 | 1:0 2:3 h 2:0 |', groove: 'ballad' },
        { tab: 'q 2:1 2:3 1:0 2:3 | 2:1 2:0 h 3:2 | q 3:0 3:2 2:0 2:3 | w 1:0 |', groove: 'ballad' },
      ],
    },
    {
      id: 'basement-gig',
      title: 'Basement Tapes',
      kind: 'song',
      style: 'Hard rock',
      genre: 'rock',
      level: 1,
      summary: 'Gig night: your two riffs, a chorus and the band at full volume.',
      skills: ['riffs'],
      bpm: 100,
      tone: 'crunch',
      sections: [
        { name: 'Intro', tab: 'e 6:0 6:0 6:3 6:0 6:5 6:3 6:0 6:0 | 6:0 6:0 6:3 6:0 q 6:2 6:3 |', repeat: 2, groove: 'rock', crash: true },
        { name: 'Verse', tab: 'e 6:0 6:3 5:0 5:2 6:0 6:3 5:2 5:0 | 6:0 6:3 5:0 5:2 q 5:3 5:2 |', repeat: 2, groove: 'rock' },
        { name: 'Chorus', tab: 'q 5:0 e 5:0 5:3 q 4:0 e 4:0 4:2 | q 5:0 e 5:3 5:2 h 6:0 |', repeat: 2, groove: 'drive', crash: true, fill: true },
        { name: 'Riff', tab: 'e 6:0 6:0 6:3 6:0 6:5 6:3 6:0 6:0 | 6:0 6:0 6:3 6:0 q 6:2 6:3 |', groove: 'rock' },
        { name: 'Chorus', tab: 'q 5:0 e 5:0 5:3 q 4:0 e 4:0 4:2 | q 5:0 e 5:3 5:2 h 6:0 |', repeat: 2, groove: 'drive', crash: true },
        { name: 'Outro', tab: 'e 6:0 6:0 6:3 6:0 6:5 6:3 6:2 6:0 | w 6:0 |', groove: 'stop' },
      ],
    },
  ],
};
