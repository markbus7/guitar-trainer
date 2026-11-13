import type { AnalyzerEvent } from '../audio/dsp/analyzer';
import type { Judge, Judgement, PracticeJudge } from './judge';
import type { ChartNote } from './chart';

const freqToMidi = (f: number) => 69 + 12 * Math.log2(f / 440);

/**
 * Feed one analyzer event into the real-time judge.
 * `toSong` converts AudioContext time to song time (and removes input latency).
 */
export function routeToJudge(judge: Judge, e: AnalyzerEvent, toSong: (t: number) => number): Judgement[] {
  switch (e.type) {
    case 'note':
      return judge.onNote({ t: toSong(e.t), midi: e.midi, candidates: e.candidates, legato: e.legato });
    case 'onset':
      return judge.onOnset(toSong(e.t));
    case 'chroma':
      return judge.onChroma(toSong(e.t), e.chroma);
    case 'pitch':
      return e.freq > 0 ? judge.onPitch(toSong(e.t), freqToMidi(e.freq)) : [];
    default:
      return [];
  }
}

export interface PracticeOutcome {
  hit?: ChartNote;
  wrong?: string;
}

/** Feed one analyzer event into the practice ("wait for me") judge. */
export function routeToPractice(judge: PracticeJudge, e: AnalyzerEvent): PracticeOutcome {
  switch (e.type) {
    case 'note':
      return judge.onNote({ midi: e.midi, candidates: e.candidates });
    case 'onset':
      return judge.onOnset(e.t);
    case 'chroma':
      return judge.onChroma(e.t, e.chroma);
    default:
      return {};
  }
}
