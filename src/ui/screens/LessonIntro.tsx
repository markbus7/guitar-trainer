import { useMemo, useState } from 'react';
import { unlockAudio } from '../../audio/engine';
import { MY_TABS_CHAPTER, SONGBOOK_CHAPTER, findLesson, isFreePlay, maxStars } from '../../content/curriculum';
import { GENRES } from '../../content/genres';
import type { Lesson } from '../../content/types';
import { buildChart } from '../../game/chart';
import type { SessionMode } from '../../game/session';
import { CHORDS, notesToFrets } from '../../music/chords';
import { TUNINGS } from '../../music/notes';
import { useProgress } from '../../state/progress';
import { useSettings } from '../../state/settings';
import { VenueArt } from '../art/VenueArt';
import { ChordDiagram } from '../components/ChordDiagram';
import { Figure } from '../components/Figure';
import { Icon, type IconName } from '../components/Icon';
import { enableMic, MicPanel } from '../components/MicPanel';
import { RichText } from '../components/RichText';
import { Stars } from '../components/Stars';
import { TabView } from '../components/TabView';
import { goBack, navigate } from '../router';
import { KIND_LABEL, TONE_LABEL } from './labels';

const MODES: { id: SessionMode; icon: IconName; title: string; text: string }[] = [
  { id: 'practice', icon: 'hand', title: 'Practice', text: 'The highway waits for every note. No band, no rush. Earns 1 star.' },
  { id: 'play', icon: 'flame', title: 'Play', text: 'Real time with the band, scored with streaks. Up to 3 stars at full speed.' },
  { id: 'listen', icon: 'ear', title: 'Listen', text: 'Hear how it goes first. Nothing is scored, the mic stays off.' },
];

const TEMPOS = [0.5, 0.7, 0.85, 1];

export function LessonIntro({ lesson }: { lesson: Lesson }) {
  const info = findLesson(lesson.id)!;
  const chapter = info.chapter;
  const free = isFreePlay(lesson.id);
  const mine = chapter === MY_TABS_CHAPTER;
  const back = mine ? '/songs?tab=mine' : chapter === SONGBOOK_CHAPTER ? '/songs' : `/chapter/${chapter.id}`;
  const accent = lesson.genre && free ? GENRES[lesson.genre].color : chapter.accent;
  const rec = useProgress((s) => s.lessons[lesson.id]);
  const output = useSettings((s) => s.output);
  const leftHanded = useSettings((s) => s.leftHanded);
  const [mode, setMode] = useState<SessionMode>(rec?.stars ? 'play' : lesson.mode ?? 'play');
  const [tempo, setTempo] = useState(1);
  const chart = useMemo(() => buildChart(lesson, 1), [lesson]);

  const chords = useMemo(() => {
    const seen = new Map<string, { name: string; frets: (number | null)[]; fingers?: (number | null)[]; id?: string }>();
    for (const n of chart.notes) {
      if (n.kind !== 'chord' || !n.name) continue;
      const frets = notesToFrets(n.notes.map((s) => ({ string: s.string, fret: s.fret })));
      const key = `${n.name}:${frets.join(',')}`;
      if (seen.has(key)) continue;
      const lib = n.chordId ? CHORDS[n.chordId] : undefined;
      const fingers: (number | null)[] = [null, null, null, null, null, null];
      for (const s of n.notes) fingers[6 - s.string] = s.finger || null;
      seen.set(key, { name: n.name, frets, fingers: lib?.fingers ?? fingers, id: lib?.id });
      if (seen.size >= 8) break;
    }
    return [...seen.values()];
  }, [chart]);

  const start = () => {
    void unlockAudio();
    if (mode !== 'listen') void enableMic();
    navigate(`/play/${lesson.id}?mode=${mode}&tempo=${tempo}`);
  };

  const firstTab = lesson.sections?.[0]?.tab;
  const tuning = lesson.tuning ?? 'standard';

  return (
    <div className="page lesson-intro" style={{ '--accent': accent } as React.CSSProperties}>
      <header className="intro-hero card">
        <VenueArt art={chapter.art} accent={accent} className="intro-art" />
        <div className="hero-shade" />
        <button className="btn btn-icon btn-ghost chapter-back" onClick={() => goBack(back)} aria-label="Back">
          <Icon name="back" />
        </button>
        <div className="intro-head">
          <span className="eyebrow">
            {free ? (mine ? 'My tab' : 'Free play') : chapter.venue} · {free ? (lesson.band ?? 'Song') : KIND_LABEL[lesson.kind]}
          </span>
          <h1>{lesson.title}</h1>
          <p className="muted">{lesson.summary}</p>
          <div className="intro-meta">
            {lesson.style && <span className="chip chip-accent">{lesson.style}</span>}
            <span className="chip">
              <Icon name="metronome" /> {lesson.bpm ?? 80} bpm
            </span>
            <span className="chip">
              <Icon name="volume" /> {TONE_LABEL[lesson.tone ?? 'crunch']}
            </span>
            {tuning !== 'standard' && <span className="chip chip-accent">{TUNINGS[tuning].name} tuning</span>}
            <span className="chip">
              <Icon name="note" /> {chart.notes.length} notes · {Math.round(chart.duration)}s
            </span>
          </div>
          {rec && (
            <div className="intro-best">
              <Stars value={rec.stars} max={maxStars(lesson)} />
              <span className="faint">
                Best {Math.round(rec.bestAccuracy * 100)}% · {rec.bestScore.toLocaleString()} pts
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="intro-grid">
        <div className="intro-main">
          {lesson.skills?.length ? (
            <div className="skills">
              {lesson.skills.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          ) : null}

          {lesson.tips?.map((t, i) => (
            <article key={i} className="tip card">
              <h3>{t.title}</h3>
              <RichText text={t.body} />
              {t.figure && <Figure figure={t.figure} />}
            </article>
          ))}

          {chords.length > 0 && (
            <article className="tip card">
              <h3>Shapes in this {lesson.kind === 'song' ? 'song' : 'lesson'}</h3>
              <div className="figure-chords">
                {chords.map((c) => (
                  <ChordDiagram key={c.name + c.frets.join()} frets={c.frets} fingers={c.fingers} name={c.name} chord={c.id ? CHORDS[c.id] : undefined} size={112} leftHanded={leftHanded} />
                ))}
              </div>
            </article>
          )}

          {mine && (
            <article className="tip card">
              <h3>Your own tab</h3>
              <p className="muted">
                Tab doesn't say how long each note lasts, so the rhythm here is a best guess. Start in Practice mode, where the highway waits for you, and change the tempo or fix the tab if something feels off.
              </p>
              <div>
                <button className="btn btn-sm" onClick={() => navigate(`/songs/edit/${lesson.id}`)}>
                  <Icon name="edit" /> Edit tab
                </button>
              </div>
            </article>
          )}

          {firstTab && (
            <article className="tip card">
              <h3>How it starts</h3>
              <TabView tab={firstTab} tuning={tuning} maxBars={4} />
              {tuning !== 'standard' && (
                <p className="faint">
                  Tune to {TUNINGS[tuning].name} first: {TUNINGS[tuning].description}{' '}
                  <a href="#/tuner" onClick={(e) => (e.preventDefault(), navigate('/tuner'))}>
                    Open the tuner
                  </a>
                </p>
              )}
            </article>
          )}
        </div>

        <aside className="intro-side card">
          <h3>How do you want to play?</h3>
          <div className="modes" role="radiogroup">
            {MODES.map((m) => (
              <button key={m.id} role="radio" aria-checked={mode === m.id} className={`mode-card ${mode === m.id ? 'on' : ''}`} onClick={() => setMode(m.id)}>
                <Icon name={m.icon} />
                <span>
                  <strong>{m.title}</strong>
                  <span className="faint">{m.text}</span>
                </span>
              </button>
            ))}
          </div>
          {mode !== 'practice' && (
            <div className="field">
              <span className="label">
                Speed <span className="faint">{Math.round((lesson.bpm ?? 80) * tempo)} bpm</span>
              </span>
              <div className="segmented">
                {TEMPOS.map((t) => (
                  <button key={t} aria-pressed={tempo === t} onClick={() => setTempo(t)}>
                    {Math.round(t * 100)}%
                  </button>
                ))}
              </div>
              {tempo < 1 && mode === 'play' && <span className="faint small">Slower runs can earn up to {tempo < 0.75 ? 1 : 2} stars.</span>}
            </div>
          )}
          {mode === 'play' && output === 'speakers' && (
            <p className="note">
              <Icon name="speaker" /> On speakers the band plays drums only, so Fretforge can hear your guitar. Use headphones for the full band.
            </p>
          )}
          {mode !== 'listen' && <MicPanel compact />}
          <button className="btn btn-primary btn-lg btn-block" onClick={start}>
            <Icon name="play" /> {mode === 'listen' ? 'Listen' : mode === 'practice' ? 'Start practice' : 'Let’s rock'}
          </button>
        </aside>
      </div>
    </div>
  );
}
