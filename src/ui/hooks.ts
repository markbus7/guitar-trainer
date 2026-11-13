import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { mic, type MicStatus } from '../audio/mic';
import type { AnalyzerEvent } from '../audio/dsp/analyzer';

export function useMicStatus(): { status: MicStatus; error: string; label: string } {
  const status = useSyncExternalStore(
    (fn) => mic.onStatus(fn),
    () => mic.status,
  );
  return { status, error: mic.error, label: mic.deviceLabel };
}

/** Subscribe to analyzer events while mounted. */
export function useMicEvents(handler: (events: AnalyzerEvent[]) => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => mic.on((events) => ref.current(events)), []);
}

/** Input level in dB, smoothed, at most ~30 updates per second. */
export function useMicLevel(): { db: number; gateDb: number } {
  const [level, setLevel] = useState({ db: -100, gateDb: -60 });
  const last = useRef(0);
  const peak = useRef(-100);
  useMicEvents((events) => {
    for (const e of events) {
      if (e.type !== 'level') continue;
      peak.current = Math.max(e.db, peak.current - 1.5);
      const now = performance.now();
      if (now - last.current > 33) {
        last.current = now;
        setLevel({ db: peak.current, gateDb: e.gateDb });
      }
    }
  });
  return level;
}

export function useAnimationFrame(cb: (now: number) => void, active = true) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!active) return;
    let id = 0;
    const loop = (t: number) => {
      ref.current(t);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [active]);
}

export function useMediaQuery(q: string) {
  const [match, setMatch] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(q).matches : false));
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setMatch(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [q]);
  return match;
}
