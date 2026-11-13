import type { Chapter } from '../types';

export const skatepark: Chapter = {
  id: 'skatepark',
  venue: 'The Skate Park',
  title: 'Pop-Punk Power',
  blurb: 'Palm-muted verses, exploding choruses and non-stop down-strokes. Fast, loud and catchy.',
  accent: '#b6ff3b',
  art: 'skatepark',
  lessons: [
    {
      id: 'skate-palm-mute',
      title: 'Palm muting',
      kind: 'learn',
      summary: 'The tight, punchy "chug" behind every punk verse and metal riff.',
      skills: ['palm muting'],
      steps: [
        {
          title: 'The secret weapon',
          body: 'Rest the fleshy edge of your picking hand on the strings, right where they leave the **bridge**. Pick as normal. The notes turn into a tight, punchy **chug**.\n\nPop-punk verses chug; choruses lift the hand and explode.',
          figure: { type: 'art', art: 'palm-mute' },
        },
        {
          title: 'Find the spot',
          body: 'Too far toward the neck and the note dies completely. Too far back and nothing changes. Slide your hand until you hear a muffled note that still has pitch. In tab, muted notes are marked **P.M.**',
          check: { prompt: 'Palm-mute the open low E and chug it 3 times', midi: [40], times: 3 },
        },
        {
          title: 'Mute, then open',
          body: 'The magic is the contrast: chug, chug, chug, then lift your palm for a big open chord. You will practise exactly that next.',
        },
      ],
    },
    {
      id: 'skate-chug',
      title: 'Chug chug chug',
      kind: 'exercise',
      summary: 'Muted eighths that open up into ringing power chords.',
      skills: ['palm muting', 'power chords'],
      bpm: 100,
      tone: 'punk',
      tips: [
        {
          title: 'Hand down, hand up',
          body: 'P.M. notes: palm down on the bridge. Unmarked chords: lift the palm just a few millimetres and let them ring.',
        },
      ],
      sections: [
        {
          tab: `e 6:0pm 6:0pm 6:0pm 6:0pm 6:0pm 6:0pm 6:0pm 6:0pm | 6:0pm 6:0pm 6:0pm 6:0pm q P6:0 P6:0 |
                e P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm | P6:5pm P6:5pm P6:5pm P6:5pm q P6:5 P6:5 |`,
          repeat: 2,
          groove: 'punk',
        },
      ],
    },
    {
      id: 'skate-downstrokes',
      title: 'Down-stroke stamina',
      kind: 'exercise',
      summary: 'The four chords behind half the pop-punk songs ever written, all down-strokes.',
      skills: ['down-strokes', 'stamina'],
      bpm: 120,
      tone: 'punk',
      tips: [
        {
          title: 'Wrist, not arm',
          body: 'Pop-punk lives on relentless down-strokes. Keep the motion small and from the wrist, with your forearm relaxed. If you tense up, drop the tempo and build back up.',
        },
        {
          title: 'The magic four',
          body: 'C5, G5, A5, F5 — the root, the fifth, the sixth and the fourth of the key. Swap them around and you have a punk anthem.',
          figure: { type: 'chords', chords: ['C5', 'G5', 'A5m'] },
        },
      ],
      sections: [
        {
          tab: `e P5:3pm P5:3pm P5:3pm P5:3pm P5:3pm P5:3pm P5:3pm P5:3pm | P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm |
                e P6:5pm P6:5pm P6:5pm P6:5pm P6:5pm P6:5pm P6:5pm P6:5pm | P6:1pm P6:1pm P6:1pm P6:1pm P6:1pm P6:1pm P6:1pm P6:1pm |`,
          repeat: 2,
          groove: 'punk',
        },
      ],
    },
    {
      id: 'skate-switch',
      title: 'Mute, then explode',
      kind: 'riff',
      summary: 'A chugging verse that bursts into an open, ringing chorus.',
      skills: ['palm muting', 'dynamics'],
      bpm: 132,
      tone: 'punk',
      sections: [
        {
          name: 'Verse',
          tab: 'e P5:3pm P5:3pm P5:3pm P5:3pm P6:3pm P6:3pm P6:3pm P6:3pm | P6:5pm P6:5pm P6:5pm P6:5pm P6:1pm P6:1pm P6:1pm P6:1pm |',
          repeat: 2,
          groove: 'punk',
        },
        {
          name: 'Chorus',
          tab: 'q P5:3 P5:3 e P6:3 P6:3 q P6:3 | P6:5 P6:5 e P6:1 P6:1 q P6:1 |',
          repeat: 2,
          groove: 'skate',
          crash: true,
        },
      ],
    },
    {
      id: 'skate-octaves',
      title: 'Octave riffs',
      kind: 'riff',
      summary: 'The two-finger octave shape behind countless pop-punk lead lines.',
      skills: ['octaves', 'muting'],
      bpm: 100,
      tone: 'punk',
      tips: [
        {
          title: 'Skip a string',
          body: 'Index finger on the 5th string, ring finger two frets higher on the **3rd** string. The D string in between gets muted by the underside of your index finger, so you can strum freely across all three.',
          figure: {
            type: 'fretboard',
            frets: [0, 7],
            marks: [
              { string: 5, fret: 3, label: '1', root: true },
              { string: 3, fret: 5, label: '3', root: true },
            ],
            caption: 'C octave: same note, two octaves of punch.',
          },
        },
      ],
      sections: [
        {
          tab: `e O5:3 O5:3 O5:5 O5:3 q O5:7 O5:5 | e O5:3 O5:3 O5:5 O5:3 q O5:2 O5:0 |
                e O5:0 O5:0 O5:2 O5:0 q O5:3 O5:5 | h O5:7 O5:5 |`,
          repeat: 2,
          groove: 'skate',
          backing: 'C C Am Am',
        },
      ],
    },
    {
      id: 'skate-gig',
      title: 'Curfew',
      kind: 'song',
      style: 'Pop-punk',
      genre: 'pop-punk',
      level: 3,
      summary: 'Sneak out, turn it up: chugging verses, stop-start pre-chorus and a sing-along chorus.',
      skills: ['palm muting', 'down-strokes', 'power chords'],
      bpm: 168,
      tone: 'punk',
      tips: [
        {
          title: 'Speed comes last',
          body: 'This one is fast. Start at 70% tempo in Play mode and earn a star, then nudge it up. Three stars need full speed.',
        },
      ],
      sections: [
        { name: 'Intro', tab: 'q P5:5 P5:5 e P6:5 P6:5 q P6:5 | P6:7 P6:7 e P6:3 P6:3 q P6:3 |', repeat: 2, groove: 'skate', crash: true },
        {
          name: 'Verse',
          tab: `e P5:5pm P5:5pm P5:5pm P5:5pm P5:5pm P5:5pm P5:5pm P5:5pm | P6:5pm P6:5pm P6:5pm P6:5pm P6:5pm P6:5pm P6:5pm P6:5pm |
                e P6:7pm P6:7pm P6:7pm P6:7pm P6:7pm P6:7pm P6:7pm P6:7pm | P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm |`,
          groove: 'punk',
        },
        { name: 'Pre-chorus', tab: 'q P6:3 r P6:3 r | P6:5 r e P6:5 P6:5 P6:5 P6:5 |', groove: 'stop', fill: true },
        {
          name: 'Chorus',
          tab: 'e P5:5 P5:5 P5:5 P5:5 P6:5 P6:5 P6:5 P6:5 | P6:7 P6:7 P6:7 P6:7 P6:3 P6:3 P6:3 P6:3 |',
          repeat: 2,
          groove: 'skate',
          crash: true,
        },
        {
          name: 'Verse',
          tab: `e P5:5pm P5:5pm P5:5pm P5:5pm P5:5pm P5:5pm P5:5pm P5:5pm | P6:5pm P6:5pm P6:5pm P6:5pm P6:5pm P6:5pm P6:5pm P6:5pm |
                e P6:7pm P6:7pm P6:7pm P6:7pm P6:7pm P6:7pm P6:7pm P6:7pm | P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm P6:3pm |`,
          groove: 'punk',
        },
        { name: 'Pre-chorus', tab: 'q P6:3 r P6:3 r | P6:5 r e P6:5 P6:5 P6:5 P6:5 |', groove: 'stop', fill: true },
        {
          name: 'Chorus',
          tab: 'e P5:5 P5:5 P5:5 P5:5 P6:5 P6:5 P6:5 P6:5 | P6:7 P6:7 P6:7 P6:7 P6:3 P6:3 P6:3 P6:3 |',
          repeat: 2,
          groove: 'skate',
          crash: true,
        },
        { name: 'Outro', tab: 'q P5:5 r P5:5 r | w P5:5 |', groove: 'stop', crash: true },
      ],
    },
  ],
};
