import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getEngine, unlockAudio } from '../../audio/engine';
import { ROUND_SECONDS, TRAINER_LEVELS, nextQuestion, roundGrade, trainerLevel, trainerRecordId, type TrainerGame, type TrainerLevel, type TrainerQuestion } from '../../game/trainers';
import { STRING_ORDINAL, noteName, prettyNote, stringLabel } from '../../music/notes';
import { useProgress } from '../../state/progress';
import { useSettings } from '../../state/settings';
import { Fretboard } from '../components/Fretboard';
import { Icon } from '../components/Icon';
import { enableMic, MicPanel } from '../components/MicPanel';
import { ProgressRing } from '../components/Stars';
import { useMicStatus } from '../hooks';
import { useListenFor } from '../listen';
import { goBack, navigate } from '../router';
import { toast } from '../toasts';

const GAME_INFO: Record<TrainerGame, { title: string; eyebrow: string; intro: string; accent: string }> = {
  notes: {
    title: 'Note Finder',
    eyebrow: 'Training · Fretboard',
    intro: 'A note name appears. Find it on the string and play it. Every right note scores a point; you have a minute. Knowing where the notes are is how you find power chords, read chord sheets and jam with friends.',
    accent: '#5cc8ff',
  },
  ear: {
    title: 'Echo',
    eyebrow: 'Training · Ear',
    intro: 'Fretforge plays a note. Find it on your guitar and play it back. Tap Hear again as often as you like. Ear training is how you start working out riffs from songs you love.',
    accent: '#b388ff',
  },
};

const GRADE_TEXT = ['Warming up. Every round makes the next one easier.', 'Good round! The notes are starting to stick.', 'Great round! You are learning the neck fast.', 'Legendary. This is fretboard mastery.'];

type Phase = 'pick' | 'countdown' | 'running' | 'done';

export function TrainerScreen({ game, levelId }: { game: TrainerGame; levelId?: string }) {
  const info = GAME_INFO[game];
  const levels = TRAINER_LEVELS.filter((l) => l.game === game);
  const level = (levelId && trainerLevel(levelId)?.game === game ? trainerLevel(levelId) : undefined) ?? null;
  const lessons = useProgress((s) => s.lessons);

  return (
    <div className="page trainer" style={{ '--accent': info.accent } as React.CSSProperties}>
      <header className="learn-top">
        <button className="btn btn-icon btn-ghost" onClick={() => (level ? navigate(`/training/${game}`, { replace: true }) : goBack('/training'))} aria-label="Back">
          <Icon name="back" />
        </button>
        <div>
          <span className="eyebrow">{info.eyebrow}</span>
          <h2>
            {info.title}
            {level && <span className="faint"> · {level.title}</span>}
          </h2>
        </div>
      </header>
      {level ? (
        <TrainerRound key={level.id} level={level} />
      ) : (
        <div className="trainer-pick rise">
          <p className="muted trainer-intro">{info.intro}</p>
          <div className="level-grid">
            {levels.map((l, i) => {
              const best = lessons[trainerRecordId(l.id)]?.bestCount ?? 0;
              return (
                <button key={l.id} className="level-card card" onClick={() => navigate(`/training/${game}/${l.id}`)}>
                  <span className="level-num">{i + 1}</span>
                  <span className="level-body">
                    <strong>{l.title}</strong>
                    <span className="faint">{l.blurb}</span>
                  </span>
                  <span className="level-best">
                    {best > 0 ? (
                      <>
                        <strong>{best}</strong>
                        <small className="faint">best</small>
                      </>
                    ) : (
                      <Icon name="play" width={18} height={18} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TrainerRound({ level }: { level: TrainerLevel }) {
  const game = level.game;
  const leftHanded = useSettings((s) => s.leftHanded);
  const recordId = trainerRecordId(level.id);
  const best = useProgress((s) => s.lessons[recordId]?.bestCount ?? 0);
  const { status } = useMicStatus();
  const [phase, setPhase] = useState<Phase>('pick');
  const [q, setQ] = useState<TrainerQuestion>(() => nextQuestion(level, null));
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [countdown, setCountdown] = useState(3);
  const [reveal, setReveal] = useState<{ q: TrainerQuestion; ok: boolean } | null>(null);
  const [hinted, setHinted] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const startedAt = useRef(0);
  const busy = useRef(false);

  const play = useCallback((question: TrainerQuestion) => {
    void unlockAudio().then(() => getEngine().previewNote(question.midi, 1.1));
  }, []);

  const advance = useCallback(
    (ok: boolean) => {
      if (busy.current) return;
      busy.current = true;
      setReveal({ q, ok });
      if (ok) setScore((s) => s + 1);
      else setMisses((m) => m + 1);
      setTimeout(
        () => {
          const nq = nextQuestion(level, q);
          setQ(nq);
          setHinted(false);
          setReveal(null);
          busy.current = false;
          if (game === 'ear') play(nq);
        },
        ok ? 650 : 1500,
      );
    },
    [q, level, game, play],
  );

  const heard = useListenFor(phase === 'running' && !reveal ? { kind: 'note', midis: [q.midi] } : null, () => advance(true));

  useEffect(() => {
    if (phase === 'countdown') {
      setCountdown(3);
      const id = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(id);
            startedAt.current = performance.now();
            setPhase('running');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(id);
    }
    if (phase === 'running') {
      if (game === 'ear') play(q);
      const id = setInterval(() => {
        const remaining = Math.max(0, ROUND_SECONDS - (performance.now() - startedAt.current) / 1000);
        setLeft(remaining);
        if (remaining <= 0) {
          clearInterval(id);
          setPhase('done');
        }
      }, 100);
      return () => clearInterval(id);
    }
    // Starting the countdown and the clock only depends on the phase.
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'done') return;
    const progress = useProgress.getState();
    progress.addTime(ROUND_SECONDS);
    const tries = score + misses;
    const outcome = progress.record({ lessonId: recordId, mode: 'drill', stars: 0, score: score * 100, accuracy: tries ? score / tries : 0, tempo: 1, count: score });
    setNewBest(score > 0 && score > best);
    for (const x of outcome.unlocked) toast({ tone: 'achievement', title: x.title, body: x.description });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    await unlockAudio();
    const ok = status === 'running' || (await enableMic());
    if (!ok) return;
    setScore(0);
    setMisses(0);
    setLeft(ROUND_SECONDS);
    setReveal(null);
    setHinted(false);
    busy.current = false;
    setQ(nextQuestion(level, null));
    setPhase('countdown');
  };

  const fretRange: [number, number] = [Math.max(1, level.frets[0]), Math.max(level.frets[1], 5)];
  const shown = reveal?.q ?? (hinted ? q : null);
  const marks = useMemo(
    () => (shown ? [{ string: shown.string, fret: shown.fret, label: noteName(shown.midi, { octave: false }), color: reveal ? (reveal.ok ? '#4be3a4' : '#ff5c7a') : undefined }] : []),
    [shown, reveal],
  );

  const name = prettyNote(q.midi, { octave: false });
  const stringText = `${STRING_ORDINAL[q.string]} string (${stringLabel('standard', q.string)})`;

  if (phase === 'pick' || phase === 'done') {
    const grade = roundGrade(score);
    return (
      <div className="drill-intro card rise trainer-card">
        {phase === 'done' ? (
          <>
            <span className="eyebrow">Time!</span>
            <h1>
              {score} {score === 1 ? 'note' : 'notes'}
            </h1>
            {newBest && (
              <span className="chip chip-accent">
                <Icon name="trophy" /> New best
              </span>
            )}
            <p className="muted">{GRADE_TEXT[grade]}</p>
            {misses > 0 && <p className="faint">Skipped {misses}. Tap Hint whenever you are unsure: looking it up is how it sticks.</p>}
          </>
        ) : (
          <>
            <p className="muted">{level.blurb}</p>
            <ul className="trainer-rules">
              {game === 'notes' ? (
                <>
                  <li>Read the note and the string, then play it. Any octave counts.</li>
                  <li>Not sure? Tap <strong>Hint</strong> to see where it is, or <strong>Skip</strong>.</li>
                  <li>Natural notes go up in the order A B C D E F G, then start again at A. Between B–C and E–F there is just one fret; everywhere else, two.</li>
                </>
              ) : (
                <>
                  <li>Listen to the note, then search for it {level.strings.length === 1 ? 'on the low E string' : 'on the strings shown'}. Slide up and down until it matches.</li>
                  <li>Tap <strong>Hear again</strong> as often as you need. Headphones help, so the mic only hears you.</li>
                </>
              )}
            </ul>
            {best > 0 && <p className="faint">Your best: {best}</p>}
          </>
        )}
        <MicPanel compact />
        <div className="results-actions">
          <button className="btn btn-primary btn-lg" onClick={start}>
            <Icon name={phase === 'done' ? 'refresh' : 'play'} /> {phase === 'done' ? 'Again' : 'Start the clock'}
          </button>
          {phase === 'done' && (
            <button className="btn btn-ghost" onClick={() => navigate(`/training/${game}`, { replace: true })}>
              Other levels
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="trainer-run">
      <div className={`trainer-target card ${reveal ? (reveal.ok ? 'is-ok' : 'is-miss') : ''}`}>
        {phase === 'countdown' ? (
          <>
            <span className="eyebrow">Get ready</span>
            <strong className="trainer-note">{countdown}</strong>
          </>
        ) : game === 'notes' ? (
          <>
            <span className="eyebrow">Play</span>
            <strong className="trainer-note">{name}</strong>
            <span className="trainer-where">on the {stringText}</span>
          </>
        ) : (
          <>
            <span className="eyebrow">{reveal ? 'It was' : 'Find this note'}</span>
            <strong className="trainer-note">{reveal ? prettyNote(reveal.q.midi, { octave: false }) : '?'}</strong>
            <span className="trainer-where">{level.frets[1] === 0 ? 'an open string' : level.strings.length === 1 ? 'on the low E string' : level.strings.length === 2 ? 'on the E or A string' : `frets ${level.frets[0]}–${level.frets[1]}`}</span>
          </>
        )}
        <div className="trainer-board">
          <Fretboard marks={marks} frets={fretRange} leftHanded={leftHanded} height={120} />
        </div>
        {phase === 'running' && (
          <div className="trainer-tools">
            {game === 'ear' && (
              <button className="btn btn-sm" onClick={() => play(q)} disabled={!!reveal}>
                <Icon name="volume" /> Hear again
              </button>
            )}
            <button className="btn btn-sm" onClick={() => setHinted(true)} disabled={hinted || !!reveal}>
              <Icon name="info" /> Hint
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => advance(false)} disabled={!!reveal}>
              Skip <Icon name="next" />
            </button>
          </div>
        )}
      </div>
      <div className="drill-side">
        <ProgressRing value={phase === 'countdown' ? 1 : left / ROUND_SECONDS} size={150} stroke={12}>
          <strong>{phase === 'countdown' ? countdown : Math.ceil(left)}</strong>
          <small>{phase === 'countdown' ? '' : 'sec'}</small>
        </ProgressRing>
        <div className="big-stat">
          <strong>{score}</strong>
          <span className="faint">notes</span>
        </div>
        {heard.heard && heard.wrong && !reveal && <p className="check-heard bad">Heard {heard.heard}</p>}
        {reveal?.ok && <p className="check-heard good">Yes!</p>}
      </div>
    </div>
  );
}
