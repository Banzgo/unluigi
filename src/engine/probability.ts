/**
 * Probability and statistical calculation utilities
 */

import type { ProbabilityPoint, SimulationResults } from "./types";

/**
 * Calculate statistical measures from simulation distribution
 * @param distribution Array of wound counts from each iteration
 * @param totalIterations Total number of iterations run
 * @param executionTimeMs Time taken to run simulation
 * @returns Complete simulation results with statistics
 */
export function calculateStatistics(
  distribution: number[],
  totalIterations: number,
  executionTimeMs: number
): SimulationResults {
  // Sort distribution for percentile calculations
  const sorted = [...distribution].sort((a, b) => a - b);

  // Calculate basic statistics
  const mean = calculateMean(distribution);
  const median = calculatePercentile(sorted, 50);
  const mode = calculateMode(distribution);

  // Calculate percentiles
  const percentile25 = calculatePercentile(sorted, 25);
  const percentile50 = median;
  const percentile75 = calculatePercentile(sorted, 75);
  const percentile95 = calculatePercentile(sorted, 95);

  // Get range
  const min = sorted[0] || 0;
  const max = sorted[sorted.length - 1] || 0;

  // Build probability distribution
  const probabilityDistribution = buildProbabilityDistribution(distribution);

  return {
    distribution,
    mean,
    median,
    mode,
    percentile25,
    percentile50,
    percentile75,
    percentile95,
    min,
    max,
    probabilityDistribution,
    totalIterations,
    executionTimeMs,
  };
}

/**
 * Calculate the mean (average) of an array of numbers
 * @param values Array of numbers
 * @returns Mean value
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate the mode (most common value) of an array
 * @param values Array of numbers
 * @returns Mode value
 */
function calculateMode(values: number[]): number {
  if (values.length === 0) return 0;

  const frequency = new Map<number, number>();

  for (const value of values) {
    frequency.set(value, (frequency.get(value) || 0) + 1);
  }

  let maxCount = 0;
  let mode = 0;

  for (const [value, count] of frequency) {
    if (count > maxCount) {
      maxCount = count;
      mode = value;
    }
  }

  return mode;
}

/**
 * Calculate a percentile from a sorted array
 * @param sortedValues Sorted array of numbers
 * @param percentile Percentile to calculate (0-100)
 * @returns Value at the given percentile
 */
function calculatePercentile(
  sortedValues: number[],
  percentile: number
): number {
  if (sortedValues.length === 0) return 0;

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sortedValues[lower];
  }

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Build probability distribution from raw results
 * @param values Array of wound counts
 * @returns Array of probability points
 */
function buildProbabilityDistribution(values: number[]): ProbabilityPoint[] {
  if (values.length === 0) return [];

  // Count occurrences
  const frequency = new Map<number, number>();

  for (const value of values) {
    frequency.set(value, (frequency.get(value) || 0) + 1);
  }

  // Convert to probability points
  const points: ProbabilityPoint[] = [];
  const total = values.length;

  // Get all wound values and sort them
  const woundValues = Array.from(frequency.keys()).sort((a, b) => a - b);

  let cumulativeCount = 0;

  for (const wounds of woundValues) {
    const count = frequency.get(wounds) || 0;
    cumulativeCount += count;

    points.push({
      wounds,
      count,
      probability: (count / total) * 100,
      cumulative: (cumulativeCount / total) * 100,
    });
  }

  return points;
}

/**
 * Get the probability of dealing at least X wounds
 * @param distribution Probability distribution
 * @param targetWounds Target number of wounds
 * @returns Probability (0-100)
 */
export function getProbabilityAtLeast(
  distribution: ProbabilityPoint[],
  targetWounds: number
): number {
  if (distribution.length === 0) return 0;

  // Find the first point >= targetWounds
  const point = distribution.find((p) => p.wounds >= targetWounds);

  if (!point) return 0;

  // If it's exact match, use its cumulative
  if (point.wounds === targetWounds) {
    return 100 - (point.cumulative - point.probability);
  }

  // Otherwise, interpolate or use previous
  return 100 - point.cumulative;
}

/**
 * Get the probability of dealing exactly X wounds
 * @param distribution Probability distribution
 * @param targetWounds Target number of wounds
 * @returns Probability (0-100)
 */
export function getProbabilityExact(
  distribution: ProbabilityPoint[],
  targetWounds: number
): number {
  const point = distribution.find((p) => p.wounds === targetWounds);
  return point ? point.probability : 0;
}
