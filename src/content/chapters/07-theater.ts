import type { Chapter } from '../types';

export const theater: Chapter = {
  id: 'theater',
  venue: 'The Theater',
  title: 'Lead Guitar',
  blurb: 'Step into the spotlight: scales, hammer-ons, slides and screaming bends.',
  accent: '#b388ff',
  art: 'theater',
  lessons: [
    {
      id: 'theater-pentatonic',
      title: 'The minor pentatonic',
      kind: 'exercise',
      summary: 'Five notes that sound good over almost every rock song in E minor.',
      skills: ['scales', 'pentatonic'],
      bpm: 70,
      tone: 'lead',
      mode: 'practice',
      tips: [
        {
          title: 'The rock scale',
          body: 'The minor pentatonic has five notes. In open position it is just frets 0 and 2 or 3 on every string. Learn it up and down and you can improvise over a huge number of songs.',
          figure: {
            type: 'fretboard',
            frets: [0, 4],
            marks: [
              { string: 6, fret: 0, root: true },
              { string: 6, fret: 3 },
              { string: 5, fret: 0 },
              { string: 5, fret: 2 },
              { string: 4, fret: 0 },
              { string: 4, fret: 2, root: true },
              { string: 3, fret: 0 },
              { string: 3, fret: 2 },
              { string: 2, fret: 0 },
              { string: 2, fret: 3 },
              { string: 1, fret: 0, root: true },
              { string: 1, fret: 3 },
            ],
            caption: 'E minor pentatonic. Glowing dots are E, the root.',
          },
        },
      ],
      sections: [
        { tab: 'q 6:0 6:3 5:0 5:2 | 4:0 4:2 3:0 3:2 | 2:0 2:3 1:0 1:3 | h 1:0 r |', groove: 'rock' },
        { tab: 'q 1:3 1:0 2:3 2:0 | 3:2 3:0 4:2 4:0 | 5:2 5:0 6:3 6:0 | h 6:0 r |', groove: 'rock' },
      ],
    },
    {
      id: 'theater-box',
      title: 'Box one at the 5th fret',
      kind: 'exercise',
      summary: 'The most famous shape in rock: A minor pentatonic, box one.',
      skills: ['scales', 'pentatonic'],
      bpm: 72,
      tone: 'lead',
      tips: [
        {
          title: 'Fingers 1, 3 and 4',
          body: 'Index finger plays everything on the 5th fret. Ring finger takes the 7th, pinky the 8th. The shape is movable: slide it to any fret to change key.',
          figure: {
            type: 'fretboard',
            frets: [3, 10],
            marks: [
              { string: 6, fret: 5, label: '1', root: true },
              { string: 6, fret: 8, label: '4' },
              { string: 5, fret: 5, label: '1' },
              { string: 5, fret: 7, label: '3' },
              { string: 4, fret: 5, label: '1' },
              { string: 4, fret: 7, label: '3', root: true },
              { string: 3, fret: 5, label: '1' },
              { string: 3, fret: 7, label: '3' },
              { string: 2, fret: 5, label: '1' },
              { string: 2, fret: 8, label: '4' },
              { string: 1, fret: 5, label: '1', root: true },
              { string: 1, fret: 8, label: '4' },
            ],
            caption: 'A minor pentatonic, box 1. Root notes are A.',
          },
        },
      ],
      sections: [
        { tab: 'e 6:5 6:8 5:5 5:7 4:5 4:7 3:5 3:7 | 2:5 2:8 1:5 1:8 h 1:5 |', groove: 'rock', bass: 'A A' },
        { tab: 'e 1:8 1:5 2:8 2:5 3:7 3:5 4:7 4:5 | 5:7 5:5 6:8 6:5 h 6:5 |', groove: 'rock', bass: 'A A' },
      ],
    },
    {
      id: 'theater-legato',
      title: 'Hammer-ons & pull-offs',
      kind: 'exercise',
      summary: 'Play two notes with one pick stroke. Smooth, fast and very rock.',
      skills: ['hammer-on', 'pull-off'],
      bpm: 66,
      tone: 'lead',
      tips: [
        {
          title: 'Hammer-on',
          body: 'Pick the first note, then slam a finger down on the higher fret, hard and close to the fret wire. No second pick. Marked **h** in tab.',
        },
        {
          title: 'Pull-off',
          body: 'The reverse: with both fingers down, pick the higher note, then flick the top finger off the string slightly sideways to sound the lower one. Marked **p**.',
        },
      ],
      sections: [
        { tab: 'q 3:5 h3:7 3:5 h3:7 | 2:5 h2:8 2:5 h2:8 | 3:7 p3:5 3:7 p3:5 | 2:8 p2:5 h 3:7 |', groove: 'rock', bass: 'A A A A' },
        { tab: 'e 3:5 h3:7 3:5 h3:7 2:5 h2:8 2:5 h2:8 | 1:8 p1:5 2:8 p2:5 3:7 p3:5 q 4:7 |', repeat: 2, groove: 'rock', bass: 'A A' },
      ],
    },
    {
      id: 'theater-slides',
      title: 'Slides',
      kind: 'exercise',
      summary: 'Glide between notes without lifting your finger.',
      skills: ['slides'],
      bpm: 70,
      tone: 'lead',
      tips: [
        {
          title: 'Keep the pressure',
          body: 'Pick the first note, then slide the same finger along the string to the new fret while keeping it pressed down. Marked **/** going up and **\\** going down.',
        },
      ],
      sections: [
        { tab: 'q 3:5 /3:7 h 3:7 | q 2:5 /2:8 h 2:8 | q 3:7 /3:5 h 4:7 | q 4:5 /4:7 h 4:5 |', groove: 'rock', bass: 'A A A A' },
        { tab: 'q 4:5 /4:7 e 3:5 3:7 q 3:5 | q 4:7 /4:9 h 4:7 |', repeat: 2, groove: 'rock', bass: 'A A' },
      ],
    },
    {
      id: 'theater-bends',
      title: 'Bends',
      kind: 'exercise',
      summary: 'Push the string to make it sing. The most expressive move on guitar.',
      skills: ['bends'],
      bpm: 64,
      tone: 'lead',
      mode: 'practice',
      tips: [
        {
          title: 'Three fingers strong',
          body: 'Fret with your ring finger and put your middle and index fingers behind it on the same string. Push the string up toward the ceiling by turning your wrist, like opening a door. Bend until it sounds like the note **two frets higher**.',
          figure: { type: 'art', art: 'bend' },
        },
      ],
      sections: [
        { tab: 'h 3:7b2 r | 3:7b2 r | 2:8b2 r | 2:8b2 r |', groove: 'rock', bass: 'A A A A' },
        { tab: 'q 3:5 3:7b2 h 3:5 | q 2:5 2:8b2 h 2:5 | q 3:7b2 3:5 4:7 4:5 | w 3:7b2 |', groove: 'rock', bass: 'A A A A' },
      ],
    },
    {
      id: 'theater-licks',
      title: 'Lick library',
      kind: 'riff',
      summary: 'Four classic-sounding licks that glue scales, legato and bends together.',
      skills: ['licks', 'bends', 'hammer-on'],
      bpm: 80,
      tone: 'lead',
      sections: [
        {
          tab: `e 1:5 1:8 2:5 2:8 q 3:7b2 3:5 | e 3:7 3:5 4:7 4:5 h 5:7 |
                e 2:5 h2:8 2:5 3:7 q 3:5 3:7 | q 2:8b2 2:5 h 3:7 |`,
          repeat: 2,
          groove: 'rock',
          bass: 'A G F G',
          backing: 'Am G F G',
        },
      ],
    },
    {
      id: 'theater-gig',
      title: 'Spotlight',
      kind: 'song',
      style: 'Rock solo',
      summary: 'Your first guitar solo, over a full band. Make it scream.',
      skills: ['licks', 'bends', 'slides'],
      bpm: 88,
      tone: 'lead',
      sections: [
        {
          name: 'Solo part 1',
          tab: `e 1:5 1:8 2:5 2:8 q 3:7b2 3:5 | e 3:7 3:5 4:7 4:5 h 5:7 |
                e 2:5 h2:8 2:5 3:7 q 3:5 3:7 | q 2:8b2 2:5 h 3:7 |`,
          groove: 'rock',
          bass: 'A G F G',
          backing: 'Am G F G',
          crash: true,
        },
        {
          name: 'Solo part 2',
          tab: `q 1:5 e 1:8 1:5 q 2:8 2:5 | e 3:5 h3:7 3:5 4:7 h 4:5 |
                q 4:7 /4:9 e 3:7 3:5 q 3:7b2 | w 4:7 |`,
          groove: 'drive',
          bass: 'A G F G',
          backing: 'Am G F G',
          crash: true,
          fill: true,
        },
        {
          name: 'Big finish',
          tab: `e 1:5 1:8 2:5 2:8 q 3:7b2 3:5 | e 3:7 3:5 4:7 4:5 h 5:7 |
                q 1:5 2:5 3:5 3:7b2 | w 4:7 |`,
          groove: 'rock',
          bass: 'A G F A',
          backing: 'Am G F Am',
          crash: true,
        },
      ],
    },
  ],
};
