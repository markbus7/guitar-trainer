import { nextLesson } from '../../content/curriculum';
import type { Lesson } from '../../content/types';
import { rankFor, type RunOutcome } from '../../game/progression';
import type { SessionMode, SessionResult } from '../../game/session';
import { STRING_ORDINAL, stringLabel, type StringNumber } from '../../music/notes';
import { useProgress } from '../../state/progress';
import { Icon } from '../components/Icon';
import { Bar, Stars } from '../components/Stars';
import { navigate } from '../router';
import { GRADE_COLORS } from '../theme';

const TITLES = ['Keep at it', 'Nice work', 'Great gig!', 'Encore!'];

export function Results({
  lesson,
  result,
  outcome,
  onRetry,
  onMode,
}: {
  lesson: Lesson;
  result: SessionResult;
  outcome: RunOutcome | null;
  onRetry: () => void;
  onMode: (mode: SessionMode, tempo: number) => void;
}) {
  const xp = useProgress((s) => s.xp);
  const { stats } = result;
  const listen = result.mode === 'listen';
  const practice = result.mode === 'practice';
  const acc = Math.round(stats.accuracy * 100);
  const next = nextLesson(lesson.id);
  const rank = rankFor(xp);
  const tuning = lesson.tuning ?? 'standard';

  const advice: string[] = [];
  if (!listen && !practice) {
    const judged = stats.perfect + stats.great + stats.good;
    if (judged >= 8 && Math.abs(stats.meanOffsetMs) > 28) {
      advice.push(
        stats.meanOffsetMs < 0
          ? `You are rushing a little (about ${Math.round(-stats.meanOffsetMs)} ms early). Relax and lock in with the kick drum.`
          : `You are dragging a little (about ${Math.round(stats.meanOffsetMs)} ms late). Get your fretting hand there early, then pick.`,
      );
    }
    const strings = Object.entries(stats.missedStrings).sort((a, b) => b[1] - a[1]);
    if (strings.length && strings[0][1] >= 4 && stats.miss >= 6) {
      const s = Number(strings[0][0]) as StringNumber;
      advice.push(`Most misses were on the ${STRING_ORDINAL[s]} string (${stringLabel(tuning, s)}). Look at where it sits before the part starts.`);
    }
    if (stats.chordMisses >= 3) advice.push('Chord changes are the tricky bit. Practice mode waits at every chord so you can build the shapes.');
    if (stats.bendShort >= 2) advice.push('Some bends fell short. Push with two or three fingers until it matches the target pitch.');
    if (stats.wrongNotes > stats.total * 0.3 && stats.miss > 4) advice.push('Lots of extra notes: mute strings you are not playing with the side of your hands.');
  }
  const trouble = result.sections.filter((s) => s.accuracy < 0.8 && s.total >= 4).sort((a, b) => a.accuracy - b.accuracy).slice(0, 2);

  return (
    <div className="results-backdrop">
      <div className="results card rise" role="dialog" aria-label="Results">
        {listen ? (
          <>
            <span className="eyebrow">That’s how it goes</span>
            <h1>{lesson.title}</h1>
            <p className="muted">Now you have it in your ears. Ready to try it yourself?</p>
          </>
        ) : (
          <>
            <span className="eyebrow">{practice ? 'Practice complete' : 'Gig report'}</span>
            <h1>{TITLES[result.stars]}</h1>
            <Stars value={result.stars} size={44} animate />
            <div className="results-main">
              <div className="big-stat">
                <strong>{acc}%</strong>
                <span className="faint">{practice ? 'first try' : 'accuracy'}</span>
              </div>
              {!practice && (
                <>
                  <div className="big-stat">
                    <strong>{stats.score.toLocaleString()}</strong>
                    <span className="faint">score</span>
                  </div>
                  <div className="big-stat">
                    <strong>{stats.maxStreak}</strong>
                    <span className="faint">best streak</span>
                  </div>
                </>
              )}
            </div>
            {!practice && (
              <div className="grades">
                {(['perfect', 'great', 'good', 'miss'] as const).map((g) => (
                  <div key={g} className="grade-row">
                    <span className="grade-name" style={{ color: GRADE_COLORS[g] }}>
                      {g}
                    </span>
                    <Bar value={stats.total ? stats[g] / stats.total : 0} color={GRADE_COLORS[g]} />
                    <span className="grade-count">{stats[g]}</span>
                  </div>
                ))}
              </div>
            )}
            {(advice.length > 0 || trouble.length > 0) && (
              <div className="advice">
                <h3>
                  <Icon name="sparkle" /> Coach’s notes
                </h3>
                <ul>
                  {trouble.map((t) => (
                    <li key={t.name}>
                      The <strong>{t.name}</strong> was the toughest part ({Math.round(t.accuracy * 100)}%). Try it again in Practice mode.
                    </li>
                  ))}
                  {advice.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {practice && result.stars > 0 && <p className="faint">Practice earns 1 star. Play it live with the band to earn up to 3.</p>}
            {outcome && (
              <div className="xp-row">
                <span className="xp-gain">+{outcome.xpGained} XP</span>
                <span className="xp-rank">
                  <strong>{rank.rank.title}</strong>
                  <Bar value={rank.progress} />
                  <span className="faint">{rank.next ? `${rank.next.xp - xp} XP to ${rank.next.title}` : 'Top rank!'}</span>
                </span>
              </div>
            )}
            {outcome && outcome.unlocked.length > 0 && (
              <div className="unlocked">
                {outcome.unlocked.map((a) => (
                  <span key={a.id} className="chip chip-accent">
                    <Icon name="trophy" /> {a.title}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
        <div className="results-actions">
          {listen ? (
            <>
              <button className="btn btn-primary btn-lg" onClick={() => onMode('practice', 1)}>
                <Icon name="hand" /> Practice it
              </button>
              <button className="btn btn-lg" onClick={() => onMode('play', result.tempo)}>
                <Icon name="flame" /> Play it
              </button>
            </>
          ) : (
            <>
              {result.stars >= 1 && next ? (
                <button className="btn btn-primary btn-lg" onClick={() => navigate(`/lesson/${next.id}`, { replace: true })}>
                  Next: {next.title} <Icon name="next" />
                </button>
              ) : null}
              <button className={`btn btn-lg ${result.stars >= 1 && next ? '' : 'btn-primary'}`} onClick={onRetry}>
                <Icon name="refresh" /> Again
              </button>
              {practice ? (
                <button className="btn btn-lg" onClick={() => onMode('play', 1)}>
                  <Icon name="flame" /> Play live
                </button>
              ) : result.stars < 3 && result.tempo > 0.7 ? (
                <button className="btn btn-lg" onClick={() => onMode('play', result.tempo >= 1 ? 0.85 : 0.7)}>
                  <Icon name="turtle" /> Slower
                </button>
              ) : null}
            </>
          )}
          <button className="btn btn-ghost" onClick={() => navigate(`/lesson/${lesson.id}`, { replace: true })}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
