/**
 * A small synthesised drum kit, rendered once into sample buffers. Everything is
 * generated from oscillators and noise, so there are no audio files to download.
 */
import { biquad, filter, metallic, noise, normalize } from './offline';

export type DrumId =
  | 'kick'
  | 'snare'
  | 'hat'
  | 'hatOpen'
  | 'ride'
  | 'crash'
  | 'tomHi'
  | 'tomLo'
  | 'click'
  | 'clickAccent';

export const DRUM_IDS: DrumId[] = ['kick', 'snare', 'hat', 'hatOpen', 'ride', 'crash', 'tomHi', 'tomLo', 'click', 'clickAccent'];

const exp = (t: number, tau: number) => Math.exp(-t / tau);

function kick(sr: number) {
  const len = Math.round(sr * 0.5);
  const out = new Float32Array(len);
  let phase = 0;
  const click = filter(noise(Math.round(sr * 0.004), 5), biquad('highpass', 1500, 0.7, sr));
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const f = 46 + 120 * exp(t, 0.03);
    phase += (2 * Math.PI * f) / sr;
    const body = Math.sin(phase) * exp(t, 0.17);
    const c = i < click.length ? click[i] * 0.5 * (1 - i / click.length) : 0;
    out[i] = Math.tanh(1.6 * (body + c));
  }
  return normalize(out, 0.95);
}

function snare(sr: number) {
  const len = Math.round(sr * 0.32);
  const n = filter(filter(noise(len, 9), biquad('highpass', 1100, 0.7, sr)), biquad('lowpass', 9000, 0.7, sr));
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const tone = (Math.sin(2 * Math.PI * 185 * t) * 0.7 + Math.sin(2 * Math.PI * 330 * t) * 0.3) * exp(t, 0.05);
    out[i] = tone * 0.55 + n[i] * exp(t, 0.09) * 0.9;
  }
  return normalize(out, 0.85);
}

function cymbal(sr: number, seconds: number, tau: number, hp: number, seed: number, metal = 0.6) {
  const len = Math.round(sr * seconds);
  const m = metallic(len, sr, 1 + seed * 0.01);
  const n = noise(len, seed);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = m[i] * metal + n[i] * (1 - metal);
  filter(out, biquad('highpass', hp, 0.7, sr));
  filter(out, biquad('highpass', hp, 0.7, sr));
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const attack = i < sr * 0.002 ? i / (sr * 0.002) : 1;
    out[i] *= exp(t, tau) * attack;
  }
  return normalize(out, 0.7);
}

function ride(sr: number) {
  const len = Math.round(sr * 1.4);
  const out = cymbal(sr, 1.4, 0.45, 3000, 21, 0.75);
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    out[i] += Math.sin(2 * Math.PI * 3380 * t) * 0.18 * exp(t, 0.3);
  }
  return normalize(out, 0.6);
}

function tom(sr: number, hi: number, lo: number) {
  const len = Math.round(sr * 0.6);
  const out = new Float32Array(len);
  const n = filter(noise(len, Math.round(hi)), biquad('bandpass', hi * 4, 1, sr));
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const f = lo + (hi - lo) * exp(t, 0.08);
    phase += (2 * Math.PI * f) / sr;
    out[i] = Math.sin(phase) * exp(t, 0.22) + n[i] * 0.25 * exp(t, 0.03);
  }
  return normalize(out, 0.85);
}

function click(sr: number, freq: number) {
  const len = Math.round(sr * 0.06);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    out[i] = (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * freq * 2.7 * t)) * exp(t, 0.01);
  }
  return normalize(out, 0.8);
}

export function renderDrumKit(sampleRate: number): Record<DrumId, Float32Array> {
  return {
    kick: kick(sampleRate),
    snare: snare(sampleRate),
    hat: cymbal(sampleRate, 0.12, 0.018, 7000, 3),
    hatOpen: cymbal(sampleRate, 0.5, 0.13, 6500, 4),
    ride: ride(sampleRate),
    crash: cymbal(sampleRate, 2.4, 0.65, 4200, 8, 0.45),
    tomHi: tom(sampleRate, 150, 112),
    tomLo: tom(sampleRate, 102, 74),
    click: click(sampleRate, 1650),
    clickAccent: click(sampleRate, 2400),
  };
}

/** Mix level of each piece in the kit. */
export const DRUM_LEVEL: Record<DrumId, number> = {
  kick: 1,
  snare: 0.8,
  hat: 0.32,
  hatOpen: 0.3,
  ride: 0.28,
  crash: 0.42,
  tomHi: 0.75,
  tomLo: 0.8,
  click: 0.55,
  clickAccent: 0.65,
};
