import { useEffect, useMemo, useRef, useState } from 'react';
import { findLesson, nextLesson } from '../../content/curriculum';
import type { Check, Lesson } from '../../content/types';
import { chordMidis, getChord, shapeNotes } from '../../music/chords';
import { noteName, type TuningId } from '../../music/notes';
import { useProgress } from '../../state/progress';
import { Figure } from '../components/Figure';
import { Icon } from '../components/Icon';
import { MicPanel } from '../components/MicPanel';
import { RichText } from '../components/RichText';
import { Tuner } from '../components/Tuner';
import { useMicStatus } from '../hooks';
import { useListenFor, type ListenTarget } from '../listen';
import { goBack, navigate } from '../router';
import { toast } from '../toasts';

/** Step-by-step walkthroughs with listening checks ("pluck the low E string"). */
export function LearnLesson({ lesson }: { lesson: Lesson }) {
  const steps = lesson.steps ?? [];
  const [step, setStep] = useState(0);
  const [passed, setPassed] = useState<Set<number>>(new Set());
  const started = useRef(performance.now());
  const chapter = findLesson(lesson.id)!.chapter;
  const tuning = lesson.tuning ?? 'standard';

  useEffect(() => {
    const t0 = started.current;
    return () => {
      const seconds = Math.min(20 * 60, (performance.now() - t0) / 1000);
      useProgress.getState().addTime(seconds);
    };
  }, []);

  const s = steps[step];
  const last = step === steps.length - 1;

  const finish = () => {
    const outcome = useProgress.getState().record({ lessonId: lesson.id, mode: 'learn', stars: 1, score: 0, accuracy: 1, tempo: 1 });
    toast({ tone: 'achievement', icon: 'star', title: `${lesson.title}: done`, body: `+${outcome.xpGained} XP` });
    for (const a of outcome.unlocked) toast({ tone: 'achievement', title: a.title, body: a.description });
    if (outcome.rankUp) toast({ tone: 'achievement', icon: 'bolt', title: `New rank: ${outcome.rankUp.title}` });
    const next = nextLesson(lesson.id);
    navigate(next ? `/lesson/${next.id}` : `/chapter/${chapter.id}`, { replace: true });
  };

  if (!s) return null;
  return (
    <div className="page learn" style={{ '--accent': chapter.accent } as React.CSSProperties}>
      <header className="learn-top">
        <button className="btn btn-icon btn-ghost" onClick={() => goBack(`/chapter/${chapter.id}`)} aria-label="Back">
          <Icon name="back" />
        </button>
        <div>
          <span className="eyebrow">{chapter.venue} · Walkthrough</span>
          <h2>{lesson.title}</h2>
        </div>
        <div className="dots" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((_, i) => (
            <button key={i} className={`dot ${i === step ? 'on' : ''} ${i < step || passed.has(i) ? 'done' : ''}`} onClick={() => setStep(i)} aria-label={`Step ${i + 1}`} />
          ))}
        </div>
      </header>

      <article className="learn-step card rise" key={step}>
        <span className="eyebrow">
          Step {step + 1} of {steps.length}
        </span>
        <h1>{s.title}</h1>
        <RichText text={s.body} />
        {s.figure && <Figure figure={s.figure} />}
        {s.tuner && <Tuner tuning={s.tuner} compact />}
        {s.check && (
          <CheckPanel
            key={step}
            check={s.check}
            tuning={tuning}
            done={passed.has(step)}
            onDone={() =>
              setPassed((prev) => {
                const next = new Set(prev);
                next.add(step);
                return next;
              })
            }
          />
        )}
      </article>

      <footer className="learn-nav">
        <button className="btn" onClick={() => setStep((x) => Math.max(0, x - 1))} disabled={step === 0}>
          <Icon name="back" /> Back
        </button>
        {last ? (
          <button className="btn btn-primary btn-lg" onClick={finish}>
            Finish <Icon name="check" />
          </button>
        ) : (
          <button className={`btn btn-lg ${!s.check || passed.has(step) ? 'btn-primary' : ''}`} onClick={() => setStep((x) => x + 1)}>
            {s.check && !passed.has(step) ? 'Skip' : 'Next'} <Icon name="next" />
          </button>
        )}
      </footer>
    </div>
  );
}

export function checkTarget(check: Check, tuning: TuningId): ListenTarget {
  if (check.anyNote) return { kind: 'any' };
  if (check.chord) {
    const shape = getChord(check.chord);
    return { kind: 'chord', midis: chordMidis(shapeNotes(shape.frets), tuning), name: shape.name };
  }
  return { kind: 'note', midis: check.midi ?? [] };
}

function CheckPanel({ check, tuning, done, onDone }: { check: Check; tuning: TuningId; done: boolean; onDone: () => void }) {
  const times = check.times ?? 1;
  const [count, setCount] = useState(0);
  const target = useMemo(() => checkTarget(check, tuning), [check, tuning]);
  const { status } = useMicStatus();
  const heard = useListenFor(done ? null : target, () => setCount((c) => c + 1));

  useEffect(() => {
    if (!done && count >= times) onDone();
  }, [count, times, done, onDone]);

  const want = target.kind === 'note' ? target.midis.map((m) => noteName(m, { octave: false })).join(' / ') : target.kind === 'chord' ? target.name : 'any note';

  return (
    <div className={`check card ${done ? 'passed' : ''}`}>
      <div className="check-head">
        <span className={`check-icon ${done ? 'ok' : ''}`}>
          <Icon name={done ? 'check' : 'ear'} />
        </span>
        <div>
          <strong>{check.prompt}</strong>
          <span className="faint">
            {done ? 'Nailed it!' : times > 1 ? `${Math.min(count, times)} of ${times}` : `Listening for ${want}`}
          </span>
        </div>
      </div>
      {!done && status !== 'running' && <MicPanel compact />}
      {!done && status === 'running' && heard.heard && (
        <p className={`check-heard ${heard.wrong ? 'bad' : 'good'}`}>
          {heard.wrong ? `That sounded like ${heard.heard}. Try again!` : `Yes! ${heard.heard}`}
        </p>
      )}
      {done && (
        <div className="check-burst" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} style={{ '--i': i } as React.CSSProperties} />
          ))}
        </div>
      )}
    </div>
  );
}
