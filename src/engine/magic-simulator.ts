/**
 * Magic phase simulation engine for spell casting and dispelling
 */

import { rollD6 } from "./dice";

/**
 * Reroll type for casting rolls
 */
export type CastingRerollType = "none" | "1s" | "all";

/**
 * Reroll type for dispel rolls
 */
export type DispelRerollType = "none" | "all";

/**
 * Parameters for simulating a spell casting attempt with dispel
 */
export interface MagicSimulationParameters {
	castingDice: number; // 2-5 dice
	dispelDice: number; // 1-7 dice
	castingValue: number; // 5-11 target value
	castingModifier: number; // -1, 0, +1, +2
	dispelModifier: number; // -1, 0, +1, +2
	magicResistance: number; // 0, 1, 2, 3 (subtracted from casting roll)
	rerollCasting: CastingRerollType; // none, 1s, all
	rerollDispel: DispelRerollType; // none, all
	iterations?: number; // Number of simulations (default 50000)
}

/**
 * Results from magic simulation
 */
export interface MagicSimulationResults {
	castingFailPercent: number; // Probability casting roll doesn't reach CV
	dispelSuccessPercent: number; // Probability dispel beats casting (when cast succeeds)
	spellSuccessPercent: number; // Probability spell goes through (cast succeeds AND dispel fails)
	iterations: number;
	executionTimeMs: number;
}

/**
 * Default values for optional parameters
 */
const DEFAULT_MAGIC_PARAMS = {
	iterations: 50000,
};

/**
 * Roll multiple D6 and return each individual roll
 */
function rollDice(count: number): number[] {
	const rolls: number[] = [];
	for (let i = 0; i < count; i++) {
		rolls.push(rollD6());
	}
	return rolls;
}

/**
 * Apply reroll logic to casting dice
 */
function applyRerollCasting(rolls: number[], rerollType: CastingRerollType): number[] {
	if (rerollType === "none") return rolls;

	return rolls.map((roll) => {
		if (rerollType === "all") {
			return rollD6(); // Reroll all dice
		}
		if (rerollType === "1s" && roll === 1) {
			return rollD6(); // Reroll only 1s
		}
		return roll;
	});
}

/**
 * Apply reroll logic to dispel dice
 */
function applyRerollDispel(rolls: number[], rerollType: DispelRerollType): number[] {
	if (rerollType === "none") return rolls;

	// Reroll all dice
	return rolls.map(() => rollD6());
}

/**
 * Simulate a single spell casting attempt with dispel
 * @returns Object with cast success, dispel success, and final spell success
 */
function simulateSingleCast(params: Required<MagicSimulationParameters>): {
	castSucceeded: boolean;
	dispelSucceeded: boolean;
	spellSucceeded: boolean;
} {
	// Roll casting dice
	let castingRolls = rollDice(params.castingDice);
	let castingTotal = castingRolls.reduce((sum, roll) => sum + roll, 0) + params.castingModifier - params.magicResistance;

	// Check if casting succeeded
	let castSucceeded = castingTotal >= params.castingValue;

  if (!castSucceeded) {
    castingRolls = applyRerollCasting(castingRolls, params.rerollCasting);
    castingTotal = castingRolls.reduce((sum, roll) => sum + roll, 0) + params.castingModifier - params.magicResistance;
    castSucceeded = castingTotal >= params.castingValue;
  }

	if (!castSucceeded) {
		return { castSucceeded: false, dispelSucceeded: false, spellSucceeded: false };
	}

	// Roll dispel dice
	let dispelRolls = rollDice(params.dispelDice);
	let dispelTotal = dispelRolls.reduce((sum, roll) => sum + roll, 0) + params.dispelModifier;

	// Dispel succeeds if it equals or exceeds the casting total
	let dispelSucceeded = dispelTotal >= castingTotal;

  if (!dispelSucceeded) {
    dispelRolls = applyRerollDispel(dispelRolls, params.rerollDispel);
    dispelTotal = dispelRolls.reduce((sum, roll) => sum + roll, 0) + params.dispelModifier;
    dispelSucceeded = dispelTotal >= castingTotal;
  }

	return {
		castSucceeded: true,
		dispelSucceeded,
		spellSucceeded: !dispelSucceeded,
	};
}

/**
 * Run the complete magic simulation
 * @param params Magic simulation parameters
 * @returns Simulation results with probabilities
 */
export function runMagicSimulation(params: MagicSimulationParameters): MagicSimulationResults {
	const fullParams: Required<MagicSimulationParameters> = {
		...DEFAULT_MAGIC_PARAMS,
		...params,
	};

	const startTime = performance.now();

	let castingFailures = 0;
	let castingSuccesses = 0;
	let dispelSuccesses = 0;
	let spellSuccesses = 0;

	for (let i = 0; i < fullParams.iterations; i++) {
		const result = simulateSingleCast(fullParams);

		if (!result.castSucceeded) {
			castingFailures++;
		} else {
			castingSuccesses++;
			if (result.dispelSucceeded) {
				dispelSuccesses++;
			}
			if (result.spellSucceeded) {
				spellSuccesses++;
			}
		}
	}

	const endTime = performance.now();

	// Calculate percentages
	const castingFailPercent = (castingFailures / fullParams.iterations) * 100;
	const dispelSuccessPercent = (dispelSuccesses / fullParams.iterations) * 100;
	const spellSuccessPercent = (spellSuccesses / fullParams.iterations) * 100;

	return {
		castingFailPercent,
		dispelSuccessPercent,
		spellSuccessPercent,
		iterations: fullParams.iterations,
		executionTimeMs: endTime - startTime,
	};
}

