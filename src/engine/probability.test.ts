/**
 * Unit tests for probability calculations
 */

import { describe, expect, it } from "vitest";
import {
  calculateStatistics,
  getProbabilityAtLeast,
  getProbabilityExact,
} from "./probability";

describe("calculateStatistics", () => {
  it("should calculate mean correctly", () => {
    const distribution = [1, 2, 3, 4, 5];
    const results = calculateStatistics(distribution, 5, 100);
    expect(results.mean).toBe(3);
  });

  it("should calculate median correctly for odd length", () => {
    const distribution = [1, 2, 3, 4, 5];
    const results = calculateStatistics(distribution, 5, 100);
    expect(results.median).toBe(3);
  });

  it("should calculate median correctly for even length", () => {
    const distribution = [1, 2, 3, 4];
    const results = calculateStatistics(distribution, 4, 100);
    expect(results.median).toBe(2.5);
  });

  it("should calculate mode correctly", () => {
    const distribution = [1, 2, 2, 2, 3, 3, 4];
    const results = calculateStatistics(distribution, 7, 100);
    expect(results.mode).toBe(2);
  });

  it("should calculate percentiles correctly", () => {
    const distribution = Array.from({ length: 100 }, (_, i) => i + 1);
    const results = calculateStatistics(distribution, 100, 100);

    expect(results.percentile10).toBeCloseTo(10.45, 0);
    expect(results.percentile90).toBeCloseTo(90.55, 0);
  });

  it("should calculate min and max correctly", () => {
    const distribution = [3, 1, 4, 1, 5, 9, 2, 6];
    const results = calculateStatistics(distribution, 8, 100);
    expect(results.min).toBe(1);
    expect(results.max).toBe(9);
  });

  it("should build probability distribution", () => {
    const distribution = [1, 1, 2, 2, 2, 3];
    const results = calculateStatistics(distribution, 6, 100);

    expect(results.probabilityDistribution).toHaveLength(3);

    const oneWound = results.probabilityDistribution.find(
      (p) => p.wounds === 1
    );
    expect(oneWound?.count).toBe(2);
    expect(oneWound?.probability).toBeCloseTo(33.33, 1);

    const twoWounds = results.probabilityDistribution.find(
      (p) => p.wounds === 2
    );
    expect(twoWounds?.count).toBe(3);
    expect(twoWounds?.probability).toBe(50);

    const threeWounds = results.probabilityDistribution.find(
      (p) => p.wounds === 3
    );
    expect(threeWounds?.count).toBe(1);
    expect(threeWounds?.probability).toBeCloseTo(16.67, 1);
  });

  it("should calculate cumulative probability correctly", () => {
    const distribution = [1, 1, 2, 2, 2, 3];
    const results = calculateStatistics(distribution, 6, 100);

    const sorted = results.probabilityDistribution.sort(
      (a, b) => a.wounds - b.wounds
    );

    expect(sorted[0].cumulative).toBeCloseTo(33.33, 1); // 1 wound: 33.33%
    expect(sorted[1].cumulative).toBeCloseTo(83.33, 1); // 1-2 wounds: 83.33%
    expect(sorted[2].cumulative).toBe(100); // 1-3 wounds: 100%
  });

  it("should store metadata correctly", () => {
    const distribution = [1, 2, 3];
    const results = calculateStatistics(distribution, 3, 42.5);

    expect(results.totalIterations).toBe(3);
    expect(results.executionTimeMs).toBe(42.5);
    expect(results.distribution).toEqual(distribution);
  });

  it("should handle empty distribution", () => {
    const distribution: number[] = [];
    const results = calculateStatistics(distribution, 0, 0);

    expect(results.mean).toBe(0);
    expect(results.median).toBe(0);
    expect(results.mode).toBe(0);
    expect(results.min).toBe(0);
    expect(results.max).toBe(0);
  });

  it("should handle single value distribution", () => {
    const distribution = [5];
    const results = calculateStatistics(distribution, 1, 10);

    expect(results.mean).toBe(5);
    expect(results.median).toBe(5);
    expect(results.mode).toBe(5);
    expect(results.min).toBe(5);
    expect(results.max).toBe(5);
  });
});

describe("getProbabilityExact", () => {
  it("should return correct probability for existing value", () => {
    const distribution = [
      { wounds: 1, count: 20, probability: 20, cumulative: 20 },
      { wounds: 2, count: 50, probability: 50, cumulative: 70 },
      { wounds: 3, count: 30, probability: 30, cumulative: 100 },
    ];

    expect(getProbabilityExact(distribution, 1)).toBe(20);
    expect(getProbabilityExact(distribution, 2)).toBe(50);
    expect(getProbabilityExact(distribution, 3)).toBe(30);
  });

  it("should return 0 for non-existing value", () => {
    const distribution = [
      { wounds: 1, count: 20, probability: 20, cumulative: 20 },
      { wounds: 2, count: 50, probability: 50, cumulative: 70 },
    ];

    expect(getProbabilityExact(distribution, 3)).toBe(0);
    expect(getProbabilityExact(distribution, 0)).toBe(0);
    expect(getProbabilityExact(distribution, 10)).toBe(0);
  });

  it("should handle empty distribution", () => {
    expect(getProbabilityExact([], 1)).toBe(0);
  });
});

describe("getProbabilityAtLeast", () => {
  it("should return 0 for empty distribution", () => {
    expect(getProbabilityAtLeast([], 1)).toBe(0);
  });

  it("should return correct probability for values in distribution", () => {
    const distribution = [
      { wounds: 0, count: 10, probability: 10, cumulative: 10 },
      { wounds: 1, count: 20, probability: 20, cumulative: 30 },
      { wounds: 2, count: 40, probability: 40, cumulative: 70 },
      { wounds: 3, count: 30, probability: 30, cumulative: 100 },
    ];

    // At least 0: 100%
    expect(getProbabilityAtLeast(distribution, 0)).toBe(100);

    // At least 1: 90% (everything except 0)
    expect(getProbabilityAtLeast(distribution, 1)).toBe(90);

    // At least 2: 70% (wounds 2 and 3)
    expect(getProbabilityAtLeast(distribution, 2)).toBe(70);

    // At least 3: 30% (only wounds 3)
    expect(getProbabilityAtLeast(distribution, 3)).toBe(30);
  });

  it("should return 0 for values beyond max", () => {
    const distribution = [
      { wounds: 1, count: 50, probability: 50, cumulative: 50 },
      { wounds: 2, count: 50, probability: 50, cumulative: 100 },
    ];

    expect(getProbabilityAtLeast(distribution, 10)).toBe(0);
  });
});
