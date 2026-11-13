import { FFT } from './fft';

/**
 * Chroma ("which of the 12 notes are sounding") from a block of audio, plus chord
 * template matching. This is what lets the game hear chords, not just single notes.
 */

const FMIN = 60;
const FMAX = 2600;
const ffts = new Map<number, FFT>();

function getFFT(n: number) {
  let f = ffts.get(n);
  if (!f) {
    f = new FFT(n);
    ffts.set(n, f);
  }
  return f;
}

export interface ChromaResult {
  chroma: Float32Array;
  /** Signal level of the analysed segment (dBFS). */
  energyDb: number;
}

export function computeChroma(samples: Float32Array, sampleRate: number, fftSize = 8192): ChromaResult {
  const L = Math.min(samples.length, fftSize);
  const re = new Float64Array(fftSize);
  const im = new Float64Array(fftSize);
  let energy = 0;
  for (let i = 0; i < L; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (L - 1));
    const x = samples[i];
    energy += x * x;
    re[i] = x * w;
  }
  getFFT(fftSize).transform(re, im);

  const half = fftSize / 2;
  const mag = new Float64Array(half);
  let maxMag = 0;
  const kMin = Math.max(2, Math.floor((FMIN * fftSize) / sampleRate));
  const kMax = Math.min(half - 3, Math.ceil((FMAX * fftSize) / sampleRate));
  for (let k = kMin - 2; k <= kMax + 2; k++) {
    const m = Math.hypot(re[k], im[k]);
    mag[k] = m;
    if (k >= kMin && k <= kMax && m > maxMag) maxMag = m;
  }

  const chroma = new Float32Array(12);
  if (maxMag > 0) {
    const floor = maxMag * 0.008; // about -42 dB
    for (let k = kMin; k <= kMax; k++) {
      const m = mag[k];
      if (m < floor) continue;
      if (!(m > mag[k - 1] && m >= mag[k + 1] && m >= mag[k - 2] && m >= mag[k + 2])) continue;
      // Parabolic interpolation of the peak on a log scale.
      const a = Math.log(mag[k - 1] + 1e-12);
      const b = Math.log(m + 1e-12);
      const c = Math.log(mag[k + 1] + 1e-12);
      const denom = a - 2 * b + c;
      const shift = Math.abs(denom) > 1e-12 ? (0.5 * (a - c)) / denom : 0;
      const freq = ((k + shift) * sampleRate) / fftSize;
      if (freq < FMIN || freq > FMAX) continue;
      const midi = 69 + 12 * Math.log2(freq / 440);
      const nearest = Math.round(midi);
      const dev = midi - nearest; // -0.5 .. 0.5
      const pc = ((nearest % 12) + 12) % 12;
      const w = Math.sqrt(m); // compress dynamics so one loud partial can't dominate
      const main = 1 - Math.abs(dev);
      chroma[pc] += w * main;
      const neighbour = (pc + (dev > 0 ? 1 : 11)) % 12;
      chroma[neighbour] += w * (1 - main);
    }
  }
  normalize(chroma);
  return { chroma, energyDb: 10 * Math.log10(energy / Math.max(1, L) + 1e-12) };
}

export function normalize(v: Float32Array): Float32Array {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += v[i] * v[i];
  const n = Math.sqrt(s);
  if (n > 0) for (let i = 0; i < v.length; i++) v[i] /= n;
  return v;
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < 12; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

/**
 * Expected chroma for a set of sounding MIDI notes, including the harmonics a guitar
 * string produces. Using the real voicing (with doubled notes) makes matching far
 * more reliable than a plain "three notes" template.
 */
export function chordTemplate(midis: readonly number[], harmonics = 8): Float32Array {
  const t = new Float32Array(12);
  for (const midi of midis) {
    const f0 = 440 * Math.pow(2, (midi - 69) / 12);
    for (let h = 1; h <= harmonics; h++) {
      const f = f0 * h;
      if (f > FMAX) break;
      const m = 69 + 12 * Math.log2(f / 440);
      const nearest = Math.round(m);
      const dev = m - nearest;
      const pc = ((nearest % 12) + 12) % 12;
      const w = Math.pow(h, -0.8);
      const main = 1 - Math.abs(dev);
      t[pc] += w * main;
      t[(pc + (dev > 0 ? 1 : 11)) % 12] += w * (1 - main);
    }
  }
  return normalize(t);
}

/** A generic template for a chord given only its pitch classes (root first). */
export function pitchClassTemplate(pcs: readonly number[]): Float32Array {
  // Voice it like a guitar would: root low and doubled, the rest above.
  const root = pcs[0];
  const base = 40 + ((root - 4 + 12) % 12); // E2..D#3
  const midis = [base, base + 12];
  for (const pc of pcs.slice(1)) {
    const up = base + ((pc - root + 12) % 12);
    midis.push(up + 12);
  }
  return chordTemplate(midis);
}

const ALT_CACHE: { templates: Float32Array[]; labels: string[] } = { templates: [], labels: [] };

/** Templates for every major, minor and power chord — the "other things you might be playing". */
export function alternativeTemplates(): { templates: Float32Array[]; labels: string[] } {
  if (ALT_CACHE.templates.length) return ALT_CACHE;
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  for (let r = 0; r < 12; r++) {
    ALT_CACHE.templates.push(pitchClassTemplate([r, (r + 4) % 12, (r + 7) % 12]));
    ALT_CACHE.labels.push(names[r]);
    ALT_CACHE.templates.push(pitchClassTemplate([r, (r + 3) % 12, (r + 7) % 12]));
    ALT_CACHE.labels.push(`${names[r]}m`);
    ALT_CACHE.templates.push(pitchClassTemplate([r, (r + 7) % 12]));
    ALT_CACHE.labels.push(`${names[r]}5`);
  }
  return ALT_CACHE;
}

export interface ChordMatch {
  similarity: number;
  /** Best similarity among chords that are clearly different from the expected one. */
  bestOther: number;
  bestOtherLabel: string;
  ok: boolean;
}

/**
 * Does the heard chroma look like the expected chord?
 * `leniency` 0..1 — higher accepts sloppier chords (beginner friendly).
 */
export function matchChord(
  chroma: ArrayLike<number>,
  expectedMidis: readonly number[],
  leniency = 0.6,
): ChordMatch {
  const expected = chordTemplate(expectedMidis);
  const similarity = cosine(chroma, expected);
  const expectedPcs = new Set(expectedMidis.map((m) => ((m % 12) + 12) % 12));
  const { templates, labels } = alternativeTemplates();
  let bestOther = 0;
  let bestOtherLabel = '';
  for (let i = 0; i < templates.length; i++) {
    const label = labels[i];
    // Skip alternatives that are "the same chord" for scoring purposes: chords whose
    // notes are all part of what we asked for (e.g. E5 inside E or Em), or that
    // contain everything we asked for (an E chord when E5 was asked).
    const pcs = labelPcs(label);
    const subset = pcs.every((p) => expectedPcs.has(p));
    const superset = [...expectedPcs].every((p) => pcs.includes(p));
    if (subset || superset) continue;
    const s = cosine(chroma, templates[i]);
    if (s > bestOther) {
      bestOther = s;
      bestOtherLabel = label;
    }
  }
  const minSim = 0.8 - 0.25 * leniency; // 0.65 at the default leniency
  const margin = 0.06 * leniency;
  const ok = similarity >= minSim && similarity + margin >= bestOther;
  return { similarity, bestOther, bestOtherLabel, ok };
}

function labelPcs(label: string): number[] {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const m = /^([A-G]#?)(m|5)?$/.exec(label);
  if (!m) return [];
  const r = names.indexOf(m[1]);
  if (m[2] === 'm') return [r, (r + 3) % 12, (r + 7) % 12];
  if (m[2] === '5') return [r, (r + 7) % 12];
  return [r, (r + 4) % 12, (r + 7) % 12];
}
