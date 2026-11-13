import type { Genre, Level } from './types';

export interface GenreInfo {
  label: string;
  color: string;
}

/** Display names and colours for the Free play filters and song covers. */
export const GENRES: Record<Genre, GenreInfo> = {
  'pop-punk': { label: 'Pop-punk', color: '#ff5fa2' },
  punk: { label: 'Punk', color: '#ff3d5a' },
  rock: { label: 'Rock', color: '#ff8a3d' },
  metal: { label: 'Metal', color: '#b388ff' },
  acoustic: { label: 'Acoustic', color: '#4be3a4' },
  blues: { label: 'Blues', color: '#5cc8ff' },
};

export const GENRE_ORDER: Genre[] = ['pop-punk', 'punk', 'rock', 'metal', 'acoustic', 'blues'];

export const LEVEL_LABEL: Record<Level, string> = {
  1: 'Starter',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Expert',
};
