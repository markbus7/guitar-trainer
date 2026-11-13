import { ALL_LESSONS, CHAPTERS, SONGBOOK_CHAPTER } from '../../content/curriculum';
import { ACHIEVEMENTS, RANKS, chapterStars, dayKey, rankFor, streakDays, totalSeconds, totalStars } from '../../game/progression';
import { progressData, useProgress } from '../../state/progress';
import { Icon } from '../components/Icon';
import { Bar } from '../components/Stars';
import { LogoMark } from '../components/Logo';
import { APP_VERSION } from '../../version';

export function ProfileScreen() {
  useProgress((s) => s.lessons);
  useProgress((s) => s.days);
  const p = progressData();
  const { rank, next, progress } = rankFor(p.xp);
  const stars = totalStars(p);
  const maxStarsAll = [...CHAPTERS, SONGBOOK_CHAPTER].reduce((a, c) => a + chapterStars(p, c).max, 0);
  const done = ALL_LESSONS.filter((l) => (p.lessons[l.id]?.stars ?? 0) > 0).length;
  const minutes = Math.round(totalSeconds(p) / 60);
  const streak = streakDays(p.days);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - (13 - i));
    return { key: dayKey(d), label: d.toLocaleDateString(undefined, { weekday: 'narrow' }), sec: p.days[dayKey(d)] ?? 0 };
  });
  const maxSec = Math.max(600, ...days.map((d) => d.sec));

  return (
    <div className="page profile">
      <section className="rank-card card rise">
        <div className="rank-badge">
          <LogoMark size={64} />
          <span className="rank-level">{rank.id + 1}</span>
        </div>
        <div className="rank-body">
          <span className="eyebrow">Your rank</span>
          <h1>{rank.title}</h1>
          <Bar value={progress} />
          <span className="faint">{next ? `${p.xp.toLocaleString()} XP · ${(next.xp - p.xp).toLocaleString()} to ${next.title}` : `${p.xp.toLocaleString()} XP · the top of the bill`}</span>
        </div>
      </section>

      <section className="stat-grid">
        <Stat icon="star" value={`${stars}`} sub={`of ${maxStarsAll} stars`} />
        <Stat icon="check" value={`${done}`} sub={`of ${ALL_LESSONS.length} lessons`} />
        <Stat icon="flame" value={`${streak}`} sub="day streak" />
        <Stat icon="metronome" value={`${minutes}`} sub="minutes played" />
        <Stat icon="bolt" value={`${p.bestStreak}`} sub="best note streak" />
        <Stat icon="note" value={p.notesHit.toLocaleString()} sub="notes hit" />
      </section>

      <section className="card activity">
        <h3>Last two weeks</h3>
        <div className="activity-bars">
          {days.map((d) => (
            <div key={d.key} className="activity-day" title={`${Math.round(d.sec / 60)} min`}>
              <span className="activity-bar" style={{ height: `${Math.max(3, (d.sec / maxSec) * 100)}%`, opacity: d.sec ? 1 : 0.3 }} />
              <span className="faint">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>Achievements</h2>
          <span className="faint">
            {Object.keys(p.achievements).length} / {ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="achievements">
          {ACHIEVEMENTS.map((a) => {
            const got = !!p.achievements[a.id];
            return (
              <div key={a.id} className={`achievement card ${got ? 'got' : ''}`}>
                <span className="ach-icon">
                  <Icon name={got ? 'trophy' : 'lock'} />
                </span>
                <span>
                  <strong>{a.title}</strong>
                  <span className="faint">{a.description}</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card ranks">
        <h3>Ranks</h3>
        <ol>
          {RANKS.map((r) => (
            <li key={r.id} className={r.id <= rank.id ? 'reached' : ''}>
              <span>{r.title}</span>
              <span className="faint">{r.xp.toLocaleString()} XP</span>
            </li>
          ))}
        </ol>
      </section>
      <p className="app-version faint small">Fretforge v{APP_VERSION}</p>
    </div>
  );
}

function Stat({ icon, value, sub }: { icon: 'star' | 'check' | 'flame' | 'metronome' | 'bolt' | 'note'; value: string; sub: string }) {
  return (
    <div className="stat card">
      <Icon name={icon} />
      <strong>{value}</strong>
      <span className="faint">{sub}</span>
    </div>
  );
}
