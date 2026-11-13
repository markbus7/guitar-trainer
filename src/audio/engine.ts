import { DRUM_IDS, DRUM_LEVEL, renderDrumKit, type DrumId } from './synth/drums';
import { reverbImpulse } from './synth/offline';
import { GuitarSynth } from './synth/guitar';
import { ToneChain } from './synth/amp';
import type { ToneId } from '../content/types';

/**
 * The single AudioContext and its mixing buses.
 *
 *   guide   ─┐
 *   pitched ─┤ (bass, backing guitar)
 *   drums   ─┼─► master ─► limiter ─► speakers
 *   click   ─┤
 *   preview ─┤ (tuner reference tones, chord previews)
 *   monitor ─┘ (hearing your own guitar through an amp)
 */
export interface Volumes {
  master: number;
  guide: number;
  band: number;
  click: number;
}

type Ctor = typeof AudioContext;

export class AudioEngine {
  readonly ctx: AudioContext;
  readonly master: GainNode;
  readonly guide: GainNode;
  readonly pitched: GainNode;
  readonly drums: GainNode;
  readonly click: GainNode;
  readonly preview: GainNode;
  readonly monitor: GainNode;
  readonly reverb: ConvolverNode;
  private drumBufs: Record<DrumId, AudioBuffer> | null = null;
  private drumSources = new Set<AudioBufferSourceNode>();
  private previewSynth: GuitarSynth | null = null;
  /** AudioContext time until which preview sounds are playing (mic consumers ignore input). */
  previewUntil = 0;
  private lastOutput = 0;

  constructor() {
    const AC: Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: Ctor }).webkitAudioContext;
    this.ctx = new AC({ latencyHint: 'interactive' });
    const ctx = this.ctx;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -8;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.2;
    limiter.connect(ctx.destination);

    this.master = ctx.createGain();
    this.master.connect(limiter);

    const bus = () => {
      const g = ctx.createGain();
      g.connect(this.master);
      return g;
    };
    this.guide = bus();
    this.pitched = bus();
    this.drums = bus();
    this.click = bus();
    this.preview = bus();
    this.monitor = bus();

    this.reverb = ctx.createConvolver();
    const [l, r] = reverbImpulse(ctx.sampleRate);
    const ir = ctx.createBuffer(2, l.length, ctx.sampleRate);
    ir.copyToChannel(l as Float32Array<ArrayBuffer>, 0);
    ir.copyToChannel(r as Float32Array<ArrayBuffer>, 1);
    this.reverb.buffer = ir;
    const ret = ctx.createGain();
    ret.gain.value = 0.55;
    this.reverb.connect(ret);
    ret.connect(this.master);

    // A touch of room on the drums.
    const drumRoom = ctx.createGain();
    drumRoom.gain.value = 0.12;
    this.drums.connect(drumRoom);
    drumRoom.connect(this.reverb);
  }

  get sampleRate() {
    return this.ctx.sampleRate;
  }

  async resume() {
    if (this.ctx.state !== 'running') {
      try {
        await this.ctx.resume();
      } catch {
        /* needs a user gesture; the next click will retry */
      }
    }
    return this.ctx.state === 'running';
  }

  setVolumes(v: Volumes) {
    const t = this.ctx.currentTime;
    const set = (g: GainNode, value: number) => g.gain.setTargetAtTime(value, t, 0.02);
    set(this.master, v.master);
    set(this.guide, v.guide);
    set(this.pitched, v.band * 0.9);
    set(this.drums, v.band);
    set(this.click, v.click);
    set(this.preview, 0.9);
  }

  /** Mute the bass and backing guitar (speakers mode: the mic would hear them). */
  setPitchedMuted(muted: boolean, band: number) {
    this.pitched.gain.setTargetAtTime(muted ? 0 : band * 0.9, this.ctx.currentTime, 0.02);
  }

  /** Estimated time from scheduling a sound to it leaving the speakers. */
  outputLatency(): number {
    const c = this.ctx as AudioContext & { outputLatency?: number };
    return (c.outputLatency ?? 0) + (c.baseLatency ?? 0.005);
  }

  /** The AudioContext time of what is coming out of the speakers right now. */
  outputTime(): number {
    const ctx = this.ctx;
    let t = ctx.currentTime - this.outputLatency();
    if (typeof ctx.getOutputTimestamp === 'function') {
      const ts = ctx.getOutputTimestamp();
      if (ts.contextTime !== undefined && ts.performanceTime !== undefined && ts.contextTime > 0) {
        const est = ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
        if (Math.abs(est - t) < 0.5) t = est;
      }
    }
    // Never run backwards (timestamps can jitter by a millisecond or two).
    if (t < this.lastOutput && this.lastOutput - t < 0.05) t = this.lastOutput;
    this.lastOutput = t;
    return t;
  }

  private kit() {
    if (!this.drumBufs) {
      const raw = renderDrumKit(this.ctx.sampleRate);
      const bufs = {} as Record<DrumId, AudioBuffer>;
      for (const id of DRUM_IDS) {
        const data = raw[id];
        const b = this.ctx.createBuffer(1, data.length, this.ctx.sampleRate);
        b.copyToChannel(data as Float32Array<ArrayBuffer>, 0);
        bufs[id] = b;
      }
      this.drumBufs = bufs;
    }
    return this.drumBufs;
  }

  prewarmDrums() {
    this.kit();
  }

  playDrum(id: DrumId, when: number, velocity = 1, dest?: AudioNode) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.kit()[id];
    const g = this.ctx.createGain();
    g.gain.value = DRUM_LEVEL[id] * velocity;
    src.connect(g);
    g.connect(dest ?? (id === 'click' || id === 'clickAccent' ? this.click : this.drums));
    src.start(Math.max(when, this.ctx.currentTime));
    this.drumSources.add(src);
    src.onended = () => {
      this.drumSources.delete(src);
      g.disconnect();
    };
  }

  stopDrums() {
    for (const s of this.drumSources) {
      try {
        s.stop();
      } catch {
        /* ignore */
      }
    }
    this.drumSources.clear();
  }

  private previewVoice() {
    if (!this.previewSynth) {
      const chain = new ToneChain(this.ctx, 'clean' as ToneId, this.preview, this.reverb);
      this.previewSynth = new GuitarSynth(this.ctx, chain.input, 'acoustic');
    }
    return this.previewSynth;
  }

  /** Play a reference note (tuner, lesson hints). */
  previewNote(midi: number, dur = 1.6) {
    const when = this.ctx.currentTime + 0.03;
    this.previewVoice().note(when, midi, { dur, velocity: 0.85, string: 99 });
    this.previewUntil = Math.max(this.previewUntil, when + dur + 0.4);
  }

  /** Strum a chord preview (low string first). */
  previewChord(notes: { midi: number; string: number }[], dur = 2) {
    const when = this.ctx.currentTime + 0.03;
    this.previewVoice().chord(when, notes, { dur, strum: 'down', velocity: 0.8, spread: 0.035 });
    this.previewUntil = Math.max(this.previewUntil, when + dur + 0.5);
  }

  previewPlaying() {
    return this.ctx.currentTime < this.previewUntil;
  }
}

let engine: AudioEngine | null = null;

export function getEngine(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}

export function hasEngine() {
  return engine !== null;
}

/** Call from a user gesture (click / key press). */
export async function unlockAudio() {
  return getEngine().resume();
}
