import type { ToneId } from '../content/types';
import { getEngine, hasEngine } from './engine';
import { mic } from './mic';
import { ToneChain } from './synth/amp';

/**
 * "Hear yourself": routes the microphone / instrument input through an amp
 * simulation to the headphones, so a semi-acoustic can sound like a stack.
 */
let chain: ToneChain | null = null;
let current: { tone: ToneId; source: MediaStreamAudioSourceNode } | null = null;
let level: GainNode | null = null;

export function syncMonitor(opts: { enabled: boolean; tone: ToneId; level: number; headphones: boolean }) {
  const want = opts.enabled && opts.headphones && mic.running && !!mic.input;
  if (!want) {
    teardown();
    return;
  }
  if (!hasEngine()) return;
  const engine = getEngine();
  const source = mic.input!;
  if (!current || current.tone !== opts.tone || current.source !== source) {
    teardown();
    level = engine.ctx.createGain();
    level.connect(engine.monitor);
    chain = new ToneChain(engine.ctx, opts.tone, level, engine.reverb);
    source.connect(chain.input);
    current = { tone: opts.tone, source };
  }
  level!.gain.setTargetAtTime(opts.level, engine.ctx.currentTime, 0.03);
}

function teardown() {
  if (current && chain) {
    try {
      current.source.disconnect(chain.input);
    } catch {
      /* already gone */
    }
  }
  chain?.dispose();
  level?.disconnect();
  chain = null;
  level = null;
  current = null;
}
