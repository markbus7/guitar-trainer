import { useRef, useState } from 'react';
import { hasEngine, getEngine } from '../audio/engine';
import type { ChartNote } from '../game/chart';
import { chordMatches, noteMatches } from '../game/judge';
import { noteName } from '../music/notes';
import { useMicEvents } from './hooks';

/** Something to listen for outside the highway: lesson checks, chord tests, drills. */
export type ListenTarget =
  | { kind: 'note'; midis: number[] }
  | { kind: 'chord'; midis: number[]; name?: string }
  | { kind: 'any' };

export interface ListenState {
  heard: string | null;
  wrong: boolean;
  attempts: number;
}

const pc = (m: number) => ((Math.round(m) % 12) + 12) % 12;

function asChartNote(midis: number[], kind: 'note' | 'chord'): ChartNote {
  return {
    id: -1,
    time: 0,
    dur: 1,
    beat: 0,
    durBeats: 1,
    kind,
    notes: [],
    midis: [...midis].sort((a, b) => a - b),
    section: 0,
  };
}

/**
 * Listen to the mic for a target. Calls onSuccess each time it is played correctly.
 * Reference tones the app plays itself are ignored.
 */
export function useListenFor(target: ListenTarget | null, onSuccess: () => void, opts: { active?: boolean; leniency?: number } = {}): ListenState {
  const [state, setState] = useState<ListenState>({ heard: null, wrong: false, attempts: 0 });
  const lastOnset = useRef<number | null>(null);
  const succeeded = useRef(false);
  const cb = useRef(onSuccess);
  cb.current = onSuccess;
  const active = opts.active ?? true;

  useMicEvents((events) => {
    if (!active || !target) return;
    const busyUntil = hasEngine() ? getEngine().previewUntil : 0;
    for (const e of events) {
      if (e.type === 'level' || e.type === 'pitch') continue;
      if (e.t < busyUntil) continue;
      if (e.type === 'onset') {
        lastOnset.current = e.t;
        succeeded.current = false;
        if (target.kind === 'any') {
          cb.current();
          setState((s) => ({ ...s, heard: 'a note', wrong: false }));
        }
        continue;
      }
      if (e.type === 'note') {
        const name = noteName(e.midi, { octave: false });
        if (target.kind === 'note') {
          const ok = target.midis.some((m) => noteMatches(asChartNote([m], 'note'), { midi: e.midi, candidates: e.candidates }));
          if (ok) {
            cb.current();
            setState((s) => ({ heard: name, wrong: false, attempts: s.attempts }));
          } else setState((s) => ({ heard: name, wrong: true, attempts: s.attempts + 1 }));
        } else if (target.kind === 'chord') {
          // Power chords: the root note alone is good enough evidence.
          const pcs = new Set(target.midis.map(pc));
          if (pcs.size <= 2 && pc(e.midi) === pc(Math.min(...target.midis)) && !succeeded.current) {
            succeeded.current = true;
            cb.current();
            setState((s) => ({ heard: target.name ?? name, wrong: false, attempts: s.attempts }));
          }
        }
        continue;
      }
      if (e.type === 'chroma' && target.kind === 'chord' && !succeeded.current) {
        if (lastOnset.current === null || Math.abs(lastOnset.current - e.t) > 0.004) continue;
        const res = chordMatches(asChartNote(target.midis, 'chord'), e.chroma, opts.leniency ?? 0.7);
        if (res.ok) {
          succeeded.current = true;
          cb.current();
          setState((s) => ({ heard: target.name ?? 'that chord', wrong: false, attempts: s.attempts }));
        } else setState((s) => ({ heard: res.bestOtherLabel || 'something else', wrong: true, attempts: s.attempts + 1 }));
      }
    }
  });

  return state;
}
