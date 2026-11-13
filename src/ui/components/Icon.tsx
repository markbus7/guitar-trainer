import type { SVGProps } from 'react';

/** Line icons, 24×24, stroke = currentColor. */
const PATHS = {
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14',
  tuner: 'M4 15a8 8 0 0 1 16 0M12 15l4-5M3 19h18',
  chords: 'M6 3v18M10 3v18M14 3v18M18 3v18M4 7h16M4 11h16M4 15h16',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z',
  play: 'M7 4.5v15l12-7.5-12-7.5Z',
  pause: 'M8 5v14M16 5v14',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  close: 'M6 6l12 12M18 6 6 18',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5V11Z',
  flame: 'M12 21c-4 0-7-2.8-7-6.6 0-3.1 2.2-5.1 3.6-7 .4 1.5 1.2 2.6 2.4 3.2C11 7 12.6 4.6 15 3c-.3 2.4.6 4.3 2 6 1.2 1.5 2 3.2 2 5.4C19 18.2 16 21 12 21Z',
  mic: 'M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm-6-4a6 6 0 0 0 12 0M12 17v4M9 21h6',
  micOff: 'M3 3l18 18M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V6a3 3 0 0 0-5.7-1.3M6 11a6 6 0 0 0 9.9 4.6M18 11c0 .7-.1 1.4-.4 2M12 17v4M9 21h6',
  headphones: 'M4 15v-3a8 8 0 0 1 16 0v3M4 15a2 2 0 0 1 2-2h1v7H6a2 2 0 0 1-2-2v-3Zm16 0a2 2 0 0 0-2-2h-1v7h1a2 2 0 0 0 2-2v-3Z',
  speaker: 'M4 9h4l5-4v14l-5-4H4V9Zm12.5-.5a5 5 0 0 1 0 7M19 6a9 9 0 0 1 0 12',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  refresh: 'M20 11a8 8 0 0 0-14.6-4.5M4 4v4h4m-4 5a8 8 0 0 0 14.6 4.5M20 20v-4h-4',
  ear: 'M7 9a5 5 0 0 1 10 0c0 3-3 3.5-3 6.5a2.5 2.5 0 0 1-5 0M10 9a2 2 0 0 1 4 0',
  turtle: 'M4 15c0-4 3.6-7 8-7s8 3 8 7H4Zm16 0h1.5M6 15l-1 3m12-3 1 3M9 8.5 12 15l3-6.5',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4Zm0 2H5a3 3 0 0 0 3 4m8-4h3a3 3 0 0 1-3 4m-4 3v4m-4 3h8l-1-3H9l-1 3Z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5v-5m0-3h.01',
  metronome: 'M9 3h6l4 18H5L9 3Zm3 13 5-9M7.5 14h9',
  note: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 14a2 2 0 0 1 2-2h13',
  guitar: 'M14.5 9.5 20 4m-1-1 2 2m-7.5 5.5a3.2 3.2 0 0 0-4.6-.2l-.5.6a2.4 2.4 0 0 1-1.8.8 3.4 3.4 0 0 0-2.3 5.8l1.3 1.3a3.4 3.4 0 0 0 5.8-2.3 2.4 2.4 0 0 1 .8-1.8l.6-.5a3.2 3.2 0 0 0-.2-4.6ZM9 15l.01.01',
  volume: 'M4 9h4l5-4v14l-5-4H4V9Zm12 1.5a3 3 0 0 1 0 3',
  chart: 'M4 20V10m5 10V4m5 16v-7m5 7V8',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  repeat: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3m13-3v2a4 4 0 0 1-4 4H4',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 12 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 3-4.6-4.6',
  disc: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-6.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 6.5A5.5 5.5 0 0 0 6.5 12',
  cloud: 'M7 19a5 5 0 0 1-.7-9.95A6 6 0 0 1 17.8 10 4.5 4.5 0 0 1 17.5 19H7Z',
  edit: 'M4 20h4L19.5 8.5a2.1 2.1 0 0 0-4-4L4 16v4Zm10-14 4 4',
  trash: 'M4 7h16M10 11v6m4-6v6M9 7V4h6v3M6 7l1 13h10l1-13',
  paste: 'M9 4h6v3H9V4Zm-1.5 1H5v16h14V5h-2.5M8 12h8M8 16h5',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  hand: 'M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5v-6a1.5 1.5 0 0 1 3 0V11m0-5.5a1.5 1.5 0 0 1 3 0V12m0-3.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-5-2.7L3.6 14a1.6 1.6 0 0 1 2.6-1.9L8 14',
} as const;

export type IconName = keyof typeof PATHS;

const FILLED = new Set<IconName>(['play', 'star', 'flame', 'bolt']);

export function Icon({ name, filled, ...rest }: { name: IconName; filled?: boolean } & SVGProps<SVGSVGElement>) {
  const fill = filled ?? FILLED.has(name);
  return (
    <svg
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={fill ? 1.2 : 1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
