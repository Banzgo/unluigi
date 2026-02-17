// Type definitions for The Ninth Age Dice Simulator

export type HitValue = 2 | 3 | 4 | 5 | 6 | "auto" | "none";

// Success rerolls: reroll dice that succeeded
export type SuccessRerollType = "none" | "6s" | "all";

// Failure rerolls: reroll dice that failed
export type FailureRerollType = "none" | "1s" | "all";

// Legacy type for backwards compatibility
export type RerollType = "none" | "1s" | "successes" | "fails";

/**
 * Parameters for simulating an attack sequence
 * All fields are optional except numAttacks, toHit, and toWound
 */
export interface SimulationParameters {
	// Attack Phase
	numAttacks: string | number; // Number or dice expression: 10, "d6", "2d6+3", "d3"
	toHit: HitValue; // 2-6, 'auto', or 'none' (auto-hit or impossible)
	rerollHitFailures?: FailureRerollType; // 'none' | '1s' | 'all' - reroll failed hit rolls
	rerollHitSuccesses?: SuccessRerollType; // 'none' | '6s' | 'all' - reroll successful hit rolls

	// Wound Phase
	toWound: HitValue; // 2-6, 'auto', or 'none'
	rerollWoundFailures?: FailureRerollType; // 'none' | '1s' | 'all' - reroll failed wound rolls
	rerollWoundSuccesses?: SuccessRerollType; // 'none' | '6s' | 'all' - reroll successful wound rolls

	// Save Phase
	armorSave?: HitValue; // 2-6, 'auto' (no wound gets through), or 'none' (no save)
	rerollArmorSaveFailures?: FailureRerollType; // 'none' | '1s' | 'all' - reroll failed saves (for defender)
	rerollArmorSaveSuccesses?: SuccessRerollType; // 'none' | '6s' | 'all' - reroll successful saves (for defender)

	specialSave?: HitValue; // Ward/regen save: 2-6, 'auto', or 'none'
	rerollSpecialSaveFailures?: FailureRerollType; // 'none' | '1s' | 'all' - reroll failed saves (for defender)
	rerollSpecialSaveSuccesses?: SuccessRerollType; // 'none' | '6s' | 'all' - reroll successful saves (for defender)

	// Special Rules
	poison?: boolean; // 6s to hit auto-wound (skip wound roll)
	poisonOn5Plus?: boolean; // 5+ to hit auto-wound (like poison but on 5+)
	lethalStrike?: boolean; // 6s to wound ignore armor AND special saves
	fury?: boolean; // 6s to hit generate 2 hits instead of 1
	redFury?: boolean; // Each unsaved wound generates one extra attack (no further chaining)
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
