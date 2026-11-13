import { midiToFreq } from '../../music/notes';
import { renderPluck } from './pluck';

/**
 * Plays plucked-string notes (Karplus–Strong buffers, rendered once and cached) into
 * an output node, usually a ToneChain. One voice per string: a new note on a string
 * stops the previous one, just like on a real guitar.
 */
export type Flavor = 'electric' | 'acoustic' | 'bass';

export interface NoteOptions {
  dur: number;
  velocity?: number;
  mute?: boolean;
  /** String number (1-6), for voice stealing. */
  string?: number;
  /** Bend up by this many semitones. */
  bend?: number;
  /** Start the note at another pitch and glide to it (slides). */
  slideFrom?: number;
  /** Hammer-ons and pull-offs: softer attack. */
  soft?: boolean;
  vibrato?: boolean;
  /** Ignore the written duration and let it ring out. */
  ring?: boolean;
}

interface Voice {
  src: AudioBufferSourceNode;
  gain: GainNode;
}

const FLAVOR = {
  electric: { brightness: 0.62, pluckPosition: 0.16, length: 3.2 },
  acoustic: { brightness: 0.78, pluckPosition: 0.2, length: 3.6 },
  bass: { brightness: 0.42, pluckPosition: 0.12, length: 2.4 },
};

export class GuitarSynth {
  private cache = new Map<string, AudioBuffer>();
  private voices = new Map<number, Voice>();
  private active = new Set<AudioBufferSourceNode>();

  constructor(
    private readonly ctx: BaseAudioContext,
    private readonly out: AudioNode,
    private readonly flavor: Flavor = 'electric',
  ) {}

  private buffer(midi: number, mute: boolean, soft: boolean): AudioBuffer {
    const key = `${midi}:${mute ? 1 : 0}:${soft ? 1 : 0}`;
    let buf = this.cache.get(key);
    if (buf) return buf;
    const f = FLAVOR[this.flavor];
    const sr = this.ctx.sampleRate;
    const data = renderPluck({
      sampleRate: sr,
      freq: midiToFreq(midi),
      duration: mute ? 0.45 : f.length,
      velocity: 0.85,
      brightness: soft ? f.brightness * 0.6 : f.brightness,
      pluckPosition: f.pluckPosition,
      mute,
      seed: midi * 7 + (mute ? 1 : 0),
    });
    buf = this.ctx.createBuffer(1, data.length, sr);
    buf.copyToChannel(data as Float32Array<ArrayBuffer>, 0);
    this.cache.set(key, buf);
    return buf;
  }

  /** Render buffers ahead of time so scheduling never stalls. */
  prewarm(notes: { midi: number; mute?: boolean; soft?: boolean }[]) {
    for (const n of notes) this.buffer(n.midi, !!n.mute, !!n.soft);
  }

  note(when: number, midi: number, o: NoteOptions) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.buffer(midi, !!o.mute, !!o.soft);
    const gain = ctx.createGain();
    const vel = Math.max(0.05, Math.min(1, o.velocity ?? 0.8));
    const level = Math.pow(vel, 1.4) * (o.soft ? 0.7 : 1);
    gain.gain.setValueAtTime(level, when);

    if (o.slideFrom !== undefined && o.slideFrom !== midi) {
      src.playbackRate.setValueAtTime(Math.pow(2, (o.slideFrom - midi) / 12), when);
      src.playbackRate.linearRampToValueAtTime(1, when + Math.min(0.09, o.dur * 0.5));
    }
    if (o.bend) {
      const start = when + Math.min(0.12, o.dur * 0.2);
      const peak = start + Math.max(0.08, Math.min(0.3, o.dur * 0.35));
      src.playbackRate.setValueAtTime(1, start);
      src.playbackRate.linearRampToValueAtTime(Math.pow(2, o.bend / 12), peak);
    }
    if (o.vibrato) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 5.6;
      const depth = ctx.createGain();
      depth.gain.setValueAtTime(0, when);
      depth.gain.linearRampToValueAtTime(0.012, when + 0.25);
      lfo.connect(depth);
      depth.connect(src.playbackRate);
      lfo.start(when);
      lfo.stop(when + o.dur + 0.3);
    }

    src.connect(gain);
    gain.connect(this.out);
    src.start(when);

    if (o.string !== undefined) {
      const prev = this.voices.get(o.string);
      if (prev) this.release(prev, when, 0.012);
      this.voices.set(o.string, { src, gain });
    }
    if (!o.ring) {
      // Let the note ring for its written length, then damp it.
      const end = when + Math.max(0.1, o.dur);
      gain.gain.setTargetAtTime(0, end, o.mute ? 0.02 : 0.05);
      src.stop(end + 0.4);
    } else {
      src.stop(when + (src.buffer?.duration ?? 3));
    }
    this.active.add(src);
    src.onended = () => {
      this.active.delete(src);
      try {
        gain.disconnect();
      } catch {
        /* ignore */
      }
    };
  }

  /** Strum several strings; `notes` low string first. */
  chord(
    when: number,
    notes: { midi: number; string: number }[],
    o: { dur: number; strum?: 'down' | 'up'; mute?: boolean; velocity?: number; spread?: number },
  ) {
    const ordered = o.strum === 'up' ? [...notes].reverse() : notes;
    const spread = o.spread ?? (ordered.length > 3 ? 0.011 : 0.005);
    const played = o.strum === 'up' && ordered.length > 4 ? ordered.slice(0, 4) : ordered;
    played.forEach((n, i) => {
      this.note(when + i * spread, n.midi, {
        dur: Math.max(0.1, o.dur - i * spread),
        mute: o.mute,
        string: n.string,
        velocity: (o.velocity ?? 0.75) * (1 - i * 0.04) * (o.strum === 'up' ? 0.82 : 1),
      });
    });
  }

  /** A muted "chk" strum: very short, dark plucks on every string. */
  scratch(when: number, strings: { midi: number; string: number }[], velocity = 0.5) {
    strings.forEach((n, i) => {
      this.note(when + i * 0.006, n.midi, { dur: 0.04, mute: true, string: n.string, velocity });
    });
  }

  private release(v: Voice, when: number, tau: number) {
    try {
      v.gain.gain.cancelScheduledValues(when);
      v.gain.gain.setTargetAtTime(0, when, tau);
      v.src.stop(when + 0.2);
    } catch {
      /* the voice may already have stopped */
    }
  }

  /** Silence everything (pause, quit). */
  stopAll(when = this.ctx.currentTime) {
    for (const src of this.active) {
      try {
        src.stop(when);
      } catch {
        /* ignore */
      }
    }
    this.active.clear();
    this.voices.clear();
  }
}
