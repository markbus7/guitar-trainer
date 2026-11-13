import type { Chapter } from '../types';

export const garage: Chapter = {
  id: 'garage',
  venue: 'The Garage',
  title: 'First Sounds',
  blurb: 'Set up, tune up and make your first noise. Every band starts in a garage.',
  accent: '#ff7a3d',
  art: 'garage',
  lessons: [
    {
      id: 'garage-meet',
      title: 'Meet your guitar',
      kind: 'learn',
      summary: 'How to sit, hold the pick, and the names of the six strings.',
      skills: ['posture', 'pick grip', 'string names'],
      steps: [
        {
          title: 'Welcome to the garage',
          body: 'Every guitarist on every stage started exactly where you are now. On this first stop you will get comfortable, learn the strings and play your first notes.\n\nFretforge **listens** through your microphone, so keep your guitar within a metre or so of it. Unplugged acoustic, semi-acoustic or an electric through an amp all work.',
          figure: { type: 'art', art: 'guitar-parts', caption: 'Your semi-acoustic: hollow body, f-holes, and pickups for when you plug in.' },
        },
        {
          title: 'Sit like a rocker',
          body: 'Use a chair without arms. Rest the guitar\'s waist on your **right leg** (left leg if you play left-handed), with the back of the body against your belly and the neck pointing slightly upward.\n\nDrop your shoulders and breathe. Tension is the enemy of speed. If anything hurts, stop and shake it out.',
          figure: { type: 'art', art: 'posture' },
        },
        {
          title: 'Hold the pick',
          body: 'Pinch the pick between the pad of your thumb and the side of your index finger, with the point aimed at the strings. Only **2–3 mm** of the tip should poke out.\n\nGrip just firmly enough that the pick does not twist. You will strike the strings with small movements from the wrist.',
          figure: { type: 'art', art: 'pick-grip' },
        },
        {
          title: 'The six strings',
          body: 'Strings are numbered from the **thinnest (1)** to the **thickest (6)**. In standard tuning they are named E A D G B E from thick to thin.\n\nA classic way to remember it: **E**ddie **A**te **D**ynamite, **G**ood **B**ye **E**ddie.',
          figure: { type: 'art', art: 'string-names' },
        },
        {
          title: 'Your first note',
          body: 'Pluck the **thickest string** (the 6th, low E) with a down-stroke and let it ring.',
          check: { prompt: 'Pluck the 6th string (low E)', midi: [40] },
        },
        {
          title: 'Now the thinnest',
          body: 'Pluck the **thinnest string** (the 1st, high e). It is the same note as the low E, two octaves higher.',
          check: { prompt: 'Pluck the 1st string (high e)', midi: [64] },
        },
        {
          title: 'You are making noise',
          body: 'That is it, Fretforge can hear you. Next up is tuning, so everything you play sounds the way it should.',
        },
      ],
    },
    {
      id: 'garage-tune',
      title: 'Tune up',
      kind: 'learn',
      summary: 'Use the tuner to get all six strings in tune. Do this every time you play.',
      skills: ['tuning'],
      steps: [
        {
          title: 'Why tune?',
          body: 'Strings drift out of tune all the time: temperature, new strings, even a bump in a gig bag. A minute of tuning makes everything you play sound right, and it trains your ear.',
        },
        {
          title: 'Tune each string',
          body: 'Pluck one string at a time and let it ring. Left of centre means the string is **flat**, so tighten it. Right of centre means **sharp**, so loosen it. Turn the pegs slowly, and aim for the glow in the middle.',
          tuner: 'standard',
        },
        {
          title: 'Pro tip',
          body: 'Always tune **up** to the note. If you are sharp, go a little below and come back up. The string holds its pitch better that way.\n\nYou can open the tuner any time from the top bar.',
        },
      ],
    },
    {
      id: 'garage-tab',
      title: 'Reading tab',
      kind: 'exercise',
      summary: 'Learn how the note highway works by playing open strings.',
      skills: ['tab', 'open strings'],
      bpm: 60,
      tone: 'clean',
      mode: 'practice',
      tips: [
        {
          title: 'Tab in one minute',
          body: 'Tab shows the six strings as lines, with the thin high e on top and the thick low E at the bottom. The number says which fret to press. **0 means the open string**, so you do not press anything.',
          figure: { type: 'art', art: 'tab-reading' },
        },
        {
          title: 'The note highway',
          body: 'Notes slide toward the glowing line on the left. Pluck the string when the note reaches it. In **Practice** mode the highway waits for you.',
        },
      ],
      sections: [
        {
          tab: 'q 6:0 6:0 6:0 6:0 | 5:0 5:0 5:0 5:0 | 6:0 6:0 5:0 5:0 | 6:0 5:0 6:0 r |',
          repeat: 2,
        },
      ],
    },
    {
      id: 'garage-strings',
      title: 'All six strings',
      kind: 'exercise',
      summary: 'Walk across every string, from the thickest to the thinnest and back.',
      skills: ['open strings', 'picking'],
      bpm: 66,
      tone: 'clean',
      mode: 'practice',
      tips: [
        {
          title: 'Small motions',
          body: 'The pick only needs to travel a few millimetres past the string. Big swings are slow and noisy.',
        },
      ],
      sections: [
        { tab: 'q 6:0 6:0 5:0 5:0 | 4:0 4:0 3:0 3:0 | 2:0 2:0 1:0 1:0 | h 1:0 r |' },
        { tab: 'q 1:0 1:0 2:0 2:0 | 3:0 3:0 4:0 4:0 | 5:0 5:0 6:0 6:0 | h 6:0 r |' },
      ],
    },
    {
      id: 'garage-eighths',
      title: 'Eighth notes',
      kind: 'exercise',
      summary: 'Double the speed: two notes per beat, counted "1 and 2 and".',
      skills: ['rhythm', 'eighth notes'],
      bpm: 70,
      tone: 'crunch',
      tips: [
        {
          title: 'Count out loud',
          body: 'Count **1 & 2 & 3 & 4 &**. Quarter notes land on the numbers, eighth notes on the numbers and the "&"s. Use down-strokes for every note for now.',
        },
      ],
      sections: [
        { tab: 'q 6:0 6:0 6:0 6:0 | e 6:0 6:0 6:0 6:0 6:0 6:0 6:0 6:0 |' },
        { tab: 'q 5:0 5:0 5:0 5:0 | e 5:0 5:0 5:0 5:0 5:0 5:0 5:0 5:0 |' },
        { tab: 'e 6:0 6:0 5:0 5:0 6:0 6:0 5:0 5:0 | 4:0 4:0 5:0 5:0 q 6:0 r |' },
      ],
    },
    {
      id: 'garage-skip',
      title: 'String jumping',
      kind: 'exercise',
      summary: 'Skip over strings without looking. Your picking hand learns where they are.',
      skills: ['string skipping', 'accuracy'],
      bpm: 72,
      tone: 'clean',
      tips: [
        {
          title: 'Eyes on the highway',
          body: 'Try not to stare at your picking hand. It learns the string spacing by feel, and that is what lets you play fast later.',
        },
      ],
      sections: [
        { tab: 'q 6:0 4:0 6:0 4:0 | 5:0 3:0 5:0 3:0 | 4:0 2:0 4:0 2:0 | 3:0 1:0 h 3:0 |' },
        { tab: 'q 6:0 5:0 4:0 5:0 | 6:0 5:0 4:0 3:0 | 2:0 1:0 2:0 3:0 | h 6:0 r |' },
      ],
    },
    {
      id: 'garage-gig',
      title: 'First Noise',
      kind: 'song',
      style: 'Garage rock',
      genre: 'rock',
      level: 1,
      summary: 'Your first gig: an open-string garage stomper with a full band behind you.',
      skills: ['open strings', 'eighth notes'],
      bpm: 92,
      tone: 'crunch',
      tips: [
        {
          title: 'Feel the band',
          body: 'Lock in with the kick drum. If a part is too fast, drop the tempo, then work back up to 100% for three stars.',
        },
      ],
      sections: [
        { name: 'Intro', tab: 'e 6:0 6:0 6:0 6:0 q 5:0 6:0 | e 6:0 6:0 6:0 6:0 q 4:0 5:0 |', repeat: 2, groove: 'rock', crash: true },
        { name: 'Verse', tab: 'q 6:0 6:0 e 5:0 5:0 q 6:0 | q 6:0 6:0 e 4:0 4:0 q 5:0 |', repeat: 2, groove: 'rock' },
        { name: 'Chorus', tab: 'e 5:0 5:0 5:0 5:0 4:0 4:0 4:0 4:0 | 6:0 6:0 6:0 6:0 q 3:0 4:0 |', repeat: 2, groove: 'drive', crash: true, fill: true },
        { name: 'Verse', tab: 'q 6:0 6:0 e 5:0 5:0 q 6:0 | q 6:0 6:0 e 4:0 4:0 q 5:0 |', repeat: 2, groove: 'rock' },
        { name: 'Chorus', tab: 'e 5:0 5:0 5:0 5:0 4:0 4:0 4:0 4:0 | 6:0 6:0 6:0 6:0 q 3:0 4:0 |', repeat: 2, groove: 'drive', crash: true },
        { name: 'Outro', tab: 'q 6:0 5:0 4:0 3:0 | w 6:0 |', groove: 'stop', crash: true },
      ],
    },
  ],
};
