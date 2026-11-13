import { getEngine } from './engine';
import { Analyzer, type AnalyzerConfig, type AnalyzerEvent } from './dsp/analyzer';

/**
 * Microphone capture: getUserMedia → AudioWorklet (sample-accurate frame numbers) →
 * MessagePort → analyzer Web Worker → events back on the main thread.
 *
 * Falls back to a ScriptProcessor and/or main-thread analysis on old browsers.
 */
export type MicStatus = 'idle' | 'requesting' | 'running' | 'denied' | 'unavailable' | 'error';

type Handler = (events: AnalyzerEvent[]) => void;

const CAPTURE_WORKLET = `
class FretforgeCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.size = 512;
    this.buf = new Float32Array(this.size);
    this.fill = 0;
    this.start = 0;
    this.out = null;
    this.port.onmessage = (e) => { if (e.data && e.data.port) this.out = e.data.port; };
  }
  process(inputs) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const a = input[0];
      const b = input.length > 1 ? input[1] : null;
      for (let i = 0; i < a.length; i++) {
        if (this.fill === 0) this.start = currentFrame + i;
        this.buf[this.fill++] = b ? 0.5 * (a[i] + b[i]) : a[i];
        if (this.fill === this.size) {
          const target = this.out || this.port;
          target.postMessage({ data: this.buf, frame: this.start }, [this.buf.buffer]);
          this.buf = new Float32Array(this.size);
          this.fill = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('fretforge-capture', FretforgeCapture);
`;

const workletLoaded = new WeakSet<BaseAudioContext>();

export class Mic {
  status: MicStatus = 'idle';
  error = '';
  deviceLabel = '';
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private node: AudioWorkletNode | ScriptProcessorNode | null = null;
  private sink: GainNode | null = null;
  private worker: Worker | null = null;
  private local: Analyzer | null = null;
  private handlers = new Set<Handler>();
  private statusHandlers = new Set<() => void>();
  private config: Partial<AnalyzerConfig> = {};
  private starting: Promise<boolean> | null = null;
  private currentDevice: string | undefined;

  static supported() {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  }

  on(fn: Handler) {
    this.handlers.add(fn);
    return () => {
      this.handlers.delete(fn);
    };
  }

  onStatus(fn: () => void) {
    this.statusHandlers.add(fn);
    return () => {
      this.statusHandlers.delete(fn);
    };
  }

  private setStatus(s: MicStatus, error = '') {
    this.status = s;
    this.error = error;
    this.statusHandlers.forEach((h) => h());
  }

  private emit(events: AnalyzerEvent[]) {
    this.handlers.forEach((h) => h(events));
  }

  get running() {
    return this.status === 'running';
  }

  /** The live input, e.g. to hear yourself through an amp. */
  get input(): MediaStreamAudioSourceNode | null {
    return this.source;
  }

  /** Input latency reported by the browser (seconds), if any. */
  inputLatency(): number {
    const track = this.stream?.getAudioTracks()[0];
    const s = track?.getSettings() as MediaTrackSettings & { latency?: number };
    return typeof s?.latency === 'number' && s.latency > 0 && s.latency < 0.2 ? s.latency : 0.012;
  }

  configure(cfg: Partial<AnalyzerConfig>) {
    this.config = { ...this.config, ...cfg };
    this.worker?.postMessage({ type: 'configure', config: cfg });
    this.local?.configure(cfg);
  }

  reset() {
    this.worker?.postMessage({ type: 'reset' });
    this.local?.reset();
  }

  async start(deviceId?: string): Promise<boolean> {
    if (this.running && deviceId === this.currentDevice) return true;
    if (this.starting) return this.starting;
    this.starting = this.doStart(deviceId).finally(() => {
      this.starting = null;
    });
    return this.starting;
  }

  private async doStart(deviceId?: string): Promise<boolean> {
    if (!Mic.supported()) {
      this.setStatus('unavailable', window.isSecureContext ? 'This browser cannot use a microphone.' : 'The microphone only works on a secure (https) page.');
      return false;
    }
    this.stop(false);
    this.setStatus('requesting');
    const engine = getEngine();
    await engine.resume();
    const base: MediaTrackConstraints = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    };
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { ...base, deviceId: { exact: deviceId } } : base,
      });
    } catch (err) {
      const e = err as DOMException;
      if (deviceId && (e.name === 'OverconstrainedError' || e.name === 'NotFoundError')) {
        // The saved device is gone: use the default one.
        return this.doStart(undefined);
      }
      if (e.name === 'NotAllowedError' || e.name === 'SecurityError') this.setStatus('denied', 'Microphone access was blocked.');
      else if (e.name === 'NotFoundError') this.setStatus('unavailable', 'No microphone was found.');
      else this.setStatus('error', e.message || 'Could not open the microphone.');
      return false;
    }
    this.stream = stream;
    this.currentDevice = deviceId;
    const track = stream.getAudioTracks()[0];
    this.deviceLabel = track?.label ?? '';
    track?.addEventListener('ended', () => {
      if (this.stream === stream) this.setStatus('error', 'The microphone was disconnected.');
    });

    const ctx = engine.ctx;
    this.source = ctx.createMediaStreamSource(stream);
    this.sink = ctx.createGain();
    this.sink.gain.value = 0;
    this.sink.connect(ctx.destination);

    this.startWorker(ctx.sampleRate);

    if (ctx.audioWorklet && typeof AudioWorkletNode !== 'undefined') {
      try {
        if (!workletLoaded.has(ctx)) {
          const url = URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: 'application/javascript' }));
          await ctx.audioWorklet.addModule(url);
          URL.revokeObjectURL(url);
          workletLoaded.add(ctx);
        }
        const node = new AudioWorkletNode(ctx, 'fretforge-capture', {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [1],
        });
        if (this.worker) {
          const ch = new MessageChannel();
          node.port.postMessage({ port: ch.port1 }, [ch.port1]);
          this.worker.postMessage({ type: 'port', port: ch.port2 }, [ch.port2]);
        } else {
          node.port.onmessage = (e: MessageEvent<{ data: Float32Array; frame: number }>) => this.feedLocal(e.data.data, e.data.frame);
        }
        this.node = node;
      } catch {
        this.node = null;
      }
    }
    if (!this.node) {
      // Legacy path.
      const size = 1024;
      const sp = ctx.createScriptProcessor(size, 1, 1);
      sp.onaudioprocess = (e) => {
        const data = new Float32Array(e.inputBuffer.getChannelData(0));
        const frame = Math.round(e.playbackTime * ctx.sampleRate) - 2 * size;
        if (this.worker) this.worker.postMessage({ type: 'samples', data, frame }, [data.buffer]);
        else this.feedLocal(data, frame);
      };
      this.node = sp;
    }
    this.source.connect(this.node);
    this.node.connect(this.sink);
    this.setStatus('running');
    return true;
  }

  private startWorker(sampleRate: number) {
    try {
      const w = new Worker(new URL('./analyzer.worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (e: MessageEvent<{ type: 'events'; events: AnalyzerEvent[] }>) => {
        if (e.data.type === 'events') this.emit(e.data.events);
      };
      w.onerror = () => {
        // Module workers unsupported: analyse on the main thread instead.
        if (this.worker !== w) return;
        this.worker = null;
        this.local = new Analyzer({ sampleRate, ...this.config });
        if (typeof AudioWorkletNode !== 'undefined' && this.node instanceof AudioWorkletNode) {
          const ch = new MessageChannel();
          ch.port2.onmessage = (e: MessageEvent<{ data: Float32Array; frame: number }>) => this.feedLocal(e.data.data, e.data.frame);
          this.node.port.postMessage({ port: ch.port1 }, [ch.port1]);
        }
      };
      w.postMessage({ type: 'init', sampleRate, config: this.config });
      this.worker = w;
    } catch {
      this.worker = null;
      this.local = new Analyzer({ sampleRate, ...this.config });
    }
  }

  private feedLocal(data: Float32Array, frame: number) {
    if (!this.local) return;
    const events = this.local.process(data, frame);
    if (events.length) this.emit(events);
  }

  stop(notify = true) {
    try {
      this.source?.disconnect();
      this.node?.disconnect();
      this.sink?.disconnect();
    } catch {
      /* ignore */
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.worker?.terminate();
    this.stream = null;
    this.source = null;
    this.node = null;
    this.sink = null;
    this.worker = null;
    this.local = null;
    if (notify) this.setStatus('idle');
  }

  async devices(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const all = await navigator.mediaDevices.enumerateDevices();
    return all.filter((d) => d.kind === 'audioinput');
  }
}

export const mic = new Mic();
