# Fretforge

**Forge your sound.** A guitar learning game for rock, pop-punk and metal. It listens to you play through your microphone, scores every note, and takes you from your first open string to full songs with a band.

Everything is original: the venues, the art, the lessons and all 31 songs were written for Fretforge.

## Play it

- **Online:** https://markbus7.github.io/guitar-trainer/
- **On your own computer:** install [Node.js](https://nodejs.org) 22 or newer, then run:

  ```bash
  npm install
  npm run dev
  ```

  and open http://localhost:5173.

### What you need

- **A guitar.** Electric, acoustic or semi-acoustic all work.
- **A microphone.** The built-in mic of a laptop or phone is fine. A USB audio interface with the guitar plugged in gives the cleanest signal.
- **Headphones (recommended).** With headphones the full band plays and the mic only hears you. On speakers, Fretforge leaves the guide guitar and bass out so it does not grade its own sound.
- **A recent browser:** Chrome, Edge, Firefox or Safari. Avoid Bluetooth headphones: their delay makes timing feel late.

## The tour

Nine venues, from the garage to the main stage. Each one ends with a gig: an original song you play with a synthesized band.

| Stop | Venue | You learn |
| --- | --- | --- |
| 1 | The Garage | Holding the guitar and pick, tuning, reading tab, the open strings |
| 2 | The Basement | Fretting, one finger per fret, the spider warm-up, first riffs and a melody |
| 3 | The Dive Bar | Power chords: E5, A5, D5, movable shapes, rocking eighths |
| 4 | The Skate Park | Pop-punk: palm muting, down-strokes, mute-then-explode, octave riffs |
| 5 | The Campfire | Open chords: Em, E, Am, C, G, D, one-minute changes, the go-to strum |
| 6 | The Furnace | Metal rhythm: chugs, the gallop, the chromatic crawl, down-picking stamina |
| 7 | The Theater | Lead guitar: the minor pentatonic, hammer-ons, pull-offs, slides, bends, licks |
| 8 | The Arena | Alternate picking, tremolo picking, Drop D, syncopation |
| 9 | Main Stage | Four encore songs that put it all together |

## Free play

Don't feel like following the tour? The **Free play** tab opens every song straight away.

- **Songs:** 19 songbook songs plus the 12 tour gigs, in pop-punk, punk, rock, blues, metal and acoustic, from level 1 (first weeks) to 5. Filter by style and level, search, and sort.
- **Riffs:** the short riffs from the tour, always open.
- **My tabs:** paste a tab or chord sheet you found online and play it on the highway with drums and scoring. Six-line ASCII tab (with bar lines, hammer-ons, pull-offs, slides, bends, palm-mute lines, repeats, capo and tuning notes) and lines of chord names both work. Tab doesn't say how long notes last, so the rhythm is a best guess: start in Practice mode.

## Sync across devices

**Settings → Sync across devices** keeps stars, XP, streak, achievements and your own tabs the same on all your devices. [Create a GitHub token](https://github.com/settings/tokens/new?scopes=gist&description=Fretforge%20sync) with only the `gist` scope, paste it and connect; do the same on your other devices. Fretforge stores everything in one private gist on your account. The token stays in that browser's local storage and is only sent to api.github.com. Merging keeps the best of both devices, so syncing never loses stars.

### Ways to play a lesson

- **Practice:** the notes wait for you. No band and no rush. Tap **Hear it** to hear the target, or **Skip**. Earns 1 star.
- **Play:** real time with the band, scored with streaks and multipliers. Up to 3 stars at full speed.
- **Listen:** hear and watch how it goes before you try it.
- **Speed:** 50%, 70%, 85% or 100% of the song tempo.

Walkthroughs teach a new idea step by step and listen while you try it. Drills (like one-minute chord changes) build speed. XP, ten ranks from Rookie to Fretforge Legend, a daily goal, a streak and 19 achievements keep you coming back.

### Tools

- **Tuner** for standard, Drop D, E♭, D standard and Drop C, with reference tones.
- **Chord library** with open, power, colour and barre chord shapes, and a "Test me" button that listens for the chord.
- **Amp monitor** (Settings): hear your guitar through the built-in amp simulator in your headphones. Great for a semi-acoustic plugged into an audio interface.

### Tips

- Tune at the start of every session.
- Ten minutes a day beats an hour on Sunday.
- Get a part clean in Practice, then Play it at 70%, then speed up.
- If hits feel early or late, run **Settings → Timing offset → Calibrate**.
- If quiet notes are missed, raise **Sensitivity**. In a noisy room, lower it.

### Privacy

Fretforge runs entirely in your browser. Microphone audio is analysed on your device and is never recorded or uploaded. Progress is saved in your browser's local storage (and in your own private gist if you turn on sync).

## For developers

```bash
npm install         # install dependencies
npm run dev         # dev server on http://localhost:5173
npm test            # unit tests, including a simulated guitarist playing every lesson
npm run typecheck   # TypeScript
npm run build       # production build in dist/
npm run preview     # serve the production build
```

**Stack:** React 19, TypeScript and Vite. Zustand for state. No audio samples: the guitar (Karplus-Strong), amp, bass and drums are synthesized with the Web Audio API.

**How it listens:** an AudioWorklet captures the mic and hands blocks to a Web Worker, which runs the analyzer in `src/audio/dsp/`: YIN pitch tracking, onset detection, and a chroma-based chord matcher. Events are timestamped in AudioContext time, corrected for output and input latency, and judged against the chart.

```
src/
  audio/      mic capture, analyzer worker, DSP, synth band, amp simulator
  content/    the curriculum (9 chapters, 56 lessons) and the Free play songbook, in a compact tab language
  game/       charts, judging, sessions, band arrangement, XP and progression
  music/      notes, tunings, chord shapes, the tab parser, the tab/chord-sheet importer
  sync/       merge rules and the GitHub gist client
  render/     the canvas note highway
  state/      settings and progress (saved to localStorage)
  ui/         screens, components and art
tests/        DSP, curriculum, full playthroughs, importer, sync and progression tests
```

### Writing lessons

Lessons live in `src/content/chapters/`, Free play songs in `src/content/songbook/`. Riffs use a small tab language:

```
q e s h w        note length (quarter, eighth, sixteenth, half, whole); q. dotted, e3 triplet
6:0              string 6 (low E), fret 0
5:3pm            palm muted          3:7b2   bend up a whole step (b1 = half step)
h3:7 p3:5 /3:9   hammer-on, pull-off, slide
[Em] [G-rock]d   chord from the library (d / u = strum direction)
[x02210=Am]      chord from raw frets, low E first, with an optional name
P6:3  PP6:3      power chord rooted on string 6, fret 3 (2 or 3 notes)
PD6:5            one-finger Drop D power chord
O5:3             octave shape
X  r  -          muted strum, rest, tie
|                bar line (every bar must be full)
( ... )x4        repeat a group
```

`npm test` checks that every lesson parses with full bars and known chords, that a simulated guitarist scores high when it plays each lesson well and can finish it in Practice mode, and that wrong notes score low.

## Deploying

The **Deploy** workflow publishes `main` to GitHub Pages. Switch it on once: **Settings → Pages → Build and deployment → Source: GitHub Actions**, then run the workflow from the **Actions** tab (or push to `main`). The **CI** workflow runs the type check, tests and build on every pull request.

The build uses relative paths, so `dist/` can also be hosted on any static host. The microphone needs HTTPS (or localhost).
