/**
 * YIN fundamental frequency estimator (de Cheveigné & Kawahara, 2002).
 *
 * The difference function is computed incrementally so we can stop as soon as the
 * first confident dip has been found. That makes high notes much cheaper than low ones.
 */
export interface PitchEstimate {
  freq: number;
  /** 0..1 — how periodic the signal is (1 - normalized difference at the chosen lag). */
  clarity: number;
}

export class Yin {
  readonly sampleRate: number;
  readonly windowSize: number;
  readonly tauMin: number;
  readonly tauMax: number;
  threshold: number;
  private readonly cmnd: Float32Array;

  constructor(sampleRate: number, opts: { windowSize?: number; minFreq?: number; maxFreq?: number; threshold?: number } = {}) {
    this.sampleRate = sampleRate;
    const minFreq = opts.minFreq ?? 60;
    const maxFreq = opts.maxFreq ?? 1400;
    this.tauMax = Math.ceil(sampleRate / minFreq);
    this.tauMin = Math.max(2, Math.floor(sampleRate / maxFreq));
    // At least ~1.5 periods of the lowest note in the integration window.
    this.windowSize = opts.windowSize ?? Math.ceil(this.tauMax * 1.5);
    this.threshold = opts.threshold ?? 0.15;
    this.cmnd = new Float32Array(this.tauMax + 2);
  }

  /** Number of samples `detect` needs. */
  get requiredLength(): number {
    return this.windowSize + this.tauMax + 2;
  }

  detect(buf: Float32Array, offset = 0): PitchEstimate | null {
    const W = this.windowSize;
    const tauMax = this.tauMax;
    const tauMin = this.tauMin;
    const thr = this.threshold;
    const cmnd = this.cmnd;
    if (buf.length - offset < this.requiredLength) return null;

    // Quick energy check — silence has no pitch.
    let energy = 0;
    for (let j = 0; j < W; j++) {
      const v = buf[offset + j];
      energy += v * v;
    }
    if (energy < 1e-9 * W) return null;

    cmnd[0] = 1;
    let running = 0;
    let found = -1;
    let lastTau = tauMax;
    for (let tau = 1; tau <= tauMax + 1; tau++) {
      let sum = 0;
      const o2 = offset + tau;
      for (let j = 0; j < W; j++) {
        const diff = buf[offset + j] - buf[o2 + j];
        sum += diff * diff;
      }
      running += sum;
      cmnd[tau] = running > 0 ? (sum * tau) / running : 1;
      if (tau > tauMin && cmnd[tau - 1] < thr && cmnd[tau] >= cmnd[tau - 1]) {
        found = tau - 1;
        lastTau = tau;
        break;
      }
    }

    let tau = found;
    if (tau < 0) {
      // No dip below the threshold: fall back to the global minimum (low confidence).
      let best = Infinity;
      for (let t = tauMin; t <= tauMax; t++) {
        if (cmnd[t] < best) {
          best = cmnd[t];
          tau = t;
        }
      }
      lastTau = tauMax + 1;
      if (tau < 0) return null;
    }

    // Parabolic interpolation for sub-sample accuracy.
    let refined = tau;
    if (tau > 1 && tau + 1 <= lastTau) {
      const a = cmnd[tau - 1];
      const b = cmnd[tau];
      const c = cmnd[tau + 1];
      const denom = a - 2 * b + c;
      if (Math.abs(denom) > 1e-12) {
        const shift = (0.5 * (a - c)) / denom;
        if (Math.abs(shift) < 1) refined = tau + shift;
      }
    }
    const clarity = Math.max(0, Math.min(1, 1 - cmnd[tau]));
    return { freq: this.sampleRate / refined, clarity };
  }
}
