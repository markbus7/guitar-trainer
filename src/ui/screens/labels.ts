import type { LessonKind, ToneId } from '../../content/types';
import type { IconName } from '../components/Icon';

export const KIND_LABEL: Record<LessonKind, string> = {
  learn: 'Walkthrough',
  exercise: 'Exercise',
  riff: 'Riff',
  song: 'Gig',
  drill: 'Drill',
};

export const KIND_ICON: Record<LessonKind, IconName> = {
  learn: 'book',
  exercise: 'metronome',
  riff: 'guitar',
  song: 'flame',
  drill: 'repeat',
};

export const TONE_LABEL: Record<ToneId, string> = {
  acoustic: 'Acoustic',
  clean: 'Clean amp',
  crunch: 'Crunch',
  punk: 'Punk drive',
  lead: 'Lead',
  metal: 'High gain',
};
