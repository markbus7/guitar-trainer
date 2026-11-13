/** Streaming 2:1 decimator with a windowed-sinc low-pass FIR. */
export class Decimator {
  private readonly taps: Float64Array;
  private readonly hist: Float64Array;
  private pos = 0;
  private phase = 0;
  private static readonly SIZE = 64;

  constructor(numTaps = 31, cutoff = 0.22) {
    const taps = new Float64Array(numTaps);
    const M = numTaps - 1;
    let sum = 0;
    for (let n = 0; n < numTaps; n++) {
      const x = n - M / 2;
      const sinc = x === 0 ? 2 * cutoff : Math.sin(2 * Math.PI * cutoff * x) / (Math.PI * x);
      const w = 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / M);
      taps[n] = sinc * w;
      sum += taps[n];
    }
    for (let n = 0; n < numTaps; n++) taps[n] /= sum;
    this.taps = taps;
    this.hist = new Float64Array(Decimator.SIZE);
  }

  /** Push one input sample. Returns an output sample every second call, otherwise NaN. */
  push(x: number): number {
    const mask = Decimator.SIZE - 1;
    this.hist[this.pos] = x;
    this.pos = (this.pos + 1) & mask;
    this.phase ^= 1;
    if (this.phase === 1) return NaN;
    const taps = this.taps;
    let acc = 0;
    let idx = (this.pos - 1 + Decimator.SIZE) & mask;
    for (let k = 0; k < taps.length; k++) {
      acc += taps[k] * this.hist[idx];
      idx = (idx - 1 + Decimator.SIZE) & mask;
    }
    return acc;
  }

  /** Group delay of the filter, in input samples. */
  get delay(): number {
    return (this.taps.length - 1) / 2;
  }
}
