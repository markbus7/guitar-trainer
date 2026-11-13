import { describe, expect, it } from 'vitest';
import { Yin } from '../src/audio/dsp/yin';
import { matchChord, computeChroma } from '../src/audio/dsp/chroma';
import { renderPluck } from '../src/audio/synth/pluck';
import { analyze, ofType, renderPerformance, strum } from './helpers/guitarist';
import { chordMidis, getChord, shapeNotes } from '../src/music/chords';

const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const cents = (f: number, ref: number) => 1200 * Math.log2(f / ref);

describe('YIN pitch detection', () => {
  for (const sr of [24000, 22050]) {
    it(`finds pure tones across the guitar range at ${sr} Hz`, () => {
      const yin = new Yin(sr, { minFreq: 60, maxFreq: 1400 });
      for (const midi of [38, 40, 45, 50, 55, 59, 64, 69, 76, 84]) {
        const f = midiToFreq(midi);
        const buf = new Float32Array(yin.requiredLength);
        for (let i = 0; i < buf.length; i++) {
          const t = i / sr;
          buf[i] = 0.5 * Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t) + 0.1 * Math.sin(6 * Math.PI * f * t);
        }
        const est = yin.detect(buf);
        expect(est, `midi ${midi}`).not.toBeNull();
        expect(Math.abs(cents(est!.freq, f)), `midi ${midi}`).toBeLessThan(3);
        expect(est!.clarity).toBeGreaterThan(0.9);
      }
    });
  }

  it('is in tune on Karplus-Strong plucks', () => {
    const sr = 24000;
    const yin = new Yin(sr);
    for (const midi of [40, 45, 50, 55, 59, 64, 71]) {
      const f = midiToFreq(midi);
      const pluck = renderPluck({ sampleRate: sr, freq: f, duration: 0.6, seed: midi });
      const est = yin.detect(pluck, Math.round(0.15 * sr));
      expect(est).not.toBeNull();
      expect(Math.abs(cents(est!.freq, f)), `midi ${midi}`).toBeLessThan(6);
    }
  });

  it('reports no confident pitch for noise', () => {
    const sr = 24000;
    const yin = new Yin(sr);
    const buf = new Float32Array(yin.requiredLength);
    let seed = 1;
    for (let i = 0; i < buf.length; i++) {
      seed = (seed * 16807) % 2147483647;
      buf[i] = (seed / 2147483647) * 2 - 1;
    }
    const est = yin.detect(buf);
    expect(est === null || est.clarity < 0.75).toBe(true);
  });
});

describe('Analyzer: onsets and notes', () => {
  for (const sr of [48000, 44100]) {
    it(`detects a riff note by note at ${sr} Hz`, () => {
      const riff = [40, 40, 43, 40, 45, 43, 40, 47, 45, 52, 50, 45];
      const notes = riff.map((midi, i) => ({ t: 0.5 + i * 0.25, midi, dur: 0.25 }));
      const audio = renderPerformance(notes, { sampleRate: sr, duration: 4 });
      // The game sets the lowest expected pitch from the tuning (standard: just under E2).
      const events = analyze(audio, sr, { minFreq: 75 });
      const onsets = ofType(events, 'onset');
      const detected = ofType(events, 'note');
      expect(onsets.length).toBe(riff.length);
      notes.forEach((n, i) => {
        expect(Math.abs(onsets[i].t - n.t), `onset ${i}`).toBeLessThan(0.012);
      });
      expect(detected.map((d) => d.midi)).toEqual(riff);
      detected.forEach((d, i) => expect(Math.abs(d.t - notes[i].t)).toBeLessThan(0.012));
    });
  }

  it('hears repeated picks on the same ringing string', () => {
    const sr = 48000;
    const notes = Array.from({ length: 8 }, (_, i) => ({ t: 0.3 + i * 0.25, midi: 45, dur: 2 }));
    const audio = renderPerformance(notes, { sampleRate: sr, duration: 3 });
    const detected = ofType(analyze(audio, sr), 'note');
    expect(detected.length).toBe(8);
    expect(detected.every((d) => d.midi === 45)).toBe(true);
  });

  it('hears fast palm-muted chugs', () => {
    const sr = 48000;
    // Sixteenth notes at 120 bpm
    const notes = Array.from({ length: 16 }, (_, i) => ({ t: 0.3 + i * 0.125, midi: 40, mute: true, velocity: 0.8 }));
    const audio = renderPerformance(notes, { sampleRate: sr, duration: 2.6 });
    const events = analyze(audio, sr);
    expect(ofType(events, 'onset').length).toBe(16);
    const detected = ofType(events, 'note');
    expect(detected.length).toBeGreaterThanOrEqual(14);
    expect(detected.every((d) => d.midi % 12 === 4)).toBe(true);
  });

  it('copes with a laptop mic that loses the low end', () => {
    const sr = 48000;
    const riff = [40, 43, 45, 47];
    const notes = riff.map((midi, i) => ({ t: 0.4 + i * 0.4, midi }));
    const audio = renderPerformance(notes, { sampleRate: sr, duration: 2.5, highpassHz: 180, noiseDb: -60 });
    const detected = ofType(analyze(audio, sr), 'note');
    expect(detected.length).toBe(4);
    // Octave mistakes are allowed (the game accepts them), wrong notes are not.
    detected.forEach((d, i) => expect(d.midi % 12).toBe(riff[i] % 12));
  });

  it('marks hammer-ons as legato notes', () => {
    const sr = 48000;
    const notes = [
      { t: 0.4, midi: 57, dur: 0.4 },
      { t: 0.65, midi: 59, dur: 0.4, legato: true },
      { t: 1.2, midi: 62, dur: 0.4 },
    ];
    const audio = renderPerformance(notes, { sampleRate: sr, duration: 2 });
    const detected = ofType(analyze(audio, sr), 'note');
    expect(detected.map((d) => d.midi)).toEqual([57, 59, 62]);
    expect(Math.abs(detected[1].t - 0.65)).toBeLessThan(0.05);
  });

  it('stays quiet when nothing is played', () => {
    const sr = 48000;
    const audio = renderPerformance([], { sampleRate: sr, duration: 2, noiseDb: -50 });
    const events = analyze(audio, sr);
    expect(ofType(events, 'onset').length).toBe(0);
    expect(ofType(events, 'note').length).toBe(0);
  });

  it('follows a bend upward in the pitch track', () => {
    const sr = 48000;
    const audio = renderPerformance([{ t: 0.3, midi: 62, bend: 2, dur: 1 }], { sampleRate: sr, duration: 1.6 });
    const pitches = ofType(analyze(audio, sr), 'pitch').filter((p) => p.freq > 0 && p.t > 0.75 && p.t < 1.1);
    expect(pitches.length).toBeGreaterThan(5);
    const top = Math.max(...pitches.map((p) => 69 + 12 * Math.log2(p.freq / 440)));
    expect(top).toBeGreaterThan(63.6);
  });
});

describe('Chord recognition', () => {
  const sr = 48000;
  const chordsToTest = ['Em', 'E', 'Am', 'A', 'D', 'G', 'C', 'Dm', 'E5', 'A5', 'G5', 'C5'];

  function chromaFor(midis: number[], seed = 3) {
    const audio = renderPerformance(strum(0.3, midis), { sampleRate: sr, duration: 1.2, seed });
    const events = analyze(audio, sr);
    const chroma = ofType(events, 'chroma');
    expect(chroma.length).toBeGreaterThanOrEqual(1);
    return chroma[0].chroma;
  }

  it('recognises the chord that was strummed', () => {
    for (const id of chordsToTest) {
      const midis = chordMidis(shapeNotes(getChord(id).frets));
      const res = matchChord(chromaFor(midis), midis);
      expect(res.ok, `${id}: sim ${res.similarity.toFixed(2)} vs ${res.bestOtherLabel} ${res.bestOther.toFixed(2)}`).toBe(true);
    }
  });

  it('rejects a different chord', () => {
    const pairs: [string, string][] = [
      ['Em', 'E'],
      ['E', 'Em'],
      ['Am', 'C'],
      ['C', 'G'],
      ['G', 'D'],
      ['D', 'A'],
      ['A', 'Am'],
      ['E5', 'A5'],
      ['G5', 'C5'],
      ['Am', 'Em'],
    ];
    for (const [played, expected] of pairs) {
      const heard = chromaFor(chordMidis(shapeNotes(getChord(played).frets)));
      const res = matchChord(heard, chordMidis(shapeNotes(getChord(expected).frets)));
      expect(res.ok, `played ${played}, expected ${expected}: sim ${res.similarity.toFixed(2)}`).toBe(false);
    }
  });

  it('computes a clean chroma for a single note', () => {
    const audio = renderPluck({ sampleRate: sr, freq: midiToFreq(57), duration: 0.4 });
    const { chroma } = computeChroma(audio.subarray(1000, 1000 + 8192), sr);
    const max = Math.max(...chroma);
    expect(chroma[9]).toBe(max); // A
  });
});
