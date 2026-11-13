import { FFT } from './fft';

/**
 * "What did that pluck add?" Compares the spectrum just after an onset with the
 * spectrum just before it. Partials that grew belong to the newly plucked note, while
 * strings that were already ringing mostly cancel out. A harmonic sum over that
 * difference ranks candidate notes.
 *
 * This keeps single-note detection reliable when previous notes are still ringing,
 * which happens all the time when beginners play riffs across strings.
 */
export interface AttackCandidate {
  midi: number;
  /** Relative strength, the best candidate is 1. */
  score: number;
}

export interface AttackResult {
  candidates: AttackCandidate[];
  /** Level of what was newly added (dB, relative to full scale). */
  addedDb: number;
  /** Share of the post-pluck spectrum energy that is new (0..1). */
  newFraction: number;
}

const ffts = new Map<number, FFT>();
function getFFT(n: number) {
  let f = ffts.get(n);
  if (!f) {
    f = new FFT(n);
    ffts.set(n, f);
  }
  return f;
}

function spectrum(x: Float32Array, n: number): Float64Array {
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  const L = Math.min(x.length, n);
  let wsum = 0;
  for (let i = 0; i < L; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (L - 1));
    re[i] = x[i] * w;
    wsum += w;
  }
  getFFT(n).transform(re, im);
  const mag = new Float64Array(n / 2);
  const norm = wsum > 0 ? 2 / wsum : 0;
  for (let k = 0; k < n / 2; k++) mag[k] = Math.hypot(re[k], im[k]) * norm;
  return mag;
}

const MAX_HARMONICS = 30;
const MAX_FREQ = 4200;
const WEIGHTS = Array.from({ length: MAX_HARMONICS }, (_, i) => Math.pow(i + 1, -0.6));

export function analyzeAttack(
  pre: Float32Array,
  post: Float32Array,
  sampleRate: number,
  opts: { minMidi?: number; maxMidi?: number; fftSize?: number; top?: number } = {},
): AttackResult {
  const n = opts.fftSize ?? (sampleRate > 60000 ? 16384 : 8192);
  const minMidi = opts.minMidi ?? 36;
  const maxMidi = opts.maxMidi ?? 88;
  const post0 = spectrum(post, n);
  const pre0 = pre.length > 256 ? spectrum(pre, n) : new Float64Array(n / 2);
  const half = n / 2;
  const diff = new Float64Array(half);
  let addedPow = 0;
  let postPow = 0;
  for (let k = 0; k < half; k++) {
    // A ringing string decays, so its "before" level over-estimates it — good.
    const d = post0[k] - pre0[k] * 1.05;
    diff[k] = d > 0 ? d : 0;
    addedPow += diff[k] * diff[k];
    postPow += post0[k] * post0[k];
  }
  const binHz = sampleRate / n;

  /** Strongest added energy near frequency f (within tol Hz). */
  const peakNear = (f: number, tol: number) => {
    const k0 = Math.max(1, Math.floor((f - tol) / binHz));
    const k1 = Math.min(half - 1, Math.ceil((f + tol) / binHz));
    let best = 0;
    for (let k = k0; k <= k1; k++) {
      const dist = Math.abs(k * binHz - f) / tol;
      const v = diff[k] * (dist < 1 ? 1 - 0.5 * dist : 0.5);
      if (v > best) best = v;
    }
    return best;
  };

  // Harmonic sum with an inter-harmonic penalty: a real fundamental has partials at
  // every multiple and nothing half-way between them. Candidates an octave (or a
  // twelfth…) too high find the true note's partials sitting between their own.
  const scores: AttackCandidate[] = [];
  for (let m = minMidi; m <= maxMidi; m++) {
    const f0 = 440 * Math.pow(2, (m - 69) / 12);
    let s = 0;
    for (let h = 1; h <= MAX_HARMONICS; h++) {
      const f = f0 * h;
      if (f > MAX_FREQ || f > sampleRate / 2 - 100) break;
      const tol = Math.min(Math.max(binHz * 1.01, f * 0.022), f0 * 0.22);
      const on = peakNear(f, tol);
      const between = peakNear(f - f0 / 2, tol);
      s += WEIGHTS[h - 1] * (on - 0.6 * between);
    }
    scores.push({ midi: m, score: Math.max(0, s) });
  }
  const max = scores.reduce((a, c) => Math.max(a, c.score), 0);
  if (max > 0) for (const c of scores) c.score /= max;
  // Keep local maxima only, strongest first.
  const peaks = scores.filter((c, i) => {
    const prev = scores[i - 1]?.score ?? 0;
    const next = scores[i + 1]?.score ?? 0;
    return c.score >= prev && c.score >= next && c.score > 0.2;
  });
  peaks.sort((a, b) => b.score - a.score);
  return {
    candidates: peaks.slice(0, opts.top ?? 6),
    addedDb: 10 * Math.log10(addedPow + 1e-14),
    newFraction: postPow > 0 ? addedPow / postPow : 0,
  };
}
