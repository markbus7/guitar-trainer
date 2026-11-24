import type { Lesson } from '../types';
import { flatTireSummer, grinder, homeworkCanWait, kitchenTable, lastTrainOut, lowStringThunder, porchLightBoogie, rustAndChrome, threeChordAlarm } from './garage-sessions';
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
  threeChordAlarm,
  lowStringThunder,
  // Level 2
  garageAnthem,
  summerStatic,
  campfireStories,
  heavyWater,
  homeworkCanWait,
  rustAndChrome,
  porchLightBoogie,
  kitchenTable,
  // Level 3
  skateboardSunday,
  lateBusHome,
  brokenSpeakers,
  dustAndDiesel,
  coldIronSky,
  lastTrainOut,
  grinder,
  flatTireSummer,
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
