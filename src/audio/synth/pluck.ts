/**
 * Karplus–Strong plucked string synthesis (with a fractional-delay all-pass so notes
 * are in tune). Pure function: returns raw samples, used both for the in-game guide
 * guitar / bass and for generating test audio.
 */
export interface PluckOptions {
  sampleRate: number;
  freq: number;
  /** Seconds of audio to render. */
  duration: number;
  /** Peak amplitude 0..1. */
  velocity?: number;
  /** 0 = dark thumb pluck, 1 = bright pick attack. */
  brightness?: number;
  /** Time for the note to fall by 60 dB, in seconds. */
  decay?: number;
  /** Where along the string it is plucked (0..0.5). Shapes the harmonics. */
  pluckPosition?: number;
  /** Palm muted: short, thuddy and dark. */
  mute?: boolean;
  seed?: number;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function defaultDecay(freq: number): number {
  return Math.min(7, Math.max(1.4, 5 * Math.pow(110 / freq, 0.4)));
}

export function renderPluck(opts: PluckOptions): Float32Array {
  const sr = opts.sampleRate;
  const f = opts.freq;
  const len = Math.max(1, Math.round(opts.duration * sr));
  const out = new Float32Array(len);
  const velocity = opts.velocity ?? 0.8;
  const brightness = opts.brightness ?? 0.7;
  const mute = !!opts.mute;
  const t60 = mute ? 0.16 : opts.decay ?? defaultDecay(f);
  const rng = mulberry32(opts.seed ?? Math.floor(f * 1000));

  const total = sr / f - 0.5;
  let N = Math.floor(total);
  let frac = total - N;
  if (frac < 0.15) {
    N -= 1;
    frac += 1;
  }
  if (N < 2) return out;
  const C = (1 - frac) / (1 + frac);

  // Excitation: filtered noise with a pluck-position comb.
  const exc = new Float32Array(N);
  const a = 0.08 + 0.9 * (mute ? brightness * 0.35 : brightness);
  let lp = 0;
  for (let i = 0; i < N; i++) {
    lp += a * (rng() * 2 - 1 - lp);
    exc[i] = lp;
  }
  const pos = Math.max(1, Math.round((opts.pluckPosition ?? 0.18) * N));
  const shaped = new Float32Array(N);
  let peak = 0;
  let mean = 0;
  for (let i = 0; i < N; i++) {
    shaped[i] = exc[i] - (i >= pos ? exc[i - pos] : 0);
    mean += shaped[i];
  }
  mean /= N;
  for (let i = 0; i < N; i++) {
    shaped[i] -= mean;
    peak = Math.max(peak, Math.abs(shaped[i]));
  }
  if (peak > 0) for (let i = 0; i < N; i++) shaped[i] /= peak;

  const delay = shaped;
  const g = Math.pow(10, -3 / (t60 * f));
  const muteLp = mute ? 0.25 : 1;
  let idx = 0;
  let prev = 0;
  let apX = 0;
  let apY = 0;
  let mlp = 0;
  for (let n = 0; n < len; n++) {
    const v = delay[idx];
    const avg = 0.5 * (v + prev);
    prev = v;
    const ap = C * avg + apX - C * apY;
    apX = avg;
    apY = ap;
    let s = ap * g;
    if (mute) {
      mlp += muteLp * (s - mlp);
      s = mlp;
    }
    delay[idx] = s;
    idx++;
    if (idx === N) idx = 0;
    out[n] = v * velocity;
  }

  // Short fade-out so buffers never click when they end.
  const fade = Math.min(len, Math.round(sr * 0.02));
  for (let i = 0; i < fade; i++) out[len - 1 - i] *= i / fade;
  return out;
}
