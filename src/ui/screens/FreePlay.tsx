import { useMemo, useState } from 'react';
import { ALL_LESSONS, CHAPTERS, FREE_PLAY_SONGS, SONGBOOK_CHAPTER, findLesson } from '../../content/curriculum';
import { GENRES, GENRE_ORDER, LEVEL_LABEL } from '../../content/genres';
import type { Genre, Lesson } from '../../content/types';
import { buildChart } from '../../game/chart';
import { lessonStars } from '../../game/progression';
import { TUNINGS } from '../../music/notes';
import { activeTabs, tabToLesson, useMyTabs, type CustomTab } from '../../state/mytabs';
import { progressData, useProgress } from '../../state/progress';
import { VenueArt } from '../art/VenueArt';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { SongCover, type CoverMotif } from '../components/SongCover';
import { Stars } from '../components/Stars';
import { navigate, useRoute } from '../router';

type Tab = 'songs' | 'riffs' | 'mine';
type LevelFilter = 'all' | 'easy' | 'medium' | 'hard';
type Sort = 'easy' | 'hard' | 'az' | 'recent' | 'new';

// Filters survive going into a song and coming back.
const memory: { genre: Genre | 'all'; level: LevelFilter; sort: Sort; query: string } = { genre: 'all', level: 'all', sort: 'easy', query: '' };

const RIFFS = ALL_LESSONS.filter((l) => l.kind === 'riff');

const lengthCache = new WeakMap<Lesson, number>();
function songLength(l: Lesson) {
  let d = lengthCache.get(l);
  if (d === undefined) {
    try {
      d = buildChart(l, 1).duration;
    } catch {
      d = 0;
    }
    lengthCache.set(l, d);
  }
  return d;
}

function fmtTime(sec: number) {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function coverFor(l: Lesson): { kind: CoverMotif; color: string } {
  if (l.genre) return { kind: l.genre, color: GENRES[l.genre].color };
  const chapter = findLesson(l.id)?.chapter;
  if (l.id.startsWith('my-')) return { kind: 'tab', color: '#5cc8ff' };
  return { kind: 'riff', color: chapter?.accent ?? '#ff8a3d' };
}

function LevelDots({ level }: { level?: number }) {
  if (!level) return null;
  return (
    <span className="level-dots" title={`Level ${level} of 5: ${LEVEL_LABEL[level as 1]}`} aria-label={`Level ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= level ? 'on' : ''} />
      ))}
    </span>
  );
}

function SongCard({ lesson, stars, subtitle, index }: { lesson: Lesson; stars: number; subtitle: string; index: number }) {
  const cover = coverFor(lesson);
  const tuning = lesson.tuning ?? 'standard';
  return (
    <li className="rise" style={{ animationDelay: `${Math.min(index, 12) * 0.03}s` }}>
      <button className="song-card card" style={{ '--accent': cover.color } as React.CSSProperties} onClick={() => navigate(`/lesson/${lesson.id}`)}>
        <SongCover id={lesson.id} kind={cover.kind} color={cover.color} size={68} />
        <span className="sc-body">
          <span className="sc-title">{lesson.title}</span>
          <span className="sc-band faint">{subtitle}</span>
          <span className="sc-meta">
            {lesson.genre && <span className="sc-genre">{GENRES[lesson.genre].label}</span>}
            <LevelDots level={lesson.level} />
            <span className="faint">
              {lesson.bpm} bpm · {fmtTime(songLength(lesson))}
            </span>
            {tuning !== 'standard' && <span className="chip chip-accent lr-tuning">{TUNINGS[tuning].name}</span>}
          </span>
        </span>
        <span className="sc-stars">
          <Stars value={stars} max={3} size={14} />
        </span>
      </button>
    </li>
  );
}

export function FreePlayScreen() {
  const route = useRoute();
  useProgress((s) => s.lessons);
  const tabs = useMyTabs((s) => s.tabs);
  const remove = useMyTabs((s) => s.remove);
  const tab = (['songs', 'riffs', 'mine'].includes(route.query.get('tab') ?? '') ? route.query.get('tab') : 'songs') as Tab;
  const [genre, setGenre] = useState(memory.genre);
  const [level, setLevel] = useState(memory.level);
  const [sort, setSort] = useState(memory.sort);
  const [query, setQuery] = useState(memory.query);
  const [deleting, setDeleting] = useState<CustomTab | null>(null);
  Object.assign(memory, { genre, level, sort, query });
  const p = progressData();
  const mine = activeTabs(tabs);

  const subtitleOf = (l: Lesson) => {
    const c = findLesson(l.id)?.chapter;
    if (l.band) return l.band;
    if (c && c !== SONGBOOK_CHAPTER) return `Tour gig · ${c.venue}`;
    return '';
  };

  const songs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = FREE_PLAY_SONGS.filter((l) => {
      if (genre !== 'all' && l.genre !== genre) return false;
      const lv = l.level ?? 3;
      if (level === 'easy' && lv > 2) return false;
      if (level === 'medium' && lv !== 3) return false;
      if (level === 'hard' && lv < 4) return false;
      if (q && ![l.title, l.band, l.style, l.genre && GENRES[l.genre].label].some((x) => x?.toLowerCase().includes(q))) return false;
      return true;
    });
    const rec = (l: Lesson) => p.lessons[l.id];
    const sorted = [...list];
    if (sort === 'easy') sorted.sort((a, b) => (a.level ?? 3) - (b.level ?? 3) || (a.bpm ?? 0) - (b.bpm ?? 0));
    if (sort === 'hard') sorted.sort((a, b) => (b.level ?? 3) - (a.level ?? 3) || (b.bpm ?? 0) - (a.bpm ?? 0));
    if (sort === 'az') sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'recent') sorted.sort((a, b) => (rec(b)?.lastPlayed ?? 0) - (rec(a)?.lastPlayed ?? 0));
    if (sort === 'new') sorted.sort((a, b) => Number(!!rec(a)) - Number(!!rec(b)) || (a.level ?? 3) - (b.level ?? 3));
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre, level, sort, query, p.lessons]);

  const counts = useMemo(() => {
    const m = new Map<Genre, number>();
    FREE_PLAY_SONGS.forEach((l) => l.genre && m.set(l.genre, (m.get(l.genre) ?? 0) + 1));
    return m;
  }, []);

  const songbookStars = FREE_PLAY_SONGS.reduce((a, l) => a + lessonStars(p, l.id), 0);
  const setTab = (t: Tab) => navigate(t === 'songs' ? '/songs' : `/songs?tab=${t}`, { replace: true });
  const filtered = genre !== 'all' || level !== 'all' || query.trim() !== '';
  const featured = FREE_PLAY_SONGS.filter((l) => l.id.startsWith('sb-')).filter((_, i) => i % 5 === 1).slice(0, 4);

  return (
    <div className="page freeplay" style={{ '--accent': SONGBOOK_CHAPTER.accent } as React.CSSProperties}>
      <header className="fp-hero chapter-hero card">
        <VenueArt art="mainstage" accent={SONGBOOK_CHAPTER.accent} className="chapter-art" />
        <div className="hero-shade" />
        <div className="fp-covers" aria-hidden="true">
          {featured.map((l, i) => {
            const c = coverFor(l);
            return <SongCover key={l.id} id={l.id} kind={c.kind} color={c.color} size={92} className={`fp-cover fp-cover-${i}`} />;
          })}
        </div>
        <div className="chapter-head">
          <span className="eyebrow">Free play</span>
          <h1>Songbook</h1>
          <p className="muted">No tour and no unlocking: every song is open. Pick one you like and play.</p>
          <div className="chapter-stats">
            <span className="chip chip-accent">
              <Icon name="star" /> {songbookStars} / {FREE_PLAY_SONGS.length * 3}
            </span>
            <span className="chip">{FREE_PLAY_SONGS.length} songs</span>
            <span className="chip">{RIFFS.length} riffs</span>
          </div>
        </div>
      </header>

      <div className="fp-toolbar">
        <div className="segmented fp-tabs" role="tablist" aria-label="Free play">
          <button role="tab" aria-pressed={tab === 'songs'} aria-selected={tab === 'songs'} onClick={() => setTab('songs')}>
            Songs
          </button>
          <button role="tab" aria-pressed={tab === 'riffs'} aria-selected={tab === 'riffs'} onClick={() => setTab('riffs')}>
            Riffs
          </button>
          <button role="tab" aria-pressed={tab === 'mine'} aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>
            My tabs{mine.length ? ` (${mine.length})` : ''}
          </button>
        </div>
        {tab === 'songs' && (
          <label className="fp-search">
            <Icon name="search" />
            <input type="search" placeholder="Search songs, bands, styles" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search songs" />
          </label>
        )}
        {tab === 'mine' && (
          <button className="btn btn-primary" onClick={() => navigate('/songs/new')}>
            <Icon name="plus" /> Add a tab
          </button>
        )}
      </div>

      {tab === 'songs' && (
        <>
          <div className="fp-filters">
            <div className="fp-genres" role="group" aria-label="Style">
              <button className={`genre-chip ${genre === 'all' ? 'on' : ''}`} onClick={() => setGenre('all')}>
                All styles
              </button>
              {GENRE_ORDER.filter((g) => counts.get(g)).map((g) => (
                <button key={g} className={`genre-chip ${genre === g ? 'on' : ''}`} style={{ '--accent': GENRES[g].color } as React.CSSProperties} onClick={() => setGenre(genre === g ? 'all' : g)}>
                  <i className="genre-dot" /> {GENRES[g].label} <span className="faint">{counts.get(g)}</span>
                </button>
              ))}
            </div>
            <div className="fp-filter-row">
              <div className="segmented" role="group" aria-label="Level">
                {(
                  [
                    ['all', 'Any level'],
                    ['easy', 'Easy'],
                    ['medium', 'Medium'],
                    ['hard', 'Hard'],
                  ] as [LevelFilter, string][]
                ).map(([id, label]) => (
                  <button key={id} aria-pressed={level === id} onClick={() => setLevel(id)}>
                    {label}
                  </button>
                ))}
              </div>
              <select className="fp-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
                <option value="easy">Easiest first</option>
                <option value="hard">Hardest first</option>
                <option value="az">Title A–Z</option>
                <option value="recent">Recently played</option>
                <option value="new">Not played yet</option>
              </select>
            </div>
          </div>
          {songs.length ? (
            <ul className="song-grid">
              {songs.map((l, i) => (
                <SongCard key={l.id} lesson={l} stars={lessonStars(p, l.id)} subtitle={subtitleOf(l)} index={i} />
              ))}
            </ul>
          ) : (
            <div className="fp-empty card">
              <Icon name="search" />
              <p className="muted">No songs match these filters.</p>
              {filtered && (
                <button className="btn" onClick={() => (setGenre('all'), setLevel('all'), setQuery(''))}>
                  Clear filters
                </button>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'riffs' && (
        <>
          <p className="muted fp-lead">Short riffs from the tour, always open. Great for a quick warm-up.</p>
          <ul className="song-grid">
            {RIFFS.map((l, i) => {
              const c = findLesson(l.id)!.chapter;
              const stop = CHAPTERS.indexOf(c) + 1;
              return <SongCard key={l.id} lesson={l} stars={lessonStars(p, l.id)} subtitle={`Stop ${stop} · ${c.venue}${l.style ? ` · ${l.style}` : ''}`} index={i} />;
            })}
          </ul>
        </>
      )}

      {tab === 'mine' && (
        <>
          {mine.length === 0 ? (
            <div className="fp-empty card">
              <SongCover id="my-empty" kind="tab" color="#5cc8ff" size={84} />
              <h3>Play the songs you love</h3>
              <p className="muted">
                Found a tab or a chord sheet online? Copy it, paste it here and Fretforge turns it into a song on the highway, with drums and scoring.
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/songs/new')}>
                <Icon name="paste" /> Paste a tab
              </button>
            </div>
          ) : (
            <ul className="song-grid">
              {mine.map((t, i) => {
                const lesson = tabToLesson(t);
                return (
                  <li key={t.id} className="rise my-tab" style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}>
                    {lesson ? (
                      <SongCardInner lesson={lesson} stars={lessonStars(p, t.id)} />
                    ) : (
                      <div className="song-card card broken">
                        <SongCover id={t.id} kind="tab" color="#ff5c7a" size={68} />
                        <span className="sc-body">
                          <span className="sc-title">{t.title || 'Untitled tab'}</span>
                          <span className="sc-band faint">Nothing playable found. Edit the tab to fix it.</span>
                        </span>
                      </div>
                    )}
                    <div className="my-tab-actions">
                      <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/songs/edit/${t.id}`)}>
                        <Icon name="edit" /> Edit
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => setDeleting(t)} aria-label={`Delete ${t.title}`}>
                        <Icon name="trash" /> Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="faint small fp-note">
            <Icon name="info" width={14} height={14} /> Your tabs are saved in this browser. Connect GitHub in{' '}
            <a href="#/settings" onClick={(e) => (e.preventDefault(), navigate('/settings'))}>
              Settings
            </a>{' '}
            to keep them (and your progress) in sync on all your devices.
          </p>
        </>
      )}

      {deleting && (
        <Modal title="Delete this tab?" onClose={() => setDeleting(null)}>
          <p className="muted">“{deleting.title || 'Untitled tab'}” will be removed from My tabs.</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setDeleting(null)}>
              Keep it
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                remove(deleting.id);
                setDeleting(null);
              }}
            >
              <Icon name="trash" /> Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SongCardInner({ lesson, stars }: { lesson: Lesson; stars: number }) {
  const cover = coverFor(lesson);
  const tuning = lesson.tuning ?? 'standard';
  return (
    <button className="song-card card" style={{ '--accent': cover.color } as React.CSSProperties} onClick={() => navigate(`/lesson/${lesson.id}`)}>
      <SongCover id={lesson.id} kind={cover.kind} color={cover.color} size={68} />
      <span className="sc-body">
        <span className="sc-title">{lesson.title}</span>
        <span className="sc-band faint">{lesson.band ?? 'My tab'}</span>
        <span className="sc-meta">
          <span className="faint">
            {lesson.bpm} bpm · {fmtTime(songLength(lesson))}
          </span>
          {tuning !== 'standard' && <span className="chip chip-accent lr-tuning">{TUNINGS[tuning].name}</span>}
        </span>
      </span>
      <span className="sc-stars">
        <Stars value={stars} max={3} size={14} />
      </span>
    </button>
  );
}
