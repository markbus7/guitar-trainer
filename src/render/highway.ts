import type { Chart, ChartNote } from '../game/chart';
import type { NoteVisual } from '../game/session';
import type { Grade } from '../game/judge';
import { noteName, stringLabel, type StringNumber } from '../music/notes';
import { FONT_BODY, FONT_DISPLAY, GRADE_COLORS, STRING_COLORS, shade, withAlpha } from '../ui/theme';

/**
 * The note highway: six string lanes in tab order (thin high e on top), notes
 * sliding from right to left into the glowing strike line. Canvas 2D, redrawn every
 * frame from the session clock; no React involved.
 */
export interface HighwayOptions {
  noteNames: boolean;
  speed: 'slow' | 'normal' | 'fast';
  reducedMotion: boolean;
}

export interface HighwayFrame {
  songTime: number;
  visuals: Map<number, NoteVisual>;
  /** Practice mode: the note the highway is waiting for. */
  waitingFor?: ChartNote;
  multiplier: number;
  /** Seconds of count-in left. */
  countIn: number;
  now: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

interface Ring {
  x: number;
  y: number;
  start: number;
  color: string;
  r: number;
}

interface Popup {
  x: number;
  y: number;
  start: number;
  text: string;
  color: string;
}

const SPEED = {
  slow: { seconds: 5, minPps: 120 },
  normal: { seconds: 3.6, minPps: 150 },
  fast: { seconds: 2.7, minPps: 195 },
};

const STRING_WIDTH: Record<StringNumber, number> = { 1: 1, 2: 1.3, 3: 1.7, 4: 2.1, 5: 2.6, 6: 3.1 };
const STRINGS: StringNumber[] = [1, 2, 3, 4, 5, 6];

export class Highway {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private top = 30;
  private bottom = 14;
  private laneH = 0;
  private strikeX = 0;
  private pps = 0;
  private r = 14;
  private sprites = new Map<string, HTMLCanvasElement>();
  private particles: Particle[] = [];
  private rings: Ring[] = [];
  private popups: Popup[] = [];
  private lastNow = 0;
  private resizeObs: ResizeObserver | null = null;
  private labels: Record<StringNumber, string>;
  private sectionNames: { time: number; name: string }[];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly chart: Chart,
    private opts: HighwayOptions,
  ) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas not supported');
    this.ctx = ctx;
    this.labels = Object.fromEntries(STRINGS.map((s) => [s, stringLabel(chart.tuning, s)])) as Record<StringNumber, string>;
    this.sectionNames = chart.sections
      .filter((s) => s.name)
      .map((s) => ({ time: s.startBeat * chart.secPerBeat, name: s.name!.toUpperCase() }));
    this.resize();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObs = new ResizeObserver(() => this.resize());
      this.resizeObs.observe(canvas);
    }
  }

  setOptions(o: Partial<HighwayOptions>) {
    this.opts = { ...this.opts, ...o };
    this.layout();
  }

  dispose() {
    this.resizeObs?.disconnect();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const w = Math.max(200, Math.round(rect.width));
    const h = Math.max(160, Math.round(rect.height));
    if (w === this.w && h === this.h && dpr === this.dpr) return;
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.layout();
  }

  private layout() {
    const { w, h } = this;
    this.top = h < 260 ? 24 : 32;
    this.bottom = 12;
    this.laneH = (h - this.top - this.bottom) / 6;
    this.strikeX = Math.round(Math.min(190, Math.max(74, w * 0.15)));
    const sp = SPEED[this.opts.speed];
    this.pps = Math.max((w - this.strikeX - 24) / sp.seconds, sp.minPps);
    this.r = Math.max(8, Math.min(this.laneH * 0.4, 18));
    this.sprites.clear();
  }

  private laneY(s: number) {
    return this.top + (s - 0.5) * this.laneH;
  }

  private x(t: number, songTime: number) {
    return this.strikeX + (t - songTime) * this.pps;
  }

  /** Pre-rendered note head with glow, per colour and shape. */
  private sprite(color: string, kind: 'round' | 'square' | 'ghost'): HTMLCanvasElement {
    const key = `${color}:${kind}`;
    const cached = this.sprites.get(key);
    if (cached) return cached;
    const r = this.r;
    const pad = Math.ceil(r * 0.9);
    const size = Math.ceil((r + pad) * 2);
    const c = document.createElement('canvas');
    c.width = Math.ceil(size * this.dpr);
    c.height = Math.ceil(size * this.dpr);
    const g = c.getContext('2d')!;
    g.scale(this.dpr, this.dpr);
    const cx = size / 2;
    // Glow
    const glow = g.createRadialGradient(cx, cx, r * 0.6, cx, cx, r + pad);
    glow.addColorStop(0, withAlpha(color, kind === 'ghost' ? 0.15 : 0.45));
    glow.addColorStop(1, withAlpha(color, 0));
    g.fillStyle = glow;
    g.fillRect(0, 0, size, size);
    // Body
    const body = g.createRadialGradient(cx - r * 0.3, cx - r * 0.35, r * 0.1, cx, cx, r);
    body.addColorStop(0, shade(color, kind === 'ghost' ? -0.2 : 0.45));
    body.addColorStop(0.7, kind === 'ghost' ? shade(color, -0.45) : color);
    body.addColorStop(1, shade(color, -0.25));
    g.fillStyle = body;
    g.beginPath();
    if (kind === 'square') roundRect(g, cx - r, cx - r * 0.86, r * 2, r * 1.72, r * 0.38);
    else g.arc(cx, cx, r, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 1.5;
    g.strokeStyle = shade(color, -0.5);
    g.stroke();
    // Highlight
    g.beginPath();
    g.ellipse(cx - r * 0.25, cx - r * 0.45, r * 0.45, r * 0.22, -0.4, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,0.28)';
    g.fill();
    this.sprites.set(key, c);
    return c;
  }

  private drawSprite(color: string, kind: 'round' | 'square' | 'ghost', x: number, y: number, scale = 1, alpha = 1) {
    const sp = this.sprite(color, kind);
    const size = sp.width / this.dpr;
    const ctx = this.ctx;
    ctx.globalAlpha = alpha;
    ctx.drawImage(sp, x - (size * scale) / 2, y - (size * scale) / 2, size * scale, size * scale);
    ctx.globalAlpha = 1;
  }

  /** Celebrate a hit (or mark a miss) at the strike line. */
  burst(note: ChartNote, grade: Grade, label?: string) {
    const now = performance.now();
    const strings = note.notes.length ? note.notes.map((n) => n.string) : STRINGS;
    const topString = Math.min(...strings);
    if (grade === 'miss') {
      this.popups.push({ x: this.strikeX + 8, y: this.laneY(topString) - this.r - 4, start: now, text: 'MISS', color: GRADE_COLORS.miss });
      return;
    }
    const count = this.opts.reducedMotion ? 0 : grade === 'perfect' ? 14 : grade === 'great' ? 10 : 6;
    for (const s of strings) {
      const y = this.laneY(s);
      const color = STRING_COLORS[s];
      this.rings.push({ x: this.strikeX, y, start: now, color: grade === 'perfect' ? GRADE_COLORS.perfect : color, r: this.r });
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 60 + Math.random() * 220;
        this.particles.push({
          x: this.strikeX,
          y,
          vx: Math.cos(a) * v * 0.7 + 40,
          vy: Math.sin(a) * v - 60,
          life: 0,
          max: 0.35 + Math.random() * 0.45,
          size: 1.5 + Math.random() * 2.5,
          color: Math.random() < 0.5 ? color : i % 2 ? '#ffb347' : '#fff3d6',
        });
      }
    }
    if (this.particles.length > 500) this.particles.splice(0, this.particles.length - 500);
    const text = label ?? (grade === 'perfect' ? 'PERFECT' : grade === 'great' ? 'GREAT' : 'GOOD');
    this.popups.push({ x: this.strikeX + 8, y: this.laneY(topString) - this.r - 4, start: now, text, color: GRADE_COLORS[grade] });
    if (this.popups.length > 8) this.popups.shift();
  }

  draw(f: HighwayFrame) {
    this.resize();
    const ctx = this.ctx;
    const { w, h } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const dt = this.lastNow ? Math.min(0.05, (f.now - this.lastNow) / 1000) : 0;
    this.lastNow = f.now;

    this.drawBackground(f);
    this.drawGrid(f.songTime);
    this.drawStrings(f);
    this.drawNotes(f);
    this.drawStrikeLine(f);
    this.drawEffects(f.now, dt);
    // Fade out what has passed.
    const fade = ctx.createLinearGradient(0, 0, this.strikeX - 24, 0);
    fade.addColorStop(0, 'rgba(12,10,15,0.92)');
    fade.addColorStop(1, 'rgba(12,10,15,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, this.strikeX - 24, h);
    this.drawLaneLabels();
    if (f.countIn > 0) this.drawCountIn(f);
    void w;
  }

  private drawBackground(f: HighwayFrame) {
    const ctx = this.ctx;
    const { w, h } = this;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#120e16');
    bg.addColorStop(1, '#0b090e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    // Warm glow behind the strike line, stronger with the multiplier.
    const heat = 0.1 + 0.05 * (f.multiplier - 1);
    const glow = ctx.createRadialGradient(this.strikeX, h / 2, 10, this.strikeX, h / 2, Math.max(w, h) * 0.55);
    glow.addColorStop(0, `rgba(255,106,43,${heat})`);
    glow.addColorStop(1, 'rgba(255,106,43,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  private drawGrid(songTime: number) {
    const ctx = this.ctx;
    const { chart } = this;
    const spb = chart.secPerBeat;
    const t0 = songTime - this.strikeX / this.pps;
    const t1 = songTime + (this.w - this.strikeX) / this.pps;
    const b0 = Math.max(0, Math.floor(t0 / spb));
    const b1 = Math.min(chart.totalBeats, Math.ceil(t1 / spb));
    ctx.font = `500 11px ${FONT_BODY}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let b = b0; b <= b1; b++) {
      const x = this.x(b * spb, songTime);
      const isBar = b % chart.beatsPerBar === 0;
      ctx.fillStyle = isBar ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.045)';
      ctx.fillRect(Math.round(x), this.top - 4, isBar ? 2 : 1, this.h - this.top - this.bottom + 8);
      if (isBar && x > this.strikeX - 10) {
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillText(String(b / chart.beatsPerBar + 1), x + 5, this.top - 12);
      }
    }
    // Section names
    ctx.font = `600 12px ${FONT_DISPLAY}`;
    for (const s of this.sectionNames) {
      const x = this.x(s.time, songTime);
      if (x < this.strikeX - 140 || x > this.w + 10) continue;
      const tw = ctx.measureText(s.name).width + 16;
      const y = this.top - 13;
      ctx.fillStyle = 'rgba(255,122,61,0.16)';
      ctx.beginPath();
      roundRect(ctx, x + 26, y - 9, tw, 18, 9);
      ctx.fill();
      ctx.fillStyle = '#ffb38a';
      ctx.fillText(s.name, x + 34, y + 0.5);
    }
  }

  private drawStrings(f: HighwayFrame) {
    const ctx = this.ctx;
    for (const s of STRINGS) {
      const y = this.laneY(s);
      const color = STRING_COLORS[s];
      const grad = ctx.createLinearGradient(this.strikeX - 30, 0, this.w, 0);
      grad.addColorStop(0, withAlpha(color, 0.7));
      grad.addColorStop(0.25, withAlpha(color, 0.32));
      grad.addColorStop(1, withAlpha(color, 0.18));
      ctx.fillStyle = grad;
      const sw = STRING_WIDTH[s];
      ctx.fillRect(this.strikeX - 30, y - sw / 2, this.w, sw);
    }
    void f;
  }

  private drawLaneLabels() {
    const ctx = this.ctx;
    const x = this.strikeX - 40;
    const rr = Math.min(11, this.laneH * 0.36);
    ctx.font = `700 ${Math.round(rr * 1.15)}px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const s of STRINGS) {
      const y = this.laneY(s);
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fillStyle = '#17131c';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = withAlpha(STRING_COLORS[s], 0.85);
      ctx.stroke();
      ctx.fillStyle = STRING_COLORS[s];
      ctx.fillText(this.labels[s], x, y + 0.5);
    }
  }

  private drawStrikeLine(f: HighwayFrame) {
    const ctx = this.ctx;
    const x = this.strikeX;
    const y0 = this.top - 8;
    const y1 = this.h - this.bottom + 6;
    const flicker = f.multiplier >= 4 && !this.opts.reducedMotion ? 0.15 * Math.sin(f.now / 60) : 0;
    const strength = 0.35 + 0.12 * f.multiplier + flicker;
    const glow = ctx.createLinearGradient(x - 26, 0, x + 26, 0);
    glow.addColorStop(0, 'rgba(255,90,30,0)');
    glow.addColorStop(0.5, `rgba(255,120,50,${strength})`);
    glow.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 26, y0, 52, y1 - y0);
    const core = ctx.createLinearGradient(0, y0, 0, y1);
    core.addColorStop(0, '#ffd166');
    core.addColorStop(0.5, '#ff7a3d');
    core.addColorStop(1, '#ff3d5a');
    ctx.fillStyle = core;
    ctx.fillRect(x - 1.5, y0, 3, y1 - y0);
    // Target rings on each string
    for (const s of STRINGS) {
      const y = this.laneY(s);
      ctx.beginPath();
      ctx.arc(x, y, this.r + 2, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = withAlpha(STRING_COLORS[s], 0.35);
      ctx.stroke();
    }
  }

  private visibleRange(songTime: number): [number, number] {
    const notes = this.chart.notes;
    const tMin = songTime - (this.strikeX + 40) / this.pps;
    const tMax = songTime + (this.w - this.strikeX + 40) / this.pps;
    // Binary search the first note that could still be visible (long tails start earlier).
    let lo = 0;
    let hi = notes.length;
    const back = tMin - 4;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (notes[mid].time < back) lo = mid + 1;
      else hi = mid;
    }
    let end = lo;
    while (end < notes.length && notes[end].time <= tMax) end++;
    return [lo, end];
  }

  private drawNotes(f: HighwayFrame) {
    const ctx = this.ctx;
    const notes = this.chart.notes;
    const [i0, i1] = this.visibleRange(f.songTime);
    const r = this.r;
    const byId = (id: number | undefined) => (id === undefined ? undefined : notes.find((n) => n.id === id));

    // Pass 1: tails, chord bars and technique lines (under the heads).
    for (let i = i1 - 1; i >= i0; i--) {
      const n = notes[i];
      const x = this.x(n.time, f.songTime);
      const vis = f.visuals.get(n.id);
      const missed = vis?.state === 'miss';
      const len = n.dur * this.pps;
      // Sustain tails only for notes meant to ring (half notes and longer).
      if (n.kind !== 'mute' && !n.pm && n.durBeats >= 2 && n.dur > 0.5) {
        for (const s of n.notes) {
          const y = this.laneY(s.string);
          const color = missed ? '#4a4450' : STRING_COLORS[s.string];
          const x0 = Math.max(x, vis && vis.state !== 'miss' ? this.strikeX : -1e9);
          const x1 = x + len - r * 0.4;
          if (x1 <= x0) continue;
          const th = r * 0.5;
          ctx.fillStyle = withAlpha(color, vis && vis.state !== 'miss' && x < this.strikeX ? 0.75 : 0.38);
          ctx.beginPath();
          roundRect(ctx, x0, y - th / 2, x1 - x0, th, th / 2);
          ctx.fill();
          if (n.bend) {
            // Bend: the tail rises toward the next string lane.
            ctx.strokeStyle = withAlpha(color, 0.9);
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            const bx = x + Math.min(len * 0.35, 60);
            ctx.moveTo(x + r * 0.9, y);
            ctx.quadraticCurveTo(bx, y, bx + 12, y - this.laneH * 0.75);
            ctx.stroke();
          }
          if (n.vibrato) {
            ctx.strokeStyle = withAlpha(color, 0.9);
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let k = 0; k < Math.min(len - r * 1.5, 160); k += 2) {
              const px = x + r * 1.3 + k;
              const py = y - r * 0.95 + Math.sin(k / 3.2) * 2.2;
              if (k === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();
          }
        }
      }
      if (n.kind === 'chord' && n.notes.length > 1) {
        const ss = n.notes.map((s) => s.string);
        const yTop = this.laneY(Math.min(...ss)) - r * 0.9;
        const yBot = this.laneY(Math.max(...ss)) + r * 0.9;
        const hitFade = vis && vis.state !== 'miss' ? Math.max(0, 1 - (f.now - vis.at) / 250) : 1;
        if (hitFade > 0) {
          ctx.globalAlpha = hitFade;
          ctx.fillStyle = missed ? 'rgba(90,80,96,0.25)' : 'rgba(255,209,102,0.12)';
          ctx.strokeStyle = missed ? 'rgba(120,110,126,0.5)' : 'rgba(255,209,102,0.55)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          roundRect(ctx, (vis && vis.state !== 'miss' ? this.strikeX : x) - r * 1.15, yTop, r * 2.3, yBot - yTop, r);
          ctx.fill();
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
      if (n.legato && n.fromId !== undefined && n.kind === 'note') {
        const from = byId(n.fromId);
        if (from && from.kind === 'note') {
          const fx = this.x(from.time, f.songTime);
          const fy = this.laneY(from.notes[0].string);
          const y = this.laneY(n.notes[0].string);
          ctx.strokeStyle = missed ? 'rgba(140,130,150,0.5)' : 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (n.legato === 'slide') {
            ctx.moveTo(fx + r, fy + (y > fy ? r * 0.4 : y < fy ? -r * 0.4 : r * 0.35));
            ctx.lineTo(x - r, y - (y > fy ? r * 0.4 : y < fy ? -r * 0.4 : r * 0.35) + (n.notes[0].fret > from.notes[0].fret ? -r * 0.5 : r * 0.5));
          } else {
            const mx = (fx + x) / 2;
            const top = Math.min(fy, y) - r * 1.6;
            ctx.moveTo(fx + r * 0.5, fy - r * 0.8);
            ctx.quadraticCurveTo(mx, top, x - r * 0.5, y - r * 0.8);
          }
          ctx.stroke();
          ctx.font = `600 ${Math.round(r * 0.8)}px ${FONT_BODY}`;
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const label = n.legato === 'hammer' ? 'h' : n.legato === 'pull' ? 'p' : n.notes[0].fret > from.notes[0].fret ? '/' : '\\';
          ctx.fillText(label, (fx + x) / 2, Math.min(fy, y) - r * 1.05);
        }
      }
    }

    // Pass 2: heads and labels.
    const pulse = 0.5 + 0.5 * Math.sin(f.now / 140);
    for (let i = i1 - 1; i >= i0; i--) {
      const n = notes[i];
      const vis = f.visuals.get(n.id);
      let x = this.x(n.time, f.songTime);
      const waiting = f.waitingFor?.id === n.id;
      if (waiting) x = Math.max(x, this.strikeX);
      if (x > this.w + r * 2 || x < -r * 3) continue;
      const hit = vis && (vis.state === 'hit' || vis.state === 'auto');
      let scale = 1;
      let alpha = 1;
      if (hit) {
        const k = (f.now - vis!.at) / 260;
        if (k >= 1) continue;
        x = this.strikeX;
        scale = 1 + 0.5 * k;
        alpha = 1 - k;
      } else if (vis?.state === 'miss') {
        alpha = 0.55;
      } else if (x < this.strikeX - r) {
        alpha = Math.max(0.15, 1 - (this.strikeX - x) / 120);
      }
      const approaching = !vis && x - this.strikeX < this.pps * 0.25 && x >= this.strikeX - 2;

      if (n.kind === 'mute') {
        this.drawMute(x, alpha, vis?.state === 'miss');
        continue;
      }
      const missed = vis?.state === 'miss';
      for (const s of n.notes) {
        const y = this.laneY(s.string);
        const color = missed ? '#5a5260' : STRING_COLORS[s.string];
        if ((approaching || waiting) && !this.opts.reducedMotion) {
          ctx.beginPath();
          ctx.arc(x, y, r * (1.25 + (waiting ? 0.25 * pulse : 0)), 0, Math.PI * 2);
          ctx.strokeStyle = withAlpha(STRING_COLORS[s.string], waiting ? 0.5 + 0.4 * pulse : 0.55);
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        this.drawSprite(color, n.pm ? 'square' : missed ? 'ghost' : 'round', x, y, scale, alpha);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = missed ? '#bdb5c4' : '#120f16';
        ctx.font = `700 ${Math.round(r * 1.12)}px ${FONT_DISPLAY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(s.fret), x, y + 1);
        if (this.opts.noteNames && n.kind === 'note') {
          ctx.font = `600 ${Math.round(r * 0.72)}px ${FONT_BODY}`;
          ctx.fillStyle = withAlpha(STRING_COLORS[s.string], 0.95);
          ctx.fillText(noteName(s.midi, { octave: false }), x + r * 1.45, y + r * 0.75);
        }
        ctx.globalAlpha = 1;
      }
      // Labels above the note
      const topY = this.laneY(Math.min(...n.notes.map((s) => s.string))) - r - 5;
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      if (n.kind === 'chord' && n.name) {
        ctx.font = `600 ${Math.round(Math.max(12, r * 0.95))}px ${FONT_DISPLAY}`;
        ctx.fillStyle = missed ? '#8b8291' : '#ffe2a8';
        ctx.fillText(n.name, x, topY - (n.notes.length > 1 ? r * 0.2 : 0));
      }
      if (n.pm) {
        ctx.font = `700 ${Math.round(r * 0.62)}px ${FONT_BODY}`;
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillText('PM', x, n.kind === 'chord' && n.name ? topY - r * 1.15 : topY);
      }
      if (n.bend && n.kind === 'note') {
        ctx.font = `700 ${Math.round(r * 0.75)}px ${FONT_BODY}`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(n.bend === 1 ? '½' : n.bend === 2 ? 'full' : `${n.bend / 2}`, x + r * 1.6, topY - 2);
      }
      if (n.accent) {
        ctx.font = `800 ${Math.round(r * 0.8)}px ${FONT_BODY}`;
        ctx.fillStyle = '#ffd166';
        ctx.fillText('>', x - r * 1.1, topY + 3);
      }
      if (n.kind === 'chord' && n.strum && n.notes.length > 2) {
        const yb = this.laneY(Math.max(...n.notes.map((s) => s.string))) + r + 3;
        ctx.textBaseline = 'top';
        ctx.font = `700 ${Math.round(r * 0.8)}px ${FONT_BODY}`;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(n.strum === 'up' ? '↑' : '↓', x, Math.min(yb, this.h - this.bottom - r * 0.6));
      }
      ctx.globalAlpha = 1;
    }
  }

  private drawMute(x: number, alpha: number, missed: boolean) {
    const ctx = this.ctx;
    const r = this.r;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = missed ? 'rgba(90,80,96,0.25)' : 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = missed ? 'rgba(120,110,126,0.5)' : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    const y0 = this.laneY(1) - r * 0.8;
    const y1 = this.laneY(6) + r * 0.8;
    ctx.beginPath();
    roundRect(ctx, x - r * 0.8, y0, r * 1.6, y1 - y0, r * 0.8);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = missed ? '#8b8291' : '#e8e2ee';
    ctx.lineWidth = 2;
    for (const s of STRINGS) {
      const y = this.laneY(s);
      const k = r * 0.38;
      ctx.beginPath();
      ctx.moveTo(x - k, y - k);
      ctx.lineTo(x + k, y + k);
      ctx.moveTo(x + k, y - k);
      ctx.lineTo(x - k, y + k);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawEffects(now: number, dt: number) {
    const ctx = this.ctx;
    // Rings
    this.rings = this.rings.filter((ring) => {
      const k = (now - ring.start) / 380;
      if (k >= 1) return false;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r * (1 + 1.6 * k), 0, Math.PI * 2);
      ctx.strokeStyle = withAlpha(ring.color.startsWith('#') ? ring.color : '#ffffff', 0.8 * (1 - k));
      ctx.lineWidth = 3 * (1 - k) + 1;
      ctx.stroke();
      return true;
    });
    // Particles
    ctx.globalCompositeOperation = 'lighter';
    this.particles = this.particles.filter((p) => {
      p.life += dt;
      if (p.life >= p.max) return false;
      p.vy += 420 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const a = 1 - p.life / p.max;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.6 + 0.4 * a), 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    // Popups
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    this.popups = this.popups.filter((p) => {
      const k = (now - p.start) / 700;
      if (k >= 1) return false;
      const y = p.y - 26 * k;
      ctx.globalAlpha = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
      ctx.font = `700 ${Math.round(Math.max(13, this.r * 0.95))}px ${FONT_DISPLAY}`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(10,8,12,0.8)';
      ctx.strokeText(p.text, p.x + 14, y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x + 14, y);
      return true;
    });
    ctx.globalAlpha = 1;
  }

  private drawCountIn(f: HighwayFrame) {
    const ctx = this.ctx;
    const spb = this.chart.secPerBeat;
    const n = Math.ceil(f.countIn / spb - 0.02);
    if (n <= 0) return;
    const phase = 1 - (f.countIn / spb - Math.floor(f.countIn / spb));
    const size = Math.min(this.h * 0.42, 150);
    ctx.globalAlpha = 0.85 * (1 - phase * 0.6);
    ctx.font = `700 ${Math.round(size * (1 + 0.12 * (1 - phase)))}px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd166';
    ctx.fillText(String(n), this.w / 2 + this.strikeX / 2, this.h / 2 + 4);
    ctx.globalAlpha = 1;
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
