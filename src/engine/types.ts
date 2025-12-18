// Type definitions for The Ninth Age Dice Simulator

export type HitValue = 2 | 3 | 4 | 5 | 6 | "auto" | "none";
export type RerollType = "none" | "1s" | "successes" | "fails";

/**
 * Parameters for simulating an attack sequence
 * All fields are optional except numAttacks, toHit, and toWound
 */
export interface SimulationParameters {
  // Attack Phase
  numAttacks: string | number; // Number or dice expression: 10, "d6", "2d6+3", "d3"
  toHit: HitValue; // 2-6, 'auto', or 'none' (auto-hit or impossible)
  rerollHits?: RerollType; // 'none' | '1s' | 'successes' | 'fails'

  // Wound Phase
  toWound: HitValue; // 2-6, 'auto', or 'none'
  rerollWounds?: RerollType; // 'none' | '1s' | 'successes' | 'fails'

  // Save Phase
  armorSave?: HitValue; // 2-6, 'auto' (no wound gets through), or 'none' (no save)
  armorPiercing?: number; // AP value (reduces armor, 0-6)
  rerollArmorSaves?: RerollType; // 'none' | '1s' | 'successes' | 'fails' (for defender)

  specialSave?: HitValue; // Ward/regen save: 2-6, 'auto', or 'none'
  rerollSpecialSaves?: RerollType; // 'none' | '1s' | 'successes' | 'fails' (for defender)

  // Special Rules
  poison?: boolean; // 6s to hit auto-wound (skip wound roll)
  lethalStrike?: boolean; // 6s to wound ignore armor AND special saves
  fury?: boolean; // 6s to hit generate 2 hits instead of 1
  multipleWounds?: string | number; // Wounds per unsaved wound: 1, "d3", "d6+1", etc.
  targetMaxWounds?: number; // Maximum wounds target model has (caps multiple wounds)

  // Simulation Settings
  iterations?: number; // Number of simulations to run (default 10000)
}

/**
 * Results from running a simulation
 */
export interface SimulationResults {
  // Raw data
  distribution: number[]; // Array of wound counts from each iteration

  // Statistical measures
  mean: number; // Average wounds dealt
  median: number; // Middle value when sorted
  mode: number; // Most common result
  variance: number; // Variance of the distribution

  // Percentiles
  percentile10: number; // 10th percentile
  percentile90: number; // 90th percentile

  // Range
  min: number; // Minimum wounds dealt
  max: number; // Maximum wounds dealt

  // Probability distribution
  probabilityDistribution: ProbabilityPoint[]; // Histogram data

  // Metadata
  totalIterations: number;
  executionTimeMs: number;
}

/**
 * Single point in the probability distribution
 */
export interface ProbabilityPoint {
  wounds: number; // Number of wounds
  count: number; // How many times this occurred
  probability: number; // Percentage (0-100)
  cumulative: number; // Cumulative probability (0-100)
}

/**
 * Tracks which hits have special properties
 */
export interface HitTracker {
  isPoison: boolean; // Hit caused by poison (auto-wound)
  isLethal: boolean; // Wound caused by lethal strike (bypasses saves)
}
