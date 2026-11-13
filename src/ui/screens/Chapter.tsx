import { useState } from 'react';
import { CHAPTERS, getChapter, isPlayable, maxStars } from '../../content/curriculum';
import type { Lesson } from '../../content/types';
import { TUNINGS } from '../../music/notes';
import { chapterStars, isChapterUnlocked, isLessonUnlocked, lessonStars } from '../../game/progression';
import { progressData, useProgress } from '../../state/progress';
import { useSettings } from '../../state/settings';
import { VenueArt } from '../art/VenueArt';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { Stars } from '../components/Stars';
import { goBack, navigate } from '../router';
import { KIND_ICON, KIND_LABEL } from './labels';

export function ChapterScreen({ id }: { id: string }) {
  useProgress((s) => s.lessons);
  const unlockAll = useSettings((s) => s.unlockAll);
  const [lockedLesson, setLockedLesson] = useState<Lesson | null>(null);
  const chapter = getChapter(id);
  if (!chapter) return <NotFound />;
  const index = CHAPTERS.indexOf(chapter);
  const p = progressData();
  const { got, max } = chapterStars(p, chapter);
  const chapterOpen = isChapterUnlocked(p, index, unlockAll);

  const open = (l: Lesson) => {
    if (isLessonUnlocked(p, l.id, unlockAll)) navigate(`/lesson/${l.id}`);
    else setLockedLesson(l);
  };

  return (
    <div className="page chapter" style={{ '--accent': chapter.accent } as React.CSSProperties}>
      <header className="chapter-hero card">
        <VenueArt art={chapter.art} accent={chapter.accent} className="chapter-art" />
        <div className="hero-shade" />
        <button className="btn btn-icon btn-ghost chapter-back" onClick={() => goBack('/')} aria-label="Back">
          <Icon name="back" />
        </button>
        <div className="chapter-head">
          <span className="eyebrow">
            Stop {index + 1} of {CHAPTERS.length}
          </span>
          <h1>{chapter.venue}</h1>
          <h3 className="chapter-title">{chapter.title}</h3>
          <p className="muted">{chapter.blurb}</p>
          <div className="chapter-stats">
            <span className="chip chip-accent">
              <Icon name="star" /> {got} / {max}
            </span>
            <span className="chip">{chapter.lessons.length} lessons</span>
            {!chapterOpen && (
              <span className="chip">
                <Icon name="lock" /> Locked
              </span>
            )}
          </div>
        </div>
      </header>

      <ol className="setlist">
        {chapter.lessons.map((l, i) => {
          const stars = lessonStars(p, l.id);
          const unlocked = isLessonUnlocked(p, l.id, unlockAll);
          const gig = l.kind === 'song';
          return (
            <li key={l.id} className="rise" style={{ animationDelay: `${i * 0.035}s` }}>
              <button className={`lesson-row card ${gig ? 'gig' : ''} ${unlocked ? '' : 'locked'}`} onClick={() => open(l)}>
                <span className="lr-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="lr-icon">
                  <Icon name={unlocked ? KIND_ICON[l.kind] : 'lock'} />
                </span>
                <span className="lr-body">
                  <span className="lr-top">
                    <span className={`badge ${gig ? 'badge-gig' : ''}`}>{KIND_LABEL[l.kind]}</span>
                    {l.style && <span className="faint lr-style">{l.style}</span>}
                    {l.bpm && isPlayable(l) && <span className="faint lr-style">{l.bpm} bpm</span>}
                    {l.tuning && l.tuning !== 'standard' && <span className="chip chip-accent lr-tuning">{TUNINGS[l.tuning].name}</span>}
                  </span>
                  <span className="lr-title">{l.title}</span>
                  <span className="lr-summary faint">{l.summary}</span>
                </span>
                <span className="lr-stars">
                  <Stars value={stars} max={maxStars(l)} size={15} />
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {lockedLesson && (
        <Modal title="Not unlocked yet" onClose={() => setLockedLesson(null)}>
          <p className="muted">
            This stop builds on the lessons before it. You can still jump in if you already know the basics.
          </p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setLockedLesson(null)}>
              Not yet
            </button>
            <button className="btn btn-primary" onClick={() => navigate(`/lesson/${lockedLesson.id}`)}>
              Play anyway
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function NotFound() {
  return (
    <div className="page empty">
      <h2>Lost backstage</h2>
      <p className="muted">That page does not exist.</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>
        Back to the tour
      </button>
    </div>
  );
}
