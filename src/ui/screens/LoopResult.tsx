import { useEffect, useRef, useState } from 'react';
import type { SessionMode, SessionResult } from '../../game/session';
import { Icon } from '../components/Icon';
import { Bar } from '../components/Stars';
import { navigate } from '../router';
import { LOOP_CLEAN, nextLoopTempo } from '../../game/loop';

/** Passes in the current loop (kept across the remounts a tempo change causes). */
const passes = { key: '', count: 0, clean: 0, best: 0 };

const AUTO_SECONDS = 4;

export function LoopResult({
  lessonId,
  part,
  partName,
  mode,
  result,
  ramp,
  onAgain,
}: {
  lessonId: string;
  part: number;
  partName: string;
  mode: SessionMode;
  result: SessionResult;
  ramp: boolean;
  onAgain: () => void;
}) {
  const key = `${lessonId}:${part}:${mode}`;
  const counted = useRef(false);
  if (!counted.current) {
    counted.current = true;
    if (passes.key !== key) Object.assign(passes, { key, count: 0, clean: 0, best: 0 });
    passes.count++;
    if (result.stats.accuracy >= LOOP_CLEAN) passes.clean++;
    passes.best = Math.max(passes.best, result.tempo);
  }
  const practice = mode === 'practice';
  const acc = practice ? (result.firstTry ?? result.stats.accuracy) : result.stats.accuracy;
  const next = practice ? result.tempo : nextLoopTempo(result.tempo, acc, ramp);
  const mastered = !practice && acc >= LOOP_CLEAN && result.tempo >= 1;
  const [auto, setAuto] = useState(!mastered);
  const [left, setLeft] = useState(AUTO_SECONDS);

  const go = (tempo = next) => {
    if (tempo === result.tempo) onAgain();
    else navigate(`/play/${lessonId}?mode=${mode}&tempo=${tempo}&loop=${part}${ramp ? '' : '&ramp=0'}`, { replace: true });
  };
  const goRef = useRef(go);
  goRef.current = go;

  useEffect(() => {
    if (!auto) return;
    if (left <= 0) {
      goRef.current();
      return;
    }
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
  }, [auto, left]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        goRef.current();
      } else if (e.key === 'Escape') setAuto(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  let headline: string;
  let note: string;
  if (practice) {
    headline = acc >= LOOP_CLEAN ? 'Got it down' : 'Keep looping';
    note = acc >= LOOP_CLEAN ? 'You played almost every note right first time. Try it in real time next.' : 'Every pass makes the shapes a bit more automatic.';
  } else if (mastered) {
    headline = 'Full speed and clean!';
    note = `The ${partName} is ready. Now play the whole song.`;
  } else if (next > result.tempo) {
    headline = 'Clean pass';
    note = `Speeding up to ${Math.round(next * 100)}%.`;
  } else if (next < result.tempo) {
    headline = 'Too fast for now';
    note = `Slowing down to ${Math.round(next * 100)}%. Slow and clean beats fast and messy.`;
  } else {
    headline = 'Almost';
    note = ramp ? `Get ${Math.round(LOOP_CLEAN * 100)}% to speed up.` : 'Same speed again.';
  }

  return (
    <div className="loop-result rise" role="dialog" aria-label="Loop pass">
      <div className="loop-card card">
        <span className="eyebrow">
          <Icon name="repeat" width={14} height={14} /> Loop · {partName} · pass {passes.count}
        </span>
        <div className="loop-main">
          <div className="big-stat">
            <strong>{Math.round(acc * 100)}%</strong>
            <span className="faint">{practice ? 'first try' : 'accuracy'}</span>
          </div>
          <div className="loop-text">
            <h2>{headline}</h2>
            <p className="muted">{note}</p>
            <Bar value={acc} color={acc >= LOOP_CLEAN ? 'var(--ok)' : undefined} />
          </div>
        </div>
        {!practice && (
          <p className="faint small">
            {passes.clean} clean of {passes.count} · fastest {Math.round(passes.best * 100)}%
          </p>
        )}
        <div className="loop-actions">
          {mastered ? (
            <button className="btn btn-primary" onClick={() => navigate(`/play/${lessonId}?mode=play&tempo=1`, { replace: true })}>
              <Icon name="flame" /> Play the whole song
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => go()}>
              <Icon name="repeat" /> {auto ? `Next pass in ${left}` : 'Next pass'}
            </button>
          )}
          {mastered && (
            <button className="btn" onClick={() => go(result.tempo)}>
              <Icon name="repeat" /> Keep looping
            </button>
          )}
          {auto && (
            <button className="btn btn-ghost" onClick={() => setAuto(false)}>
              <Icon name="pause" /> Wait
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => navigate(`/lesson/${lessonId}`, { replace: true })}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
