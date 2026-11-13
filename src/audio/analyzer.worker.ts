/// <reference lib="webworker" />
import { Analyzer, type AnalyzerConfig, type AnalyzerEvent } from './dsp/analyzer';

/**
 * Runs the listening engine off the main thread. Audio arrives from the capture
 * worklet through a MessagePort (or as plain messages from the fallback path),
 * and batches of events go back to the page.
 */
declare const self: DedicatedWorkerGlobalScope;

type InMsg =
  | { type: 'init'; sampleRate: number; config: Partial<AnalyzerConfig> }
  | { type: 'configure'; config: Partial<AnalyzerConfig> }
  | { type: 'port'; port: MessagePort }
  | { type: 'samples'; data: Float32Array; frame: number }
  | { type: 'reset' };

let analyzer: Analyzer | null = null;
let pending: AnalyzerEvent[] = [];
let flushScheduled = false;

function flush() {
  flushScheduled = false;
  if (!pending.length) return;
  self.postMessage({ type: 'events', events: pending });
  pending = [];
}

function process(data: Float32Array, frame: number) {
  if (!analyzer) return;
  const events = analyzer.process(data, frame);
  if (events.length) {
    for (const e of events) pending.push(e);
    // Send note / onset / chroma events immediately, batch the frequent meters.
    if (events.some((e) => e.type === 'note' || e.type === 'onset' || e.type === 'chroma')) flush();
    else if (!flushScheduled) {
      flushScheduled = true;
      setTimeout(flush, 16);
    }
  }
}

self.onmessage = (ev: MessageEvent<InMsg>) => {
  const msg = ev.data;
  switch (msg.type) {
    case 'init':
      analyzer = new Analyzer({ sampleRate: msg.sampleRate, ...msg.config });
      break;
    case 'configure':
      analyzer?.configure(msg.config);
      break;
    case 'port':
      msg.port.onmessage = (e: MessageEvent<{ data: Float32Array; frame: number }>) => process(e.data.data, e.data.frame);
      break;
    case 'samples':
      process(msg.data, msg.frame);
      break;
    case 'reset':
      analyzer?.reset();
      break;
  }
};
