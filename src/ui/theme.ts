import type { StringNumber } from '../music/notes';

/** Colour of each string, used on the highway, fretboards and chord charts. */
export const STRING_COLORS: Record<StringNumber, string> = {
  1: '#c58bff',
  2: '#5cc8ff',
  3: '#4be3a4',
  4: '#ffd34d',
  5: '#ff9640',
  6: '#ff4d4d',
};

export const GRADE_COLORS = {
  perfect: '#ffd166',
  great: '#4be3a4',
  good: '#9ad1ff',
  miss: '#ff5c7a',
} as const;

export const FONT_DISPLAY = '"Oswald Variable", Oswald, "Arial Narrow", sans-serif';
export const FONT_BODY = '"Inter Variable", Inter, system-ui, sans-serif';

/** Mix a #rrggbb colour with white (amount > 0) or black (amount < 0). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const t = amount < 0 ? 0 : 255;
  const a = Math.abs(amount);
  r = Math.round(r + (t - r) * a);
  g = Math.round(g + (t - g) * a);
  b = Math.round(b + (t - b) * a);
  return `rgb(${r},${g},${b})`;
}

export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
