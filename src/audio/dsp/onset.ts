/**
 * Pluck / strum onset detector.
 *
 * Works on small blocks of samples. A pick attack is a burst of high-frequency energy,
 * so we watch the energy of the first difference of the signal (a cheap high-pass) and
 * trigger when it jumps well above its level a few milliseconds earlier. A slowly
 * adapting noise floor keeps room noise and hum from triggering anything.
 */
export interface OnsetConfig {
  /** 0 (only loud, clear plucks) … 1 (very sensitive). */
  sensitivity: number;
  /** Minimum time between two onsets, in seconds. */
  refractory: number;
}

export interface OnsetHit {
  frame: number;
  strength: number;
}

const HISTORY = 8;

export class OnsetDetector {
  readonly sampleRate: number;
  readonly blockSize: number;
  private cfg: OnsetConfig;
  private hfHist = new Float64Array(HISTORY).fill(-120);
  private histPos = 0;
  private prevSample = 0;
  private lastOnsetFrame = -Infinity;
  private blocks = 0;
  /** Broadband level of the last block (dBFS). */
  levelDb = -120;
  /** Running estimate of the background noise level (dBFS). */
  noiseFloorDb = -70;

  constructor(sampleRate: number, cfg: Partial<OnsetConfig> = {}) {
    this.sampleRate = sampleRate;
    this.blockSize = sampleRate > 60000 ? 256 : 128;
    this.cfg = { sensitivity: 0.6, refractory: 0.06, ...cfg };
  }

  configure(cfg: Partial<OnsetConfig>) {
    this.cfg = { ...this.cfg, ...cfg };
  }

  get config(): OnsetConfig {
    return this.cfg;
  }

  /** Level a sound must exceed to count as playing (dBFS). */
  get gateDb(): number {
    const s = this.cfg.sensitivity;
    const relative = this.noiseFloorDb + lerp(20, 7, s);
    const absolute = lerp(-38, -68, s);
    return Math.max(relative, absolute);
  }

  /** Process one block (length === blockSize). Returns an onset if one starts in this block. */
  processBlock(block: Float32Array, startFrame: number): OnsetHit | null {
    const n = block.length;
    let e = 0;
    let h = 0;
    let prev = this.prevSample;
    for (let i = 0; i < n; i++) {
      const x = block[i];
      e += x * x;
      const d = x - prev;
      h += d * d;
      prev = x;
    }
    this.prevSample = prev;
    const eDb = 10 * Math.log10(e / n + 1e-12);
    const hDb = 10 * Math.log10(h / n + 1e-12);
    this.levelDb = eDb;

    // Noise floor: falls quickly, rises slowly.
    if (eDb < this.noiseFloorDb) this.noiseFloorDb += (eDb - this.noiseFloorDb) * 0.08;
    else this.noiseFloorDb += 0.004 * (n / 128);
    this.noiseFloorDb = Math.max(-100, Math.min(-25, this.noiseFloorDb));

    // Reference: the loudest HF energy 2..6 blocks ago (skip the previous block so a
    // pick attack that ramps over two blocks still registers).
    let ref = -120;
    for (let k = 2; k <= 6; k++) {
      const v = this.hfHist[(this.histPos - k + HISTORY * 4) % HISTORY];
      if (v > ref) ref = v;
    }
    this.hfHist[this.histPos] = hDb;
    this.histPos = (this.histPos + 1) % HISTORY;
    this.blocks++;
    if (this.blocks < 6) return null;

    const rise = hDb - ref;
    const s = this.cfg.sensitivity;
    const riseThreshold = lerp(13, 5, s);
    const refractoryFrames = this.cfg.refractory * this.sampleRate;
    if (
      rise > riseThreshold &&
      eDb > this.gateDb &&
      startFrame - this.lastOnsetFrame >= refractoryFrames
    ) {
      // Place the onset at the strongest change inside the block.
      let maxD = 0;
      let at = 0;
      let p = block[0];
      for (let i = 1; i < n; i++) {
        const d = Math.abs(block[i] - p);
        if (d > maxD) {
          maxD = d;
          at = i;
        }
        p = block[i];
      }
      const frame = startFrame + at;
      this.lastOnsetFrame = frame;
      return { frame, strength: rise };
    }
    return null;
  }

  reset() {
    this.hfHist.fill(-120);
    this.histPos = 0;
    this.prevSample = 0;
    this.lastOnsetFrame = -Infinity;
    this.blocks = 0;
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}
