import { useEffect, useMemo, useRef, useState } from 'react';
import { unlockAudio } from '../../audio/engine';
import { findLesson, nextLesson } from '../../content/curriculum';
import type { Lesson } from '../../content/types';
import { drillStars } from '../../game/progression';
import { CHORDS, chordMidis, shapeNotes } from '../../music/chords';
import { useProgress } from '../../state/progress';
import { useSettings } from '../../state/settings';
import { ChordDiagram } from '../components/ChordDiagram';
import { Icon } from '../components/Icon';
import { enableMic, MicPanel } from '../components/MicPanel';
import { ProgressRing, Stars } from '../components/Stars';
import { RichText } from '../components/RichText';
import { useMicStatus } from '../hooks';
import { useListenFor } from '../listen';
import { goBack, navigate } from '../router';
import { toast } from '../toasts';

/** One-minute chord changes: switch between two chords as many times as you can. */
export function DrillScreen({ lesson }: { lesson: Lesson }) {
  const drill = lesson.drill!;
  const [a, b] = drill.chords;
  const chapter = findLesson(lesson.id)!.chapter;
  const leftHanded = useSettings((s) => s.leftHanded);
  const best = useProgress((s) => s.lessons[lesson.id]?.bestCount ?? 0);
  const [phase, setPhase] = useState<'intro' | 'countdown' | 'running' | 'done'>('intro');
  const [count, setCount] = useState(0);
  const [cur, setCur] = useState(0);
  const [left, setLeft] = useState(drill.seconds);
  const [countdown, setCountdown] = useState(3);
  const [stars, setStars] = useState(0);
  const { status } = useMicStatus();
  const startedAt = useRef(0);

  const targets = useMemo(
    () =>
      [a, b].map((id) => {
        const shape = CHORDS[id];
        return { kind: 'chord' as const, midis: chordMidis(shapeNotes(shape.frets)), name: shape.name };
      }),
    [a, b],
  );

  const heard = useListenFor(phase === 'running' ? targets[cur] : null, () => {
    setCount((c) => c + 1);
    setCur((c) => 1 - c);
  });

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
      const id = setInterval(() => {
        const elapsed = (performance.now() - startedAt.current) / 1000;
        const remaining = Math.max(0, drill.seconds - elapsed);
        setLeft(remaining);
        if (remaining <= 0) {
          clearInterval(id);
          setPhase('done');
        }
      }, 100);
      return () => clearInterval(id);
    }
  }, [phase, drill.seconds]);

  useEffect(() => {
    if (phase !== 'done') return;
    const st = drillStars(count, drill.seconds);
    setStars(st);
    const progress = useProgress.getState();
    progress.addTime(drill.seconds);
    const outcome = progress.record({ lessonId: lesson.id, mode: 'drill', stars: st, score: count * 100, accuracy: Math.min(1, count / ((drill.seconds / 60) * 24)), tempo: 1, count });
    for (const x of outcome.unlocked) toast({ tone: 'achievement', title: x.title, body: x.description });
  }, [phase]);

  const start = async () => {
    await unlockAudio();
    const ok = status === 'running' || (await enableMic());
    if (!ok) return;
    setCount(0);
    setCur(0);
    setLeft(drill.seconds);
    setPhase('countdown');
  };

  const target = CHORDS[cur === 0 ? a : b];
  const other = CHORDS[cur === 0 ? b : a];

  return (
    <div className="page drill" style={{ '--accent': chapter.accent } as React.CSSProperties}>
      <header className="learn-top">
        <button className="btn btn-icon btn-ghost" onClick={() => goBack(`/chapter/${chapter.id}`)} aria-label="Back">
          <Icon name="back" />
        </button>
        <div>
          <span className="eyebrow">{chapter.venue} · Drill</span>
          <h2>{lesson.title}</h2>
        </div>
      </header>

      {phase === 'intro' && (
        <div className="drill-intro card rise">
          <RichText text={`${lesson.summary}\n\nStrum **${CHORDS[a].name}**, switch to **${CHORDS[b].name}** and strum again. Every clean chord counts as one change. You have **${drill.seconds} seconds**.`} />
          <div className="figure-chords">
            <ChordDiagram chord={CHORDS[a]} size={130} leftHanded={leftHanded} />
            <ChordDiagram chord={CHORDS[b]} size={130} leftHanded={leftHanded} />
          </div>
          {best > 0 && <p className="faint">Your best: {best} changes</p>}
          <MicPanel compact />
          <button className="btn btn-primary btn-lg" onClick={start}>
            <Icon name="play" /> Start the clock
          </button>
        </div>
      )}

      {(phase === 'countdown' || phase === 'running') && (
        <div className="drill-run">
          <div className="drill-target card">
            <span className="eyebrow">{phase === 'countdown' ? 'Get ready' : 'Strum'}</span>
            <ChordDiagram chord={target} size={220} leftHanded={leftHanded} />
            <span className="faint">then {other.name}</span>
          </div>
          <div className="drill-side">
            <ProgressRing value={left / drill.seconds} size={150} stroke={12}>
              <strong>{phase === 'countdown' ? countdown : Math.ceil(left)}</strong>
              <small>{phase === 'countdown' ? '' : 'sec'}</small>
            </ProgressRing>
            <div className="big-stat">
              <strong>{count}</strong>
              <span className="faint">changes</span>
            </div>
            {heard.heard && <p className={`check-heard ${heard.wrong ? 'bad' : 'good'}`}>{heard.wrong ? `Heard ${heard.heard}` : `${heard.heard}!`}</p>}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="drill-intro card rise">
          <span className="eyebrow">Time!</span>
          <h1>{count} changes</h1>
          <Stars value={stars} size={40} animate />
          <p className="muted">
            {stars >= 3 ? 'Lightning hands. These shapes are yours now.' : stars === 2 ? 'Solid! A few more rounds and it will be automatic.' : stars === 1 ? 'Good start. Changes get faster every day you practise.' : 'Keep going: aim for a clean strum, then speed comes.'}
          </p>
          <div className="results-actions">
            <button className="btn btn-primary btn-lg" onClick={start}>
              <Icon name="refresh" /> Again
            </button>
            {stars > 0 && nextLesson(lesson.id) && (
              <button className="btn btn-lg" onClick={() => navigate(`/lesson/${nextLesson(lesson.id)!.id}`, { replace: true })}>
                Next lesson <Icon name="next" />
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => goBack(`/chapter/${chapter.id}`)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
