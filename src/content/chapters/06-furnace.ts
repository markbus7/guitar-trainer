import type { Chapter } from '../types';

const GALLOP = '( e 6:0pm s 6:0pm 6:0pm )';

export const furnace: Chapter = {
  id: 'furnace',
  venue: 'The Furnace',
  title: 'Heavy Rhythm',
  blurb: 'Metal rhythm guitar: tight chugs, gallops and chromatic riffs forged in fire.',
  accent: '#ff3b30',
  art: 'furnace',
  lessons: [
    {
      id: 'furnace-chugs',
      title: 'Metal chugs',
      kind: 'riff',
      summary: 'Palm-muted low E chugs punctuated by power chord hits.',
      skills: ['palm muting', 'power chords'],
      bpm: 100,
      tone: 'metal',
      tips: [
        {
          title: 'Tight, not loud',
          body: 'High gain makes everything louder, including mistakes. Keep the palm firmly on the bridge for the chugs and lift it only for the chord hits.',
        },
      ],
      sections: [
        {
          tab: `e 6:0pm 6:0pm 6:0pm 6:0pm P6:3 6:0pm 6:0pm P6:5 | 6:0pm 6:0pm 6:0pm 6:0pm q P6:3 P6:1 |
                e 6:0pm 6:0pm 6:0pm 6:0pm P6:7 6:0pm 6:0pm P6:5 | 6:0pm 6:0pm P6:3 6:0pm q P6:1 P6:0 |`,
          repeat: 2,
          groove: 'metal',
        },
      ],
    },
    {
      id: 'furnace-gallop',
      title: 'The gallop',
      kind: 'riff',
      summary: 'The galloping horse rhythm of classic heavy metal: one long, two short.',
      skills: ['gallop', 'palm muting'],
      bpm: 90,
      tone: 'metal',
      tips: [
        {
          title: 'Da-da-dum',
          body: 'Each beat is an eighth note followed by two sixteenths: **down, down-up**. Say "gal-lop-ing" in time and play along with your words.',
        },
      ],
      sections: [
        {
          tab: `${GALLOP}x4 | ${GALLOP}x2 e P6:3 s P6:3pm P6:3pm e P6:5 s P6:5pm P6:5pm |`,
          repeat: 2,
          groove: 'gallop',
        },
        {
          tab: `${GALLOP}x4 | ${GALLOP}x2 e P6:7 s P6:7pm P6:7pm e P6:5 s P6:5pm P6:5pm |`,
          repeat: 2,
          groove: 'gallop',
        },
      ],
    },
    {
      id: 'furnace-chromatic',
      title: 'Chromatic crawl',
      kind: 'riff',
      summary: 'Creep up the frets between chugs for that sinister metal sound.',
      skills: ['chromatic', 'palm muting'],
      bpm: 96,
      tone: 'metal',
      sections: [
        { tab: 'e 6:0pm 6:0pm 6:1 6:0pm 6:0pm 6:2 6:0pm 6:3 | 6:0pm 6:0pm 6:4 6:3 6:2 6:1 q 6:0 |', repeat: 2, groove: 'metal' },
        { tab: 'e 5:0pm 5:0pm 5:1 5:0pm 5:0pm 5:2 5:0pm 5:3 | 5:0pm 5:0pm 5:4 5:3 5:2 5:1 q 6:0 |', repeat: 2, groove: 'metal' },
      ],
    },
    {
      id: 'furnace-stamina',
      title: 'Down-picking endurance',
      kind: 'exercise',
      summary: 'Eighth-note down-strokes for minutes on end, the workout of metal legends.',
      skills: ['down-strokes', 'stamina'],
      bpm: 112,
      tone: 'metal',
      tips: [
        {
          title: 'Build it slowly',
          body: 'Start at a tempo you can hold relaxed for the whole exercise. Add 5 bpm each day. Speed is a side effect of staying relaxed.',
        },
      ],
      sections: [
        {
          tab: `( e 6:0pm 6:0pm 6:0pm 6:0pm 6:0pm 6:0pm P6:3 P6:5 | )x3 e 6:0pm 6:0pm 6:0pm 6:0pm q P6:7 P6:5 |`,
          repeat: 2,
          groove: 'thrash',
        },
      ],
    },
    {
      id: 'furnace-gig',
      title: 'Iron Forge',
      kind: 'song',
      style: 'Heavy metal',
      summary: 'Sparks fly: a galloping heavy metal anthem with a chromatic verse.',
      skills: ['gallop', 'chromatic', 'power chords'],
      bpm: 112,
      tone: 'metal',
      sections: [
        { name: 'Intro', tab: 'w P6:0 | P6:3 | h P6:5 P6:3 | w P6:0 |', groove: 'rockHalf', crash: true, fill: true },
        {
          name: 'Gallop riff',
          tab: `${GALLOP}x2 e P6:3 s P6:3pm P6:3pm e P6:5 s P6:5pm P6:5pm | ${GALLOP}x2 e P6:7 s P6:7pm P6:7pm e P6:5 s P6:5pm P6:5pm |`,
          repeat: 2,
          groove: 'gallop',
          crash: true,
        },
        { name: 'Verse', tab: 'e 6:0pm 6:0pm 6:1 6:0pm 6:0pm 6:2 6:0pm 6:3 | 6:0pm 6:0pm 6:4 6:3 6:2 6:1 q 6:0 |', repeat: 2, groove: 'metal' },
        { name: 'Chorus', tab: 'h P6:3 P6:5 | P6:7 q P6:5 P6:3 | h P5:5 P5:3 | w P6:0 |', groove: 'drive', crash: true, fill: true },
        {
          name: 'Gallop riff',
          tab: `${GALLOP}x2 e P6:3 s P6:3pm P6:3pm e P6:5 s P6:5pm P6:5pm | ${GALLOP}x2 e P6:7 s P6:7pm P6:7pm e P6:5 s P6:5pm P6:5pm |`,
          repeat: 2,
          groove: 'gallop',
        },
        { name: 'Chorus', tab: 'h P6:3 P6:5 | P6:7 q P6:5 P6:3 | h P5:5 P5:3 | w P6:0 |', repeat: 2, groove: 'drive', crash: true },
        { name: 'Outro', tab: `${GALLOP}x4 | w P6:0 |`, groove: 'gallop', crash: true },
      ],
    },
  ],
};
