import type { ToneId } from '../../content/types';

/**
 * Amp + cabinet simulation built from Web Audio nodes:
 * tight (pre-drive high-pass) → drive (WaveShaper) → tone stack → cab filters → level,
 * with sends to the shared reverb and an optional delay.
 */
interface TonePreset {
  label: string;
  drive: number;
  curve: 'none' | 'soft' | 'hard' | 'asym';
  tight: number;
  bassDb: number;
  mid: { freq: number; gainDb: number; q: number };
  trebleDb: number;
  /** Cabinet low-pass corner (Hz). */
  cab: number;
  level: number;
  reverb: number;
  delay?: { time: number; feedback: number; mix: number };
}

export const TONES: Record<ToneId, TonePreset> = {
  acoustic: {
    label: 'Acoustic',
    drive: 0,
    curve: 'none',
    tight: 70,
    bassDb: 1,
    mid: { freq: 260, gainDb: -2, q: 1 },
    trebleDb: 4,
    cab: 14000,
    level: 0.95,
    reverb: 0.22,
  },
  clean: {
    label: 'Clean',
    drive: 1.6,
    curve: 'soft',
    tight: 80,
    bassDb: 2,
    mid: { freq: 600, gainDb: 0, q: 0.8 },
    trebleDb: 3,
    cab: 7500,
    level: 0.85,
    reverb: 0.24,
  },
  crunch: {
    label: 'Crunch',
    drive: 7,
    curve: 'soft',
    tight: 100,
    bassDb: 2,
    mid: { freq: 900, gainDb: 2.5, q: 0.8 },
    trebleDb: 1,
    cab: 5200,
    level: 0.55,
    reverb: 0.14,
  },
  punk: {
    label: 'Punk',
    drive: 15,
    curve: 'hard',
    tight: 110,
    bassDb: 3,
    mid: { freq: 1000, gainDb: 3, q: 0.8 },
    trebleDb: 0,
    cab: 5400,
    level: 0.45,
    reverb: 0.08,
  },
  lead: {
    label: 'Lead',
    drive: 24,
    curve: 'soft',
    tight: 160,
    bassDb: 0,
    mid: { freq: 800, gainDb: 4, q: 0.9 },
    trebleDb: 1,
    cab: 5000,
    level: 0.42,
    reverb: 0.26,
    delay: { time: 0.34, feedback: 0.28, mix: 0.22 },
  },
  metal: {
    label: 'Metal',
    drive: 38,
    curve: 'asym',
    tight: 190,
    bassDb: 4,
    mid: { freq: 650, gainDb: -5, q: 0.9 },
    trebleDb: 3,
    cab: 5800,
    level: 0.38,
    reverb: 0.08,
  },
};

const curveCache = new Map<string, Float32Array<ArrayBuffer>>();

export function driveCurve(kind: TonePreset['curve'], k: number): Float32Array<ArrayBuffer> {
  const key = `${kind}:${k}`;
  const cached = curveCache.get(key);
  if (cached) return cached;
  const n = 4096;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  const norm = kind === 'asym' ? 1 : Math.tanh(k);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    let y: number;
    switch (kind) {
      case 'none':
        y = x;
        break;
      case 'soft':
        y = Math.tanh(k * x) / norm;
        break;
      case 'hard': {
        const v = k * x;
        y = (v / (1 + Math.abs(v))) * (1 + 1 / k);
        y = Math.max(-1, Math.min(1, y));
        break;
      }
      case 'asym': {
        const bias = 0.18;
        const v = Math.tanh(k * (x + bias)) - Math.tanh(k * bias);
        y = v / (1 + Math.abs(Math.tanh(k * bias)));
        break;
      }
    }
    curve[i] = y;
  }
  curveCache.set(key, curve);
  return curve;
}

export class ToneChain {
  readonly input: GainNode;
  readonly output: GainNode;
  private nodes: AudioNode[] = [];

  constructor(
    private readonly ctx: BaseAudioContext,
    tone: ToneId,
    destination: AudioNode,
    reverb?: AudioNode,
  ) {
    const p = TONES[tone];
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.output.gain.value = p.level;

    const tight = ctx.createBiquadFilter();
    tight.type = 'highpass';
    tight.frequency.value = p.tight;
    tight.Q.value = 0.7;

    const shaper = ctx.createWaveShaper();
    shaper.curve = driveCurve(p.curve, p.drive);
    shaper.oversample = p.curve === 'none' ? 'none' : '4x';

    const bass = ctx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 130;
    bass.gain.value = p.bassDb;

    const mid = ctx.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = p.mid.freq;
    mid.Q.value = p.mid.q;
    mid.gain.value = p.mid.gainDb;

    const treble = ctx.createBiquadFilter();
    treble.type = 'highshelf';
    treble.frequency.value = 3000;
    treble.gain.value = p.trebleDb;

    const cab1 = ctx.createBiquadFilter();
    cab1.type = 'lowpass';
    cab1.frequency.value = p.cab;
    cab1.Q.value = 0.9;
    const cab2 = ctx.createBiquadFilter();
    cab2.type = 'lowpass';
    cab2.frequency.value = Math.min(18000, p.cab * 1.4);
    cab2.Q.value = 0.5;
    const cabHp = ctx.createBiquadFilter();
    cabHp.type = 'highpass';
    cabHp.frequency.value = 75;

    // Drive input level: guitar buffers peak around 0.8, give the shaper some headroom.
    const pre = ctx.createGain();
    pre.gain.value = p.curve === 'none' ? 1 : 0.9;

    this.input.connect(tight);
    tight.connect(pre);
    pre.connect(shaper);
    shaper.connect(bass);
    bass.connect(mid);
    mid.connect(treble);
    treble.connect(cab1);
    cab1.connect(cab2);
    cab2.connect(cabHp);
    cabHp.connect(this.output);
    this.output.connect(destination);
    this.nodes.push(tight, pre, shaper, bass, mid, treble, cab1, cab2, cabHp);

    if (reverb && p.reverb > 0) {
      const send = ctx.createGain();
      send.gain.value = p.reverb;
      this.output.connect(send);
      send.connect(reverb);
      this.nodes.push(send);
    }
    if (p.delay) {
      const delay = ctx.createDelay(1);
      delay.delayTime.value = p.delay.time;
      const fb = ctx.createGain();
      fb.gain.value = p.delay.feedback;
      const wet = ctx.createGain();
      wet.gain.value = p.delay.mix;
      const damp = ctx.createBiquadFilter();
      damp.type = 'lowpass';
      damp.frequency.value = 3200;
      this.output.connect(delay);
      delay.connect(damp);
      damp.connect(fb);
      fb.connect(delay);
      damp.connect(wet);
      wet.connect(destination);
      this.nodes.push(delay, fb, wet, damp);
    }
  }

  dispose() {
    try {
      this.input.disconnect();
      this.output.disconnect();
      for (const n of this.nodes) n.disconnect();
    } catch {
      /* already disconnected */
    }
  }

  get context() {
    return this.ctx;
  }
}
