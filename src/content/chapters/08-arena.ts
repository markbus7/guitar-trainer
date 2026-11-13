import type { Chapter } from '../types';

const S4 = (n: string) => `s ${n} ${n} ${n} ${n}`;

export const arena: Chapter = {
  id: 'arena',
  venue: 'The Arena',
  title: 'Metal Mastery',
  blurb: 'Alternate picking, tremolo melodies, Drop D and syncopated riffs for the big stage.',
  accent: '#4cc9ff',
  art: 'arena',
  lessons: [
    {
      id: 'arena-alternate',
      title: 'Alternate picking',
      kind: 'exercise',
      summary: 'Down, up, down, up: the pick moves like a pendulum. The key to speed.',
      skills: ['alternate picking', 'sixteenth notes'],
      bpm: 80,
      tone: 'metal',
      tips: [
        {
          title: 'The pendulum',
          body: 'Down-strokes on the beat, up-strokes in between, and the hand never stops. Keep the motion tiny. Sixteenth notes are four notes per beat: count **1 e & a**.',
        },
      ],
      sections: [
        {
          tab: `${S4('6:0pm')} ${S4('6:0pm')} e 6:0pm 6:0pm 6:0pm 6:0pm | ${S4('6:0pm')} ${S4('P6:3')} e P6:5 P6:5 P6:5 P6:5 |`,
          repeat: 2,
          groove: 'metal',
        },
        { tab: `${S4('6:0pm')} ${S4('6:0pm')} ${S4('6:0pm')} ${S4('6:0pm')} | ${S4('5:0pm')} ${S4('5:0pm')} ${S4('6:0pm')} ${S4('6:0pm')} |`, repeat: 2, groove: 'metal' },
      ],
    },
    {
      id: 'arena-tremolo',
      title: 'Tremolo melody',
      kind: 'exercise',
      summary: 'Pick each note of a melody as fast as you can. Instant epic.',
      skills: ['tremolo picking', 'alternate picking'],
      bpm: 90,
      tone: 'metal',
      tips: [
        {
          title: 'Fast and light',
          body: 'Tremolo picking is alternate picking on one note, very fast. Hold the pick a little looser and let the wrist flutter. Change notes on the beat.',
        },
      ],
      sections: [
        {
          tab: `${S4('3:4')} ${S4('3:4')} ${S4('3:5')} ${S4('3:5')} | ${S4('2:3')} ${S4('2:3')} ${S4('2:5')} ${S4('2:5')} |
                ${S4('2:3')} ${S4('2:3')} ${S4('3:5')} ${S4('3:5')} | ${S4('3:4')} ${S4('3:4')} ${S4('3:4')} ${S4('3:4')} |`,
          repeat: 2,
          groove: 'thrash',
          bass: 'E E C B',
        },
      ],
    },
    {
      id: 'arena-dropd',
      title: 'Drop D tuning',
      kind: 'learn',
      summary: 'Tune one string down and play heavy power chords with a single finger.',
      skills: ['drop D', 'tuning'],
      tuning: 'dropD',
      steps: [
        {
          title: 'Drop the low string',
          body: 'Loads of heavy songs tune only the 6th string down a whole step, from E to **D**. Suddenly the three lowest strings form a power chord on their own, and any power chord is just **one finger** across three strings.',
          figure: { type: 'art', art: 'drop-d' },
        },
        {
          title: 'Tune to Drop D',
          body: 'Loosen the 6th string until the tuner shows **D**. It should sound one octave below the open 4th string. The other strings stay where they are.',
          tuner: 'dropD',
        },
        {
          title: 'One huge chord',
          body: 'Strum just the three lowest open strings. That is D5.',
          check: { prompt: 'Strum the three lowest open strings (D5)', chord: 'D5-drop' },
        },
        {
          title: 'One finger, any chord',
          body: 'Lay your index finger flat across the 6th, 5th and 4th strings at any fret: 3rd fret is F5, 5th fret is G5, 7th fret is A5. When you are done with Drop D songs, tune back up to E.',
        },
      ],
    },
    {
      id: 'arena-dropd-riff',
      title: 'Drop D riffs',
      kind: 'riff',
      summary: 'Chugs on the low D with one-finger chord stabs.',
      skills: ['drop D', 'palm muting'],
      bpm: 100,
      tuning: 'dropD',
      tone: 'metal',
      sections: [
        { name: 'Riff A', tab: 'e 6:0pm 6:0pm PD6:3 6:0pm 6:0pm PD6:5 6:0pm 6:0pm | PD6:7 PD6:5 6:0pm 6:0pm q PD6:3 PD6:0 |', repeat: 2, groove: 'metal' },
        { name: 'Riff B', tab: 'e 6:0pm 6:0pm 6:0pm 6:1 6:0pm 6:0pm 6:3 6:0pm | PD6:5 r PD6:5 r q PD6:6 PD6:5 |', repeat: 2, groove: 'metal' },
      ],
    },
    {
      id: 'arena-sync',
      title: 'Syncopation',
      kind: 'riff',
      summary: 'Hit between the beats. Riffs that punch where you least expect.',
      skills: ['syncopation', 'drop D'],
      bpm: 96,
      tuning: 'dropD',
      tone: 'metal',
      tips: [
        {
          title: 'Feel the offbeat',
          body: 'Keep your picking hand moving in steady eighths, down on the beat and up in between, even through the rests. The accents land wherever the hand happens to be.',
        },
      ],
      sections: [
        { tab: 'e PD6:0 r PD6:0 r r PD6:0 r PD6:0 | r PD6:0 r PD6:3 q PD6:5 PD6:3 |', repeat: 2, groove: 'metal' },
        { tab: 'e 6:0pm PD6:0 6:0pm 6:0pm PD6:0 6:0pm 6:0pm PD6:3 | 6:0pm 6:0pm PD6:5 6:0pm q PD6:3 PD6:0 |', repeat: 2, groove: 'metal' },
      ],
    },
    {
      id: 'arena-gig',
      title: 'Steel Thunder',
      kind: 'song',
      style: 'Modern metal',
      summary: 'Headline the arena: Drop D riffs, a crushing breakdown and a huge chorus.',
      skills: ['drop D', 'syncopation', 'palm muting'],
      bpm: 126,
      tuning: 'dropD',
      tone: 'metal',
      sections: [
        { name: 'Intro', tab: 'w PD6:0 | PD6:5 | PD6:3 | h PD6:1 PD6:0 |', groove: 'rockHalf', crash: true, fill: true },
        { name: 'Riff A', tab: 'e 6:0pm 6:0pm PD6:3 6:0pm 6:0pm PD6:5 6:0pm 6:0pm | PD6:7 PD6:5 6:0pm 6:0pm q PD6:3 PD6:0 |', repeat: 2, groove: 'metal', crash: true },
        { name: 'Riff B', tab: 'e 6:0pm PD6:0 6:0pm 6:0pm PD6:0 6:0pm 6:0pm PD6:3 | 6:0pm 6:0pm PD6:5 6:0pm q PD6:3 PD6:0 |', repeat: 2, groove: 'metal' },
        { name: 'Chorus', tab: 'h PD6:5 PD6:3 | PD6:7 PD6:5 | PD6:3 PD6:1 | w PD6:0 |', groove: 'drive', crash: true, fill: true },
        { name: 'Riff A', tab: 'e 6:0pm 6:0pm PD6:3 6:0pm 6:0pm PD6:5 6:0pm 6:0pm | PD6:7 PD6:5 6:0pm 6:0pm q PD6:3 PD6:0 |', repeat: 2, groove: 'metal' },
        { name: 'Breakdown', tab: 'q 6:0pm 6:0pm e 6:0pm 6:0pm q PD6:1 | q 6:0pm e 6:0pm 6:0pm q 6:0pm PD6:3 |', repeat: 2, groove: 'rockHalf', crash: true },
        { name: 'Chorus', tab: 'h PD6:5 PD6:3 | PD6:7 PD6:5 | PD6:3 PD6:1 | w PD6:0 |', groove: 'drive', crash: true },
        { name: 'Outro', tab: 'q PD6:0 r PD6:0 r | w PD6:0 |', groove: 'stop', crash: true },
      ],
    },
  ],
};
