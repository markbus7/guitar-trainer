import { TRAINER_LEVELS, trainerRecordId } from '../../game/trainers';
import { WORKOUT_LABEL, type WorkoutKind } from '../../game/workout';
import { CHAPTERS } from '../../content/curriculum';
import { CHORD_LIST } from '../../music/chords';
import { useDaily, useWorkout } from '../../state/daily';
import { useProgress } from '../../state/progress';
import { Icon, type IconName } from '../components/Icon';
import { ProgressRing } from '../components/Stars';
import { navigate } from '../router';

const KIND_ICON: Record<WorkoutKind, IconName> = {
  tune: 'tuner',
  warmup: 'hand',
  train: 'bolt',
  learn: 'book',
  song: 'disc',
};

/** Today's workout: a checklist of five short steps. */
export function WorkoutCard({ compact = false }: { compact?: boolean }) {
  const { items, done, total, minutes } = useWorkout();
  const reshuffle = useDaily((s) => s.reshuffle);
  const complete = done >= total;
  return (
    <section className={`workout card ${compact ? 'compact' : ''} ${complete ? 'complete' : ''}`}>
      <div className="workout-head">
        <ProgressRing value={total ? done / total : 0} size={compact ? 54 : 64} stroke={6}>
          {complete ? <Icon name="check" width={22} height={22} /> : <strong>{done}/{total}</strong>}
        </ProgressRing>
        <div className="workout-title">
          <span className="eyebrow">Today’s workout</span>
          <h2>{complete ? 'Workout done. Nice!' : `${minutes} minutes, ${total} steps`}</h2>
          {!compact && <span className="faint">A fresh plan every day, built from where you are on the tour.</span>}
        </div>
        {!compact && !complete && done === 0 && (
          <button className="btn btn-sm btn-ghost" onClick={reshuffle} title="Make a different plan">
            <Icon name="refresh" width={16} height={16} /> New plan
          </button>
        )}
      </div>
      <ol className="workout-list">
        {items.map((it, i) => (
          <li key={i}>
            <button className={`workout-item ${it.done ? 'done' : ''}`} onClick={() => navigate(it.route)}>
              <span className="workout-icon">{it.done ? <Icon name="check" width={18} height={18} /> : <Icon name={KIND_ICON[it.kind]} width={18} height={18} />}</span>
              <span className="workout-text">
                <span className="eyebrow">{WORKOUT_LABEL[it.kind]}</span>
                <strong>{it.title}</strong>
                {!compact && <span className="faint">{it.detail}</span>}
              </span>
              <span className="faint small workout-min">{it.minutes} min</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function TrainingScreen() {
  const lessons = useProgress((s) => s.lessons);
  const best = (game: 'notes' | 'ear') => Math.max(0, ...TRAINER_LEVELS.filter((l) => l.game === game).map((l) => lessons[trainerRecordId(l.id)]?.bestCount ?? 0));
  const drill = CHAPTERS.flatMap((c) => c.lessons).find((l) => l.kind === 'drill');
  const tools: { icon: IconName; title: string; text: string; route: string; accent: string; stat?: string }[] = [
    { icon: 'note', title: 'Note Finder', text: 'Learn the notes on the neck, one string at a time.', route: '/training/notes', accent: '#5cc8ff', stat: best('notes') ? `Best ${best('notes')}` : undefined },
    { icon: 'ear', title: 'Echo', text: 'Ear training: hear a note, find it on your guitar.', route: '/training/ear', accent: '#b388ff', stat: best('ear') ? `Best ${best('ear')}` : undefined },
    { icon: 'metronome', title: 'Metronome', text: 'Tap tempo, subdivisions and a speed trainer that ramps up by itself.', route: '/metronome', accent: '#ff9a3d' },
    { icon: 'chords', title: 'Chord library', text: `${CHORD_LIST.length} shapes with a "Test me" button that listens.`, route: '/chords', accent: '#4be3a4' },
    { icon: 'tuner', title: 'Tuner', text: 'Standard, Drop D, E♭, D standard and Drop C.', route: '/tuner', accent: '#ffd166' },
  ];
  if (drill) tools.push({ icon: 'refresh', title: 'Chord changes', text: 'One-minute changes between two chords. Pick your pair.', route: `/lesson/${drill.id}`, accent: '#ff3d5a' });

  return (
    <div className="page training">
      <div className="page-head">
        <span className="eyebrow">Training</span>
        <h1>The Practice Room</h1>
        <p className="muted">Short daily practice beats a long session once a week. Start with today’s workout, or pick a tool.</p>
      </div>
      <WorkoutCard />
      <div className="section-head">
        <h2>Tools and games</h2>
      </div>
      <div className="tool-grid">
        {tools.map((t, i) => (
          <button key={t.title} className="tool-card card rise" style={{ '--accent': t.accent, animationDelay: `${i * 0.03}s` } as React.CSSProperties} onClick={() => navigate(t.route)}>
            <span className="tool-icon">
              <Icon name={t.icon} />
            </span>
            <span className="tool-body">
              <strong>{t.title}</strong>
              <span className="faint">{t.text}</span>
            </span>
            {t.stat && <span className="chip chip-accent tool-stat">{t.stat}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
