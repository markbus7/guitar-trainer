/**
 * Tiny offline DSP toolkit for synthesising sample buffers (drums, clicks, reverb
 * impulse responses) in plain JavaScript, without an OfflineAudioContext.
 */
import { mulberry32 } from './pluck';

export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'peaking';

interface Coeffs {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

/** RBJ cookbook biquad coefficients. */
export function biquad(type: FilterType, freq: number, q: number, sampleRate: number, gainDb = 0): Coeffs {
  const w0 = (2 * Math.PI * Math.min(freq, sampleRate * 0.45)) / sampleRate;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number;
  switch (type) {
    case 'lowpass':
      b0 = (1 - cos) / 2;
      b1 = 1 - cos;
      b2 = (1 - cos) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;
    case 'highpass':
      b0 = (1 + cos) / 2;
      b1 = -(1 + cos);
      b2 = (1 + cos) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;
    case 'bandpass':
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
      break;
    case 'peaking': {
      const A = Math.pow(10, gainDb / 40);
      b0 = 1 + alpha * A;
      b1 = -2 * cos;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * cos;
      a2 = 1 - alpha / A;
      break;
    }
  }
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

/** Filter a buffer in place. */
export function filter(buf: Float32Array, c: Coeffs): Float32Array {
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i];
    const y = c.b0 * x + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    buf[i] = y;
  }
  return buf;
}

export function noise(len: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = rng() * 2 - 1;
  return out;
}

/** Bank of detuned square waves, the classic recipe for synthetic cymbals. */
export function metallic(len: number, sampleRate: number, base = 1): Float32Array {
  const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];
  const f0 = 40 * base;
  const out = new Float32Array(len);
  for (const r of ratios) {
    const f = f0 * r * 4.1;
    const period = sampleRate / f;
    for (let i = 0; i < len; i++) out[i] += (i % period) < period / 2 ? 1 : -1;
  }
  for (let i = 0; i < len; i++) out[i] /= ratios.length;
  return out;
}

export function normalize(buf: Float32Array, peak = 0.9): Float32Array {
  let max = 0;
  for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
  if (max > 0) {
    const g = peak / max;
    for (let i = 0; i < buf.length; i++) buf[i] *= g;
  }
  return buf;
}

/** Stereo reverb impulse response: exponentially decaying, slowly darkening noise. */
export function reverbImpulse(sampleRate: number, seconds = 1.8, decay = 3): [Float32Array, Float32Array] {
  const len = Math.round(sampleRate * seconds);
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < 2; ch++) {
    const n = noise(len, 77 + ch * 13);
    // Darken the tail: a one-pole lowpass whose cutoff falls over time.
    let y = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const k = 0.65 - 0.55 * t;
      y += k * (n[i] - y);
      const env = Math.pow(1 - t, decay) * (i < sampleRate * 0.004 ? i / (sampleRate * 0.004) : 1);
      n[i] = y * env;
    }
    channels.push(normalize(n, 0.6));
  }
  return [channels[0], channels[1]];
}
