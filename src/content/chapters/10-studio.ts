import type { Chapter } from '../types';

const PM8 = (c: string) => Array(8).fill(`${c}pm`).join(' ');
const CHUCK8 = (c: string) => `e [${c}]d [${c}]u X [${c}]u [${c}]d [${c}]u X [${c}]u |`;
const STRUM = (c: string) => `e [${c}]d r [${c}]d [${c}]u r [${c}]u [${c}]d [${c}]u |`;

/**
 * The Studio: barre chords, the chuck and colour chords. Opens after the Campfire,
 * because it builds on the open chord shapes.
 */
export const studio: Chapter = {
  id: 'studio',
  venue: 'The Studio',
  title: 'Barre Chords',
  blurb: 'Record your first album: barre chords that work anywhere on the neck, the chuck, and chords with colour.',
  accent: '#3ddbb0',
  art: 'studio',
  unlockAfter: 'camp-gig',
  lessons: [
    {
      id: 'studio-barre-intro',
      title: 'The barre',
      kind: 'learn',
      summary: 'One finger across all six strings. Start with a mini barre, then build the full F.',
      skills: ['barre chords'],
      steps: [
        {
          title: 'Why barre chords?',
          body: 'Open chords only work in one place. A **barre chord** uses your index finger as a movable nut, so one shape can play **every** major or minor chord just by sliding it up the neck.\n\nThey take a few weeks to ring clean. Everybody buzzes at first, that is normal.',
          figure: { type: 'chord', chord: 'F' },
        },
        {
          title: 'Mini barre first',
          body: 'Lay your index finger flat across the **B and high e strings at the 1st fret**. Middle on the G string, 2nd fret. Ring on the D string, 3rd fret. Strum only the top four strings.\n\nThis "small F" already sounds great and trains the barre muscle.',
          figure: { type: 'chord', chord: 'F-easy' },
          check: { prompt: 'Strum the small F', chord: 'F-easy' },
        },
        {
          title: 'How to make it ring',
          body: '**Roll your index finger** a little onto its bony side, so the soft crease is not on a string.\n\n**Thumb low** behind the neck, roughly behind your middle finger.\n\n**Pull back with your arm** instead of squeezing with your thumb. The weight of your arm does most of the work.\n\nPress just behind the fret wire, not in the middle of the fret.',
        },
        {
          title: 'The full F',
          body: 'It is an **E chord shape** with your index finger as the nut: barre all six strings at the 1st fret, then middle on the G string (2nd fret), ring on the A string and pinky on the D string (3rd fret). Pick each string one by one to find the one that buzzes.',
          figure: { type: 'chord', chord: 'F' },
          check: { prompt: 'Strum F', chord: 'F' },
        },
        {
          title: 'Slide it up',
          body: 'Keep the exact same grip and slide two frets up: now the barre is on the **3rd fret** and you are playing **G**. The note under your index finger on the low E string names the chord.',
          figure: { type: 'chord', chord: 'G-barre' },
          check: { prompt: 'Strum the barre G', chord: 'G-barre' },
        },
      ],
    },
    {
      id: 'studio-e-shape',
      title: 'Moving the E shape',
      kind: 'exercise',
      summary: 'F, G and A with one grip. Keep the shape, move the arm.',
      skills: ['barre chords', 'shifting'],
      bpm: 60,
      tone: 'clean',
      mode: 'practice',
      tips: [
        {
          title: 'Relax between chords',
          body: 'Loosen the grip for a moment while you slide, but keep your fingers in the shape and touching the strings. Press again when you arrive. Squeezing all the time makes your hand tired fast.',
          figure: { type: 'chords', chords: ['F', 'G-barre', 'A-barre'] },
        },
      ],
      sections: [
        { tab: 'w [F] | [G-barre] | [F] | [G-barre] |', groove: 'none' },
        { tab: 'h [F] [F] | [G-barre] [G-barre] | [A-barre] [A-barre] | [G-barre] [G-barre] |', groove: 'rockHalf' },
        { tab: 'h [A-barre] [G-barre] | [F] [G-barre] | [A-barre] [A-barre] | w [A-barre] |', groove: 'rockHalf' },
      ],
    },
    {
      id: 'studio-minor',
      title: 'Minor barre chords',
      kind: 'exercise',
      summary: 'Lift one finger and the chord turns minor. Am, Gm and F♯m up the neck.',
      skills: ['barre chords', 'minor chords'],
      bpm: 60,
      tone: 'clean',
      tips: [
        {
          title: 'Major to minor',
          body: 'Lift your **middle finger** from the G string and let the barre hold that string down instead. That one fret is the whole difference between happy and sad.',
          figure: { type: 'chords', chords: ['A-barre', 'Am-barre'] },
        },
        {
          title: 'Minor shapes',
          body: 'Same grip on three frets. The note under your index finger on the low E names the chord: 2nd fret F♯, 3rd fret G, 5th fret A.',
          figure: { type: 'chords', chords: ['F#m', 'Gm', 'Am-barre'] },
        },
      ],
      sections: [
        { tab: 'h [A-barre] [A-barre] | [Am-barre] [Am-barre] | [A-barre] [Am-barre] | w [Am-barre] |', groove: 'rockHalf' },
        { tab: 'h [Am-barre] [Am-barre] | [Gm] [Gm] | [F#m] [F#m] | [Gm] [Am-barre] |', groove: 'rockHalf' },
      ],
    },
    {
      id: 'studio-a-shape',
      title: 'The A shape',
      kind: 'exercise',
      summary: 'The second movable shape, rooted on the A string: Bm, C and D.',
      skills: ['barre chords'],
      bpm: 60,
      tone: 'clean',
      mode: 'practice',
      tips: [
        {
          title: 'Root on the A string',
          body: 'Barre from the A string down with your index finger and skip the low E. For **major**, the other three fingers sit side by side two frets higher. For **minor** it is the Am shape: middle, ring and pinky on the D, G and B strings.',
          figure: { type: 'chords', chords: ['Bm', 'C-barre', 'D-barre'] },
        },
        {
          title: 'Mute the low E',
          body: 'Let the tip of your index finger touch the low E string lightly so it stays silent if your pick hits it.',
        },
      ],
      sections: [
        { tab: 'w [Bm] | [C-barre] | [D-barre] | [C-barre] |', groove: 'none' },
        { tab: 'h [Bm] [Bm] | [D-barre] [D-barre] | [C-barre] [C-barre] | [D-barre] [Bm] |', groove: 'rockHalf' },
      ],
    },
    {
      id: 'studio-drill',
      title: 'Barre changes',
      kind: 'drill',
      summary: 'F to C, against the clock. The change that unlocks half the songbook.',
      skills: ['barre chords', 'chord changes'],
      tone: 'clean',
      drill: { chords: ['F', 'C'], seconds: 60 },
      tips: [
        {
          title: 'Short and daily',
          body: 'Barre strength comes from repetition, not from squeezing harder. One minute a day for two weeks and the F stops being scary.',
        },
      ],
    },
    {
      id: 'studio-chuck',
      title: 'The chuck',
      kind: 'exercise',
      summary: 'A muted strum on the backbeat. The snare drum, played on your guitar.',
      skills: ['strumming', 'muting', 'rhythm'],
      bpm: 84,
      tone: 'clean',
      tips: [
        {
          title: 'How to chuck',
          body: 'Strum the chord, then on the next hit **lift your fretting fingers just off the frets** (keep touching the strings) and strum again: a dry "chk". Chucks land on beats **2 and 4**, together with the snare.',
        },
        {
          title: 'Barre chords make it easy',
          body: 'With a barre chord, relaxing your whole hand mutes all six strings at once. That is why the chuck lives in ska, pop-punk and funk.',
          figure: { type: 'chord', chord: 'Am-barre' },
        },
      ],
      sections: [
        { name: 'Quarters', tab: 'q [Am-barre]d X [Am-barre]d X | [Am-barre]d X [Am-barre]d X |', groove: 'rock', repeat: 2 },
        { name: 'Eighths', tab: `${CHUCK8('Am-barre')} ${CHUCK8('G-barre')}`, groove: 'rock', repeat: 2 },
        { name: 'Changes', tab: `${CHUCK8('Am-barre')} ${CHUCK8('F')} ${CHUCK8('G-barre')} ${CHUCK8('Am-barre')}`, groove: 'rock' },
      ],
    },
    {
      id: 'studio-colour',
      title: 'Colour chords',
      kind: 'exercise',
      summary: 'Sus2 and sus4: one finger on, one finger off, and a plain chord starts to move.',
      skills: ['sus chords', 'strumming'],
      bpm: 72,
      tone: 'acoustic',
      tips: [
        {
          title: 'D, Dsus4, Dsus2',
          body: 'Hold **D**. Add your pinky on the high e string, 3rd fret: **Dsus4**. Lift your middle finger off the high e instead: **Dsus2**. Flicking between them is a classic acoustic rock move.',
          figure: { type: 'chords', chords: ['D', 'Dsus4', 'Dsus2'] },
        },
        {
          title: 'Same trick on A',
          body: 'From **A**, pinky on the B string, 3rd fret makes **Asus4**. Lift the finger on the B string for **Asus2**.',
          figure: { type: 'chords', chords: ['A', 'Asus4', 'Asus2'] },
        },
      ],
      sections: [
        { tab: 'h [D]d [Dsus4]d | [D]d [Dsus2]d | [A]d [Asus4]d | [A]d [Asus2]d |', groove: 'ballad' },
        { tab: 'e [D]d r [D]d [D]u r [Dsus4]u [Dsus4]d [D]u | [D]d r [D]d [D]u r [Dsus2]u [Dsus2]d [D]u | [A]d r [A]d [A]u r [Asus4]u [Asus4]d [A]u | w [A]d |', groove: 'ballad' },
      ],
    },
    {
      id: 'studio-punk-barres',
      title: 'Pop-punk with barres',
      kind: 'riff',
      summary: 'Palm-muted power chords in the verse, full barre chords that open up in the chorus.',
      skills: ['barre chords', 'palm muting', 'dynamics'],
      bpm: 120,
      tone: 'punk',
      tips: [
        {
          title: 'Power chord inside the barre',
          body: 'Look closely: every barre chord contains the power chord on the same root. So in the verse you hold just the bottom of the shape and mute, and in the chorus you add the rest of your fingers and let it ring.',
          figure: { type: 'chords', chords: ['G-barre', 'D-barre', 'Em-barre', 'C-barre'] },
        },
      ],
      sections: [
        { name: 'Verse', tab: `e ${PM8('P6:3')} | ${PM8('P5:5')} | ${PM8('P5:7')} | ${PM8('P5:3')} |`, groove: 'punk', bass: 'G D E C' },
        { name: 'Chorus', tab: 'h [G-barre]d [G-barre]d | [D-barre]d [D-barre]d | [Em-barre]d [Em-barre]d | [C-barre]d [C-barre]d |', groove: 'skate', bass: 'G D E C', crash: true },
      ],
    },
    {
      id: 'studio-gig',
      title: 'Night Shift',
      kind: 'song',
      style: 'Pop-punk',
      genre: 'pop-punk',
      level: 4,
      summary: 'Your studio single: muted verses, chucks in the bridge and a barre-chord chorus that rings wide open.',
      skills: ['barre chords', 'palm muting', 'the chuck'],
      bpm: 132,
      tone: 'punk',
      tips: [
        {
          title: 'Record it in takes',
          body: 'Real bands record a song in parts. Use **Loop one part** below to nail the chorus at 70%, then the bridge, then play the whole take.',
        },
      ],
      sections: [
        { name: 'Intro', tab: 'h [G-barre]d [G-barre]d | [D-barre]d [D-barre]d | [Em-barre]d [Em-barre]d | [C-barre]d [C-barre]d |', groove: 'rockHalf', bass: 'G D E C', crash: true },
        { name: 'Verse', tab: `e ${PM8('P6:3')} | ${PM8('P5:5')} | ${PM8('P5:7')} | ${PM8('P5:3')} |`, repeat: 2, groove: 'punk', bass: 'G D E C' },
        { name: 'Chorus', tab: 'q [G-barre]d [G-barre]d [G-barre]d [G-barre]d | [D-barre]d [D-barre]d [D-barre]d [D-barre]d | [Em-barre]d [Em-barre]d [Em-barre]d [Em-barre]d | [C-barre]d [C-barre]d [C-barre]d [C-barre]d |', repeat: 2, groove: 'skate', bass: 'G D E C', crash: true, fill: true },
        { name: 'Verse', tab: `e ${PM8('P6:3')} | ${PM8('P5:5')} | ${PM8('P5:7')} | ${PM8('P5:3')} |`, groove: 'punk', bass: 'G D E C' },
        { name: 'Bridge', tab: `${CHUCK8('Em-barre')} ${CHUCK8('C-barre')} ${CHUCK8('G-barre')} ${CHUCK8('D-barre')}`, groove: 'rock', bass: 'E C G D', fill: true },
        { name: 'Chorus', tab: 'q [G-barre]d [G-barre]d [G-barre]d [G-barre]d | [D-barre]d [D-barre]d [D-barre]d [D-barre]d | [Em-barre]d [Em-barre]d [Em-barre]d [Em-barre]d | [C-barre]d [C-barre]d [C-barre]d [C-barre]d |', repeat: 2, groove: 'skate', bass: 'G D E C', crash: true },
        { name: 'Outro', tab: `${STRUM('G-barre')} w [G-barre]d |`, groove: 'stop', bass: 'G G', crash: true },
      ],
    },
  ],
};
