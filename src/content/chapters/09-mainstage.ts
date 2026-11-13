import type { Chapter } from '../types';

const PM8 = (c: string) => Array(8).fill(`${c}pm`).join(' ');
const GALLOP = '( e 6:0pm s 6:0pm 6:0pm )';
const STRUM = (c: string) => `e [${c}]d r [${c}]d [${c}]u r [${c}]u [${c}]d [${c}]u |`;

export const mainstage: Chapter = {
  id: 'mainstage',
  venue: 'Main Stage',
  title: 'Encore',
  blurb: 'Full songs that mix everything you have learned. The crowd is waiting.',
  accent: '#ffe08a',
  art: 'mainstage',
  lessons: [
    {
      id: 'stage-thunder-lane',
      title: 'Thunder Lane',
      kind: 'song',
      style: 'Classic rock',
      genre: 'rock',
      level: 4,
      summary: 'A riff-driven road song: single-note hooks and big power chords.',
      skills: ['riffs', 'power chords'],
      bpm: 116,
      tone: 'crunch',
      sections: [
        { name: 'Intro', tab: 'e 6:5 6:5 6:8 6:5 6:7 6:5 q P6:3 | e 6:5 6:5 6:8 6:5 6:7 6:5 q P5:5 |', repeat: 2, groove: 'rock', crash: true },
        { name: 'Verse', tab: 'e P6:5 P6:5 P6:5 P6:5 P5:5 P5:5 P5:5 P5:5 | P6:3 P6:3 P6:3 P6:3 P5:3 P5:3 P5:3 P5:3 |', repeat: 2, groove: 'rock' },
        { name: 'Chorus', tab: 'q P6:5 P6:5 h P5:7 | q P5:5 P5:5 h P6:3 | q P6:5 P6:5 h P5:7 | w P6:5 |', groove: 'drive', crash: true, fill: true },
        { name: 'Riff', tab: 'e 6:5 6:5 6:8 6:5 6:7 6:5 q P6:3 | e 6:5 6:5 6:8 6:5 6:7 6:5 q P5:5 |', groove: 'rock' },
        { name: 'Verse', tab: 'e P6:5 P6:5 P6:5 P6:5 P5:5 P5:5 P5:5 P5:5 | P6:3 P6:3 P6:3 P6:3 P5:3 P5:3 P5:3 P5:3 |', repeat: 2, groove: 'rock' },
        { name: 'Chorus', tab: 'q P6:5 P6:5 h P5:7 | q P5:5 P5:5 h P6:3 | q P6:5 P6:5 h P5:7 | w P6:5 |', repeat: 2, groove: 'drive', crash: true },
        { name: 'Outro', tab: 'e 6:5 6:5 6:8 6:5 6:7 6:5 q P6:3 | w P6:5 |', groove: 'stop', crash: true },
      ],
    },
    {
      id: 'stage-voltage',
      title: 'Voltage',
      kind: 'song',
      style: 'Pop-punk',
      genre: 'pop-punk',
      level: 5,
      summary: 'Full-speed skate punk: an octave hook, muted verses and a chorus built for shouting.',
      skills: ['octaves', 'palm muting', 'down-strokes'],
      bpm: 176,
      tone: 'punk',
      tips: [
        {
          title: 'Ride the energy',
          body: 'At this speed, keep your palm and wrist loose and let the down-strokes bounce. Use 60–70% tempo until the chord changes are automatic.',
        },
      ],
      sections: [
        { name: 'Hook', tab: 'e O5:7 O5:7 O5:9 O5:7 q O5:11 O5:9 | e O5:7 O5:7 O5:9 O5:7 q O5:4 O5:2 |', repeat: 2, groove: 'skate', crash: true },
        { name: 'Verse', tab: `e ${PM8('P5:7')} | ${PM8('P6:7')} | ${PM8('P6:9')} | ${PM8('P6:5')} |`, groove: 'punk' },
        { name: 'Chorus', tab: 'e P5:7 P5:7 P5:7 P5:7 P6:7 P6:7 P6:7 P6:7 | P6:9 P6:9 P6:9 P6:9 P6:5 P6:5 P6:5 P6:5 |', repeat: 2, groove: 'skate', crash: true, fill: true },
        { name: 'Hook', tab: 'e O5:7 O5:7 O5:9 O5:7 q O5:11 O5:9 | e O5:7 O5:7 O5:9 O5:7 q O5:4 O5:2 |', groove: 'skate' },
        { name: 'Verse', tab: `e ${PM8('P5:7')} | ${PM8('P6:7')} | ${PM8('P6:9')} | ${PM8('P6:5')} |`, groove: 'punk' },
        { name: 'Bridge', tab: 'q P6:5 r P6:5 r | P6:7 r e P6:7 P6:7 P6:7 P6:7 |', groove: 'stop', fill: true },
        { name: 'Chorus', tab: 'e P5:7 P5:7 P5:7 P5:7 P6:7 P6:7 P6:7 P6:7 | P6:9 P6:9 P6:9 P6:9 P6:5 P6:5 P6:5 P6:5 |', repeat: 2, groove: 'skate', crash: true },
        { name: 'Outro', tab: 'q P5:7 P5:7 P5:7 r | w P5:7 |', groove: 'stop', crash: true },
      ],
    },
    {
      id: 'stage-hollow-moon',
      title: 'Hollow Moon',
      kind: 'song',
      style: 'Acoustic rock',
      genre: 'acoustic',
      level: 4,
      summary: 'Made for the semi-acoustic: a picked chord intro, strummed verses and a soaring chorus.',
      skills: ['arpeggios', 'open chords', 'strumming'],
      bpm: 72,
      tone: 'acoustic',
      tips: [
        {
          title: 'Arpeggios',
          body: 'Hold the whole chord shape down and pick the strings one at a time, letting them ring together. Hold Em, C, G and D in turn.',
          figure: { type: 'chords', chords: ['Em', 'C', 'G', 'D'] },
        },
      ],
      sections: [
        {
          name: 'Intro',
          tab: `e 6:0 4:2 3:0 2:0 1:0 2:0 3:0 4:2 | 5:3 4:2 3:0 2:1 1:0 2:1 3:0 4:2 |
                e 6:3 5:2 4:0 3:0 2:0 1:3 2:0 3:0 | 4:0 3:2 2:3 1:2 2:3 3:2 4:0 3:2 |`,
          groove: 'none',
          bass: 'none',
        },
        { name: 'Verse', tab: `${STRUM('Em')} ${STRUM('C')} ${STRUM('G')} ${STRUM('D')}`, groove: 'ballad', bass: 'E C G D', crash: true },
        { name: 'Chorus', tab: 'h [Am]d [Am]d | [C]d [C]d | [G]d [G]d | [D]d [D]d |', repeat: 2, groove: 'rockHalf', bass: 'A C G D', crash: true },
        { name: 'Verse', tab: `${STRUM('Em')} ${STRUM('C')} ${STRUM('G')} ${STRUM('D')}`, groove: 'ballad', bass: 'E C G D' },
        { name: 'Chorus', tab: 'h [Am]d [Am]d | [C]d [C]d | [G]d [G]d | [D]d [D]d |', repeat: 2, groove: 'rockHalf', bass: 'A C G D', crash: true },
        { name: 'Outro', tab: 'e 6:0 4:2 3:0 2:0 1:0 2:0 3:0 4:2 | w [Em] |', groove: 'none', bass: 'E E' },
      ],
    },
    {
      id: 'stage-ashes',
      title: 'Ashes & Anvils',
      kind: 'song',
      style: 'Thrash metal',
      genre: 'metal',
      level: 5,
      summary: 'The final boss: blistering gallops, chromatic verses and a crushing chorus.',
      skills: ['gallop', 'chromatic', 'stamina'],
      bpm: 150,
      tone: 'metal',
      tips: [
        {
          title: 'Earn it',
          body: 'Thrash is a marathon. Learn it at 60% in Practice mode, then work up in Play mode. When you three-star this, you are a Forge Legend.',
        },
      ],
      sections: [
        {
          name: 'Intro',
          tab: `${GALLOP}x4 | ${GALLOP}x2 e P6:1 s P6:1pm P6:1pm e P6:3 s P6:3pm P6:3pm |`,
          repeat: 2,
          groove: 'gallop',
          crash: true,
        },
        { name: 'Verse', tab: 'e 6:0pm 6:0pm 6:3 6:0pm 6:0pm 6:5 6:0pm 6:6 | 6:0pm 6:0pm 6:5 6:3 q P6:1 P6:0 |', repeat: 2, groove: 'thrash' },
        { name: 'Chorus', tab: 'h P6:7 P6:5 | P6:3 q P6:1 P6:0 | h P6:7 P6:8 | w P6:7 |', groove: 'drive', crash: true, fill: true },
        {
          name: 'Gallop',
          tab: `${GALLOP}x4 | ${GALLOP}x2 e P6:1 s P6:1pm P6:1pm e P6:3 s P6:3pm P6:3pm |`,
          groove: 'gallop',
        },
        { name: 'Verse', tab: 'e 6:0pm 6:0pm 6:3 6:0pm 6:0pm 6:5 6:0pm 6:6 | 6:0pm 6:0pm 6:5 6:3 q P6:1 P6:0 |', repeat: 2, groove: 'thrash' },
        { name: 'Chorus', tab: 'h P6:7 P6:5 | P6:3 q P6:1 P6:0 | h P6:7 P6:8 | w P6:7 |', repeat: 2, groove: 'drive', crash: true },
        { name: 'Outro', tab: 'e P6:0 P6:0 P6:0 P6:0 q P6:0 r | w P6:0 |', groove: 'stop', crash: true },
      ],
    },
  ],
};
