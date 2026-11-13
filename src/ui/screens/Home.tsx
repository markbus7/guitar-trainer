import { CHAPTERS, FREE_PLAY_SONGS, SONGBOOK_CHAPTER, findLesson } from '../../content/curriculum';
import { CHORD_LIST } from '../../music/chords';
import { chapterStars, dayKey, isChapterUnlocked, lessonStars, nextRecommended, streakDays, totalStars } from '../../game/progression';
import { progressData, useProgress } from '../../state/progress';
import { useSettings } from '../../state/settings';
import { VenueArt } from '../art/VenueArt';
import { Icon } from '../components/Icon';
import { Bar, ProgressRing, Stars } from '../components/Stars';
import { navigate } from '../router';
import { KIND_LABEL } from './labels';

export function Home() {
  useProgress((s) => s.lessons);
  const days = useProgress((s) => s.days);
  const unlockAll = useSettings((s) => s.unlockAll);
  const goalMin = useSettings((s) => s.dailyGoalMin);
  const p = progressData();
  const next = nextRecommended(p, unlockAll);
  const info = findLesson(next.id)!;
  const chapter = info.chapter;
  const todaySec = days[dayKey()] ?? 0;
  const streak = streakDays(days);
  const stars = totalStars(p);
  const maxAll = [...CHAPTERS, SONGBOOK_CHAPTER].reduce((a, c) => a + chapterStars(p, c).max, 0);
  const started = lessonStars(p, next.id) > 0;

  return (
    <div className="page home">
      <section className="hero card rise" style={{ '--accent': chapter.accent } as React.CSSProperties}>
        <VenueArt art={chapter.art} accent={chapter.accent} className="hero-art" />
        <div className="hero-shade" />
        <div className="hero-body">
          <span className="eyebrow">
            Up next · {chapter.venue}
          </span>
          <h1>{next.title}</h1>
          <p className="hero-summary">{next.summary}</p>
          <div className="hero-meta">
            <span className="badge">{KIND_LABEL[next.kind]}</span>
            {next.style && <span className="chip">{next.style}</span>}
            {next.bpm && <span className="chip">{next.bpm} bpm</span>}
          </div>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate(`/lesson/${next.id}`)}>
              <Icon name="play" /> {started ? 'Play again' : p.xp > 0 ? 'Continue' : 'Start your journey'}
            </button>
            <button className="btn btn-ghost" onClick={() => navigate(`/chapter/${chapter.id}`)}>
              <Icon name="map" /> {chapter.venue} setlist
            </button>
          </div>
        </div>
        <div className="hero-side">
          <div className="goal">
            <ProgressRing value={todaySec / (goalMin * 60)} size={86} stroke={8}>
              <strong>{Math.floor(todaySec / 60)}</strong>
              <small>/ {goalMin} min</small>
            </ProgressRing>
            <span className="faint">Today</span>
          </div>
          <div className="streak" title="Days in a row">
            <Icon name="flame" className={streak > 0 ? 'lit' : ''} />
            <strong>{streak}</strong>
            <span className="faint">day streak</span>
          </div>
        </div>
      </section>

      <section className="quick rise" style={{ animationDelay: '0.05s' }}>
        <button className="quick-card quick-free" onClick={() => navigate('/songs')}>
          <Icon name="disc" />
          <span>
            <strong>Free play</strong>
            <span className="faint">{FREE_PLAY_SONGS.length} songs, all open</span>
          </span>
        </button>
        <button className="quick-card" onClick={() => navigate('/tuner')}>
          <Icon name="tuner" />
          <span>
            <strong>Tune up</strong>
            <span className="faint">Start every session in tune</span>
          </span>
        </button>
        <button className="quick-card" onClick={() => navigate('/chords')}>
          <Icon name="chords" />
          <span>
            <strong>Chord library</strong>
            <span className="faint">{CHORD_LIST.length} shapes, test yourself</span>
          </span>
        </button>
        <button className="quick-card" onClick={() => navigate('/profile')}>
          <Icon name="trophy" />
          <span>
            <strong>
              {stars} <span className="faint">/ {maxAll}</span> stars
            </strong>
            <span className="faint">Ranks and achievements</span>
          </span>
        </button>
      </section>

      <section className="tour">
        <div className="section-head">
          <h2>The Tour</h2>
          <span className="faint">Nine stops from the garage to the main stage</span>
        </div>
        <ol className="tour-list">
          {CHAPTERS.map((c, i) => {
            const unlocked = isChapterUnlocked(p, i, unlockAll);
            const { got, max } = chapterStars(p, c);
            const current = c.id === chapter.id;
            const gig = c.lessons[c.lessons.length - 1];
            return (
              <li key={c.id} className={`tour-stop ${i % 2 ? 'right' : 'left'} ${unlocked ? '' : 'locked'} ${current ? 'current' : ''}`} style={{ '--accent': c.accent, animationDelay: `${0.05 + i * 0.04}s` } as React.CSSProperties}>
                <span className="tour-dot">{got >= max ? <Icon name="check" width={14} height={14} /> : i + 1}</span>
                <button className="tour-card card" onClick={() => navigate(`/chapter/${c.id}`)}>
                  <VenueArt art={c.art} accent={c.accent} className="tour-art" locked={!unlocked} />
                  <span className="tour-body">
                    <span className="eyebrow">Stop {i + 1}</span>
                    <span className="tour-venue">{c.venue}</span>
                    <span className="tour-title">{c.title}</span>
                    <span className="tour-progress">
                      <Bar value={max ? got / max : 0} color={c.accent} />
                      <span className="faint">
                        {got}/{max}
                      </span>
                    </span>
                    {!unlocked && (
                      <span className="tour-lock">
                        <Icon name="lock" width={14} height={14} /> Play “{CHAPTERS[i - 1].lessons[CHAPTERS[i - 1].lessons.length - 1].title}” to unlock
                      </span>
                    )}
                    {unlocked && current && <span className="tour-here">You are here</span>}
                    {unlocked && !current && got >= max && <Stars value={3} size={13} />}
                    {unlocked && !current && got < max && got > 0 && <span className="faint tour-gig">Gig: {gig.title}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
