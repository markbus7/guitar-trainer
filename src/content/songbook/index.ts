import type { Lesson } from '../types';
import { allNightDiner, campfireStories, firstLight } from './acoustic';
import { coldIronSky, crownless, heavyWater, steelHorizon } from './metal';
import { garageAnthem, lateBusHome, neonYouth, skateboardSunday, summerStatic, twoChordRiot, velocity } from './punk';
import { afterglow, brokenSpeakers, dustAndDiesel, openRoad, wildfireSeason } from './rock';

/** Original songs for Free play, easiest first. */
export const SONGBOOK: Lesson[] = [
  // Level 1: first weeks
  openRoad,
  twoChordRiot,
  firstLight,
  // Level 2
  garageAnthem,
  summerStatic,
  campfireStories,
  heavyWater,
  // Level 3
  skateboardSunday,
  lateBusHome,
  brokenSpeakers,
  dustAndDiesel,
  coldIronSky,
  // Level 4
  neonYouth,
  wildfireSeason,
  crownless,
  allNightDiner,
  // Level 5: advanced
  velocity,
  afterglow,
  steelHorizon,
];
