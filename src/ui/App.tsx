import { useEffect } from 'react';
import { unlockAudio, hasEngine, getEngine } from '../audio/engine';
import { mic } from '../audio/mic';
import { syncMonitor } from '../audio/monitor';
import { getLesson } from '../content/curriculum';
import type { SessionMode } from '../game/session';
import { useProgress } from '../state/progress';
import { useSettings } from '../state/settings';
import { dayKey, rankFor, streakDays } from '../game/progression';
import { Icon, type IconName } from './components/Icon';
import { Logo } from './components/Logo';
import { useMicStatus } from './hooks';
import { navigate, useRoute } from './router';
import { ChapterScreen, NotFound } from './screens/Chapter';
import { DrillScreen } from './screens/Drill';
import { Home } from './screens/Home';
import { LearnLesson } from './screens/Learn';
import { LessonIntro } from './screens/LessonIntro';
import { Onboarding } from './screens/Onboarding';
import { PlayScreen } from './screens/Play';
import { ProfileScreen } from './screens/Profile';
import { SettingsScreen } from './screens/Settings';
import { ChordsScreen, TunerScreen } from './screens/ToolsScreens';
import { Toasts } from './toasts';

const NAV: { path: string; icon: IconName; label: string; match: string[] }[] = [
  { path: '/', icon: 'map', label: 'Tour', match: ['', 'chapter', 'lesson'] },
  { path: '/tuner', icon: 'tuner', label: 'Tuner', match: ['tuner'] },
  { path: '/chords', icon: 'chords', label: 'Chords', match: ['chords'] },
  { path: '/profile', icon: 'user', label: 'Profile', match: ['profile'] },
  { path: '/settings', icon: 'settings', label: 'Settings', match: ['settings'] },
];

export function App() {
  const route = useRoute();
  const onboarded = useSettings((s) => s.onboarded);
  const monitor = useSettings((s) => s.monitor);
  const output = useSettings((s) => s.output);
  const volumes = useSettings((s) => s.volumes);
  const { status } = useMicStatus();

  // Browsers only start audio after a user gesture: unlock on the first tap or key.
  useEffect(() => {
    const unlock = () => void unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    if (hasEngine()) getEngine().setVolumes(volumes);
  }, [volumes]);

  useEffect(() => {
    syncMonitor({ enabled: monitor.enabled, tone: monitor.tone, level: monitor.level, headphones: output === 'headphones' });
  }, [monitor.enabled, monitor.tone, monitor.level, output, status]);

  // Release the microphone when leaving the app open in a background tab for long.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onVis = () => {
      if (document.hidden) timer = setTimeout(() => mic.stop(), 5 * 60_000);
      else if (timer) clearTimeout(timer);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const [head, id] = route.parts;
  const playing = head === 'play';

  let screen: React.ReactNode;
  if (!onboarded && head !== 'settings') screen = <Onboarding />;
  else {
    switch (head) {
      case undefined:
        screen = <Home />;
        break;
      case 'chapter':
        screen = <ChapterScreen id={id ?? ''} />;
        break;
      case 'lesson':
        screen = <LessonRoute id={id ?? ''} />;
        break;
      case 'play': {
        const mode = (route.query.get('mode') as SessionMode) || 'play';
        const tempo = Math.max(0.4, Math.min(1.2, Number(route.query.get('tempo')) || 1));
        screen = <PlayScreen key={`${id}-${mode}-${tempo}`} lessonId={id ?? ''} mode={['play', 'practice', 'listen'].includes(mode) ? mode : 'play'} tempo={tempo} />;
        break;
      }
      case 'tuner':
        screen = <TunerScreen />;
        break;
      case 'chords':
        screen = <ChordsScreen />;
        break;
      case 'profile':
        screen = <ProfileScreen />;
        break;
      case 'settings':
        screen = <SettingsScreen />;
        break;
      default:
        screen = <NotFound />;
    }
  }

  const showChrome = onboarded && !playing;
  return (
    <div className={`app ${playing ? 'is-playing' : ''}`}>
      {showChrome && <TopBar active={head ?? ''} />}
      <main className="main" key={route.path}>
        {screen}
      </main>
      {showChrome && <BottomNav active={head ?? ''} />}
      <Toasts />
    </div>
  );
}

function LessonRoute({ id }: { id: string }) {
  let lesson;
  try {
    lesson = getLesson(id);
  } catch {
    return <NotFound />;
  }
  if (lesson.kind === 'learn') return <LearnLesson lesson={lesson} />;
  if (lesson.kind === 'drill') return <DrillScreen lesson={lesson} />;
  return <LessonIntro lesson={lesson} />;
}

function TopBar({ active }: { active: string }) {
  const xp = useProgress((s) => s.xp);
  const days = useProgress((s) => s.days);
  const goal = useSettings((s) => s.dailyGoalMin);
  const streak = streakDays(days);
  const { rank } = rankFor(xp);
  const today = (days[dayKey()] ?? 0) / 60;
  return (
    <header className="topbar">
      <button className="topbar-logo" onClick={() => navigate('/')} aria-label="Fretforge home">
        <Logo size={30} />
      </button>
      <nav className="topnav" aria-label="Main">
        {NAV.map((n) => (
          <button key={n.path} className={`topnav-link ${n.match.includes(active) ? 'on' : ''}`} onClick={() => navigate(n.path)}>
            <Icon name={n.icon} />
            {n.label}
          </button>
        ))}
      </nav>
      <div className="topbar-stats">
        <span className={`chip streak-chip ${today >= goal ? 'goal-met' : ''}`} title={`${Math.floor(today)} of ${goal} minutes today`}>
          <Icon name="flame" /> {streak}
        </span>
        <button className="chip rank-chip" onClick={() => navigate('/profile')}>
          <Icon name="bolt" /> {rank.title}
        </button>
      </div>
    </header>
  );
}

function BottomNav({ active }: { active: string }) {
  return (
    <nav className="bottomnav" aria-label="Main">
      {NAV.map((n) => (
        <button key={n.path} className={`bottomnav-link ${n.match.includes(active) ? 'on' : ''}`} onClick={() => navigate(n.path)}>
          <Icon name={n.icon} />
          <span>{n.label}</span>
        </button>
      ))}
    </nav>
  );
}
