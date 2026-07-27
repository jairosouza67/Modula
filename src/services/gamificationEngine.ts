import { WORKOUT_TYPES } from "../data/mockData";

export const getXpPreview = (duration: number = 30, intensity: number = 5): number => {
  return Math.floor((duration * intensity) / 5);
};

export const getAttributeGainsPreview = (workoutType: string): string => {
  switch (workoutType) {
    case "Musculação":
      return "+2 STR, +5 Max HP";
    case "Corrida":
    case "Ciclismo":
      return "+2 SPD, +1 END, +5 STM";
    case "Funcional":
    case "Crossfit":
      return "+2 END, +1 DISC, +5 STM";
    case "Yoga":
    case "Artes Marciais":
      return "+2 DISC, +5 STM";
    case "Natação":
      return "+2 END, +1 SPD";
    default:
      return "";
  }
};

export const getLevelThreshold = (level: number): number => {
  // XP req = 25 * (L^2)  (ex: Lv2=100, Lv5=625, Lv10=2500, Lv20=10000, Lv50=62500)
  return 25 * Math.pow(level, 2);
};

export const calculateStreakBonusMultiplier = (streakDays: number): number => {
  if (streakDays >= 30) return 1.25;
  if (streakDays >= 7) return 1.1;
  return 1.0;
};
