import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getEngine, unlockAudio } from '../../audio/engine';
import { mic } from '../../audio/mic';
import { findLesson, getLesson } from '../../content/curriculum';
import type { ChartNote } from '../../game/chart';
import type { RunOutcome } from '../../game/progression';
import { GameSession, type Hud, type SessionMode, type SessionResult, type SessionState } from '../../game/session';
import { Highway } from '../../render/highway';
import { useProgress } from '../../state/progress';
import { getSettings, useSettings } from '../../state/settings';
import { CHORDS, notesToFrets } from '../../music/chords';
import { describePosition } from '../../music/notes';
import { ChordDiagram } from '../components/ChordDiagram';
import { Fretboard } from '../components/Fretboard';
import { Icon } from '../components/Icon';
import { LevelMeter, MicPanel } from '../components/MicPanel';
import { useMicStatus } from '../hooks';
import { goBack, navigate } from '../router';
import { toast } from '../toasts';
import { Results } from './Results';

interface Finished {
  result: SessionResult;
  outcome: RunOutcome | null;
}

export function PlayScreen({ lessonId, mode, tempo }: { lessonId: string; mode: SessionMode; tempo: number }) {
  const lesson = useMemo(() => {
    try {
      return getLesson(lessonId);
    } catch {
      return null;
    }
  }, [lessonId]);
  const [run, setRun] = useState(0);
  const [session, setSession] = useState<GameSession | null>(null);
  const [state, setState] = useState<SessionState>('ready');
  const [hud, setHud] = useState<Hud | null>(null);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [micFailed, setMicFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highwayRef = useRef<Highway | null>(null);
  const settings = useSettings();
  const { status: micStatus } = useMicStatus();

  useEffect(() => {
    if (!lesson || !canvasRef.current) return;
    const s = new GameSession(lesson, mode, tempo, getSettings());
    s.prepare();
    setSession(s);
    setState('ready');
    setFinished(null);
    setHud(s.hud);
    const st = getSettings();
    const hw = new Highway(canvasRef.current, s.chart, { noteNames: st.noteNames, speed: st.noteSpeed, reducedMotion: st.reducedMotion });
    highwayRef.current = hw;
    const offs = [
      s.onHud(setHud),
      s.onState(setState),
      s.onJudgement(({ j, note }) => hw.burst(note, j.grade, mode === 'practice' && j.grade !== 'miss' ? 'NICE' : mode === 'practice' ? 'SKIPPED' : undefined)),
      s.onFinish((result) => {
        let outcome: RunOutcome | null = null;
        const progress = useProgress.getState();
        progress.addTime(s.takePracticeSeconds());
        if (result.mode !== 'listen') {
          outcome = progress.record({
            lessonId: lesson.id,
            mode: result.mode === 'practice' ? 'practice' : 'play',
            stars: result.stars,
            score: result.stats.score,
            accuracy: result.stats.accuracy,
            tempo: result.tempo,
            maxStreak: result.stats.maxStreak,
            notesHit: result.stats.perfect + result.stats.great + result.stats.good,
          });
          for (const a of outcome.unlocked) toast({ tone: 'achievement', title: a.title, body: a.description });
          if (outcome.rankUp) toast({ tone: 'achievement', icon: 'bolt', title: `New rank: ${outcome.rankUp.title}`, body: 'Keep forging.' });
        }
        setTimeout(() => setFinished({ result, outcome }), 900);
      }),
    ];

    let raf = 0;
    const loop = () => {
      s.frame();
      hw.draw({
        songTime: s.songTime(),
        visuals: s.visuals,
        waitingFor: s.currentTarget,
        multiplier: s.hud.multiplier,
        countIn: s.countInRemaining(),
        now: performance.now(),
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    let cancelled = false;
    (async () => {
      if (mode !== 'listen') {
        const ok = await mic.start(st.inputDeviceId);
        if (cancelled) return;
        if (!ok) {
          setMicFailed(true);
          return;
        }
      }
      const running = await getEngine().resume();
      if (cancelled) return;
      if (!running) {
        setNeedsTap(true);
        return;
      }
      await s.start();
    })();

    const onVisibility = () => {
      if (document.hidden) s.pause();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      offs.forEach((off) => off());
      if (s.state !== 'finished') useProgress.getState().addTime(s.takePracticeSeconds());
      s.dispose();
      hw.dispose();
      highwayRef.current = null;
    };
  }, [lesson, mode, tempo, run]);

  useEffect(() => {
    highwayRef.current?.setOptions({ noteNames: settings.noteNames, speed: settings.noteSpeed });
  }, [settings.noteNames, settings.noteSpeed]);

  const togglePause = useCallback(() => {
    if (!session) return;
    if (session.state === 'paused') {
      void unlockAudio();
      session.resume();
    } else session.pause();
  }, [session]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return;
      if (e.code === 'Space' || e.key === 'Escape') {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePause, finished]);

  if (!lesson) {
    return (
      <div className="page empty">
        <h2>Song not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Back to the tour
        </button>
      </div>
    );
  }

  const info = findLesson(lesson.id)!;
  const chapter = info.chapter;
  const quit = () => goBack(`/lesson/${lesson.id}`);
  const restart = () => {
    setRun((r) => r + 1);
  };
  const tapStart = async () => {
    await unlockAudio();
    setNeedsTap(false);
    await session?.start();
  };
  const retryMic = async () => {
    const ok = await mic.start(getSettings().inputDeviceId);
    if (ok) {
      setMicFailed(false);
      await unlockAudio();
      await session?.start();
    }
  };

  const progress = session ? Math.max(0, Math.min(1, session.songTime() / session.chart.duration)) : 0;

  return (
    <div className="play" style={{ '--accent': chapter.accent } as React.CSSProperties}>
      <header className="play-top">
        <button className="btn btn-icon btn-ghost" onClick={quit} aria-label="Quit">
          <Icon name="close" />
        </button>
        <div className="play-title">
          <span className="eyebrow">
            {mode === 'practice' ? 'Practice' : mode === 'listen' ? 'Listening' : 'Live'} · {Math.round(tempo * 100)}%
          </span>
          <strong>{lesson.title}</strong>
          <ProgressLine session={session} initial={progress} />
        </div>
        {mode !== 'listen' && hud && (
          <div className="play-score">
            <span className="score-num">{mode === 'practice' ? `${hud.hits}/${session?.chart.notes.length ?? 0}` : hud.score.toLocaleString()}</span>
            {mode === 'play' && (
              <span className={`mult mult-${hud.multiplier}`}>
                ×{hud.multiplier}
                <small>{hud.streak} streak</small>
              </span>
            )}
          </div>
        )}
        <button className="btn btn-icon" onClick={togglePause} aria-label={state === 'paused' ? 'Resume' : 'Pause'} disabled={state === 'finished' || state === 'ready'}>
          <Icon name={state === 'paused' ? 'play' : 'pause'} />
        </button>
      </header>

      <div className="play-stage">
        <canvas ref={canvasRef} className="highway" />
        {state === 'paused' && !finished && (
          <div className="overlay">
            <div className="overlay-card card">
              <h2>Paused</h2>
              <div className="overlay-actions">
                <button className="btn btn-primary btn-lg" onClick={togglePause}>
                  <Icon name="play" /> Resume
                </button>
                <button className="btn" onClick={restart}>
                  <Icon name="refresh" /> Restart
                </button>
                <button className="btn btn-ghost" onClick={quit}>
                  Quit
                </button>
              </div>
              <div className="overlay-options">
                <span className="faint">Note speed</span>
                <div className="segmented">
                  {(['slow', 'normal', 'fast'] as const).map((sp) => (
                    <button key={sp} aria-pressed={settings.noteSpeed === sp} onClick={() => settings.set({ noteSpeed: sp })}>
                      {sp}
                    </button>
                  ))}
                </div>
                <label className="inline-toggle">
                  <span className="faint">Note names</span>
                  <button className="switch" role="switch" aria-checked={settings.noteNames} onClick={() => settings.set({ noteNames: !settings.noteNames })} />
                </label>
              </div>
            </div>
          </div>
        )}
        {needsTap && (
          <div className="overlay">
            <button className="btn btn-primary btn-lg" onClick={tapStart}>
              <Icon name="play" /> Tap to start
            </button>
          </div>
        )}
        {micFailed && (
          <div className="overlay">
            <div className="overlay-card card">
              <h2>Can’t hear you</h2>
              <MicPanel />
              <div className="overlay-actions">
                <button className="btn btn-primary" onClick={retryMic}>
                  Try again
                </button>
                <button className="btn" onClick={() => navigate(`/play/${lesson.id}?mode=listen&tempo=${tempo}`, { replace: true })}>
                  <Icon name="ear" /> Listen instead
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="play-bottom">
        {session && <NextUp session={session} leftHanded={settings.leftHanded} />}
        <div className="play-feedback">
          {mode === 'listen' ? (
            <span className="faint">Listen and watch the notes. Then try Practice or Play.</span>
          ) : (
            <>
              <span className={`heard ${hud?.heardOk === false ? 'bad' : hud?.heardOk ? 'good' : ''}`}>
                <span className="faint">I hear</span>
                <strong>{hud?.heard ?? '–'}</strong>
              </span>
              {mode === 'practice' && session && (
                <div className="practice-tools">
                  <button className="btn btn-sm" onClick={() => session.hint()}>
                    <Icon name="ear" /> Hear it
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => session.skip()}>
                    Skip <Icon name="next" />
                  </button>
                </div>
              )}
              <span className="meter-wrap">
                {micStatus === 'running' ? <LevelMeter compact /> : <span className="faint">mic off</span>}
              </span>
            </>
          )}
        </div>
      </footer>
      <p className="rotate-hint faint">Tip: turn your phone sideways for a bigger highway.</p>

      {finished && (
        <Results
          lesson={lesson}
          result={finished.result}
          outcome={finished.outcome}
          onRetry={restart}
          onMode={(m, t) => navigate(`/play/${lesson.id}?mode=${m}&tempo=${t}`, { replace: true })}
        />
      )}
    </div>
  );
}

/** Song progress bar, updated a few times a second. */
function ProgressLine({ session, initial }: { session: GameSession | null; initial: number }) {
  const [p, setP] = useState(initial);
  const [section, setSection] = useState<string | undefined>();
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      const t = session.songTime();
      setP(Math.max(0, Math.min(1, t / session.chart.duration)));
      const beat = t / session.chart.secPerBeat;
      let name: string | undefined;
      for (const sec of session.chart.sections) if (sec.startBeat <= beat + 0.01 && sec.name) name = sec.name;
      setSection(name);
    }, 200);
    return () => clearInterval(id);
  }, [session]);
  return (
    <span className="play-progress">
      <span className="bar">
        <span style={{ width: `${p * 100}%` }} />
      </span>
      {section && <span className="faint section-name">{section}</span>}
    </span>
  );
}

/** What to play next: a chord box or the fretboard positions. */
function NextUp({ session, leftHanded }: { session: GameSession; leftHanded: boolean }) {
  const [notes, setNotes] = useState<ChartNote[]>([]);
  const key = useRef('');
  useEffect(() => {
    const id = setInterval(() => {
      let upcoming: ChartNote[];
      if (session.mode === 'practice') {
        const cur = session.practice?.index ?? 0;
        upcoming = session.chart.notes.slice(cur, cur + 3);
      } else {
        const t = session.songTime();
        const i = session.chart.notes.findIndex((n) => n.time > t - 0.04 && !session.visuals.has(n.id));
        upcoming = i >= 0 ? session.chart.notes.slice(i, i + 3) : [];
      }
      const k = upcoming.map((n) => n.id).join(',');
      if (k !== key.current) {
        key.current = k;
        setNotes(upcoming);
      }
    }, 90);
    return () => clearInterval(id);
  }, [session]);

  const first = notes[0];
  if (!first) return <div className="next-up empty" />;
  if (first.kind === 'chord' && first.notes.length > 1) {
    const lib = first.chordId ? CHORDS[first.chordId] : undefined;
    const frets = notesToFrets(first.notes.map((s) => ({ string: s.string, fret: s.fret })));
    const fingers: (number | null)[] = [null, null, null, null, null, null];
    for (const s of first.notes) fingers[6 - s.string] = s.finger || null;
    const then = notes.slice(1).find((n) => n.name && n.name !== first.name);
    return (
      <div className="next-up chord">
        <ChordDiagram chord={lib} frets={lib ? undefined : frets} fingers={lib ? undefined : fingers} name={first.name} size={92} leftHanded={leftHanded} />
        <div className="next-text">
          <span className="eyebrow">Next</span>
          <strong>{first.name ?? 'Chord'}</strong>
          {first.pm && <span className="faint">palm muted</span>}
          {then && <span className="faint">then {then.name}</span>}
        </div>
      </div>
    );
  }
  if (first.kind === 'mute') {
    return (
      <div className="next-up">
        <div className="next-text">
          <span className="eyebrow">Next</span>
          <strong>Muted strum</strong>
          <span className="faint">Rest your fretting fingers on the strings and strum: “chk”.</span>
        </div>
      </div>
    );
  }
  const singles = notes.filter((n) => n.kind === 'note' || (n.kind === 'chord' && n.notes.length === 1)).slice(0, 3);
  const marks = singles.flatMap((n, i) =>
    n.notes.map((s) => ({ string: s.string, fret: s.fret, finger: s.finger || undefined, label: s.fret === 0 ? '0' : s.finger ? String(s.finger) : undefined, color: i === 0 ? undefined : 'rgba(255,255,255,0.25)' })),
  );
  const s0 = first.notes[0];
  return (
    <div className="next-up">
      <Fretboard marks={marks.reverse()} tuning={session.chart.tuning} leftHanded={leftHanded} height={96} />
      <div className="next-text">
        <span className="eyebrow">Next</span>
        <strong>{describePosition(session.chart.tuning, s0.string, s0.fret)}</strong>
        {s0.finger ? <span className="faint">finger {s0.finger}</span> : <span className="faint">open string</span>}
      </div>
    </div>
  );
}
