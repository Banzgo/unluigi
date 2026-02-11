import type { DiceInputState } from "@/components/DiceInput";
import {
	calculateStatistics,
	parseDiceExpression,
	runSimulation,
	type SimulationParameters,
	type SimulationResults,
} from "@/engine";

/**
 * Default number of iterations for simulations
 */
export const DEFAULT_ITERATIONS = 10000;

/**
 * Default armor piercing value
 */
export const DEFAULT_ARMOR_PIERCING = 0;

/**
 * Creates a default DiceInputState object with standard values
 */
export function createDefaultInput(): DiceInputState {
	return {
		id: crypto.randomUUID(),
		numAttacks: "10",
		hit: 4,
		wound: 4,
		armorSave: 5,
		specialSave: "none",
		rerollHitFailures: "none",
		rerollHitSuccesses: "none",
		rerollWoundFailures: "none",
		rerollWoundSuccesses: "none",
		rerollArmorSaveFailures: "none",
		rerollArmorSaveSuccesses: "none",
		rerollSpecialSaveFailures: "none",
		rerollSpecialSaveSuccesses: "none",
		poison: false,
		poisonOn5Plus: false,
		lethalStrike: false,
		fury: false,
		redFury: false,
		multipleWounds: "1",
		targetMaxWounds: "1",
	};
}

/**
 * Validates a DiceInputState to ensure it has valid input
 */
export function validateInput(input: DiceInputState): boolean {
	if (!input.numAttacks || input.numAttacks.trim() === "") {
		return false;
	}
	try {
		parseDiceExpression(input.numAttacks);
		return true;
	} catch {
		return false;
	}
}

/**
 * Converts a DiceInputState to SimulationParameters
 */
export function mapInputToSimulationParams(
	input: DiceInputState,
	iterations: number = DEFAULT_ITERATIONS,
): SimulationParameters {
	return {
		numAttacks: input.numAttacks,
		toHit: input.hit === "auto" ? "auto" : input.hit,
		rerollHitFailures: input.rerollHitFailures,
		rerollHitSuccesses: input.rerollHitSuccesses,
		toWound: input.wound === "auto" ? "auto" : input.wound,
		rerollWoundFailures: input.rerollWoundFailures,
		rerollWoundSuccesses: input.rerollWoundSuccesses,
		armorSave: input.armorSave === "none" ? "none" : input.armorSave,
		armorPiercing: DEFAULT_ARMOR_PIERCING,
		rerollArmorSaveFailures: input.rerollArmorSaveFailures,
		rerollArmorSaveSuccesses: input.rerollArmorSaveSuccesses,
		specialSave: input.specialSave === "none" ? "none" : input.specialSave,
		rerollSpecialSaveFailures: input.rerollSpecialSaveFailures,
		rerollSpecialSaveSuccesses: input.rerollSpecialSaveSuccesses,
		poison: input.poison,
		poisonOn5Plus: input.poisonOn5Plus,
		lethalStrike: input.lethalStrike,
		fury: input.fury,
		redFury: input.redFury,
		multipleWounds: input.multipleWounds || "1",
		targetMaxWounds: Number.parseInt(input.targetMaxWounds, 10) || 1,
		iterations,
	};
}

/**
 * Combines multiple distributions by summing values for each iteration
 */
export function combineDistributions(distributions: number[][], iterations: number): number[] {
	const combinedDistribution: number[] = [];
	for (let i = 0; i < iterations; i++) {
		let totalWounds = 0;
		for (const dist of distributions) {
			totalWounds += dist[i];
		}
		combinedDistribution.push(totalWounds);
	}
	return combinedDistribution;
}

/**
 * Runs a combined simulation for multiple inputs and returns aggregated results
 */
export function runCombinedSimulation(
	inputs: DiceInputState[],
	iterations: number = DEFAULT_ITERATIONS,
): SimulationResults {
	const startTime = performance.now();

	// Run simulations for each input and collect distributions
	const distributions: number[][] = inputs.map((input) => {
		const params = mapInputToSimulationParams(input, iterations);
		return runSimulation(params);
	});

	// Combine distributions by summing wounds for each iteration
	const combinedDistribution = combineDistributions(distributions, iterations);

	const endTime = performance.now();
	const executionTimeMs = endTime - startTime;

	// Calculate statistics on combined distribution
	return calculateStatistics(combinedDistribution, iterations, executionTimeMs);
}
