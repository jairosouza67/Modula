import { describe, it, expect } from "vitest";
import { 
  getXpPreview, 
  getLevelThreshold, 
  calculateStreakBonusMultiplier,
  getAttributeGainsPreview 
} from "../gamificationEngine";

describe("gamificationEngine", () => {
  describe("getXpPreview", () => {
    it("should calculate XP correctly based on duration and intensity", () => {
      // XP = (duration * intensity) / 5
      expect(getXpPreview(45, 8)).toBe(72);
      expect(getXpPreview(30, 5)).toBe(30);
      expect(getXpPreview(60, 10)).toBe(120);
    });

    it("should handle default values", () => {
      expect(getXpPreview()).toBe(30); // (30 * 5) / 5
    });

    it("should floor the result", () => {
      expect(getXpPreview(45, 7)).toBe(63); // (45 * 7) / 5 = 63
      expect(getXpPreview(12, 1)).toBe(2);  // (12 * 1) / 5 = 2.4 -> 2
    });
  });

  describe("getLevelThreshold", () => {
    it("should follow the quadratic curve (25 * L^2)", () => {
      expect(getLevelThreshold(1)).toBe(25);
      expect(getLevelThreshold(2)).toBe(100);
      expect(getLevelThreshold(5)).toBe(625);
      expect(getLevelThreshold(10)).toBe(2500);
      expect(getLevelThreshold(20)).toBe(10000);
    });
  });

  describe("calculateStreakBonusMultiplier", () => {
    it("should return 1.25 for 30+ days", () => {
      expect(calculateStreakBonusMultiplier(30)).toBe(1.25);
      expect(calculateStreakBonusMultiplier(45)).toBe(1.25);
    });

    it("should return 1.1 for 7-29 days", () => {
      expect(calculateStreakBonusMultiplier(7)).toBe(1.1);
      expect(calculateStreakBonusMultiplier(29)).toBe(1.1);
    });

    it("should return 1.0 for less than 7 days", () => {
      expect(calculateStreakBonusMultiplier(0)).toBe(1.0);
      expect(calculateStreakBonusMultiplier(6)).toBe(1.0);
    });
  });

  describe("getAttributeGainsPreview", () => {
    it("should return correct strings for known workout types", () => {
      expect(getAttributeGainsPreview("Musculação")).toContain("STR");
      expect(getAttributeGainsPreview("Corrida")).toContain("SPD");
      expect(getAttributeGainsPreview("Yoga")).toContain("DISC");
    });

    it("should return empty string for unknown types", () => {
      expect(getAttributeGainsPreview("Descanso")).toBe("");
    });
  });
});
