/**
 * Magic phase simulation engine for spell casting and dispelling
 */

import { rollCastingDice, rollD3, rollD6, rollDispelDice } from "./dice";

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
	isBoundSpell?: boolean; // If true, first die is D6, rest are D3
	iterations?: number; // Number of simulations (default 50000)
}

/**
 * Results from magic simulation
 *
 * Main categories:
 * - spellSuccessPercent: Spell goes through successfully
 * - Spell fails (split into two sub-categories):
 *   - castingFailPercent: Casting roll doesn't reach CV
 *   - dispelSuccessPercent: Casting succeeds but dispel stops it
 *
 * These three percentages sum to 100%
 */
export interface MagicSimulationResults {
	castingFailPercent: number; // Spell fails: casting roll doesn't reach CV
	dispelSuccessPercent: number; // Spell fails: dispel beats casting roll
	spellSuccessPercent: number; // Spell succeeds: cast succeeds AND dispel fails
	iterations: number;
	executionTimeMs: number;
}

/**
 * Default values for optional parameters
 */
const DEFAULT_MAGIC_PARAMS = {
	iterations: 50000,
	isBoundSpell: false,
};

/**
 * Apply reroll logic to casting dice
 * Respects bound spell rules (first die D6, rest D3)
 */
function applyRerollCasting(rolls: number[], rerollType: CastingRerollType, isBoundSpell: boolean): number[] {
	if (rerollType === "none") return rolls;

	return rolls.map((roll, index) => {
		const shouldReroll = rerollType === "all" || (rerollType === "1s" && roll === 1);
		if (!shouldReroll) return roll;

		// Reroll with same die type
		if (isBoundSpell && index > 0) {
			return rollD3();
		}
		return rollD6();
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
	let castingRolls = rollCastingDice(params.castingDice, params.isBoundSpell);
	let castingTotal =
		castingRolls.reduce((sum, roll) => sum + roll, 0) + params.castingModifier - params.magicResistance;

	// Check if casting succeeded
	let castSucceeded = castingTotal >= params.castingValue;

	if (!castSucceeded) {
		castingRolls = applyRerollCasting(castingRolls, params.rerollCasting, params.isBoundSpell);
		castingTotal = castingRolls.reduce((sum, roll) => sum + roll, 0) + params.castingModifier - params.magicResistance;
		castSucceeded = castingTotal >= params.castingValue;
	}

	if (!castSucceeded) {
		return { castSucceeded: false, dispelSucceeded: false, spellSucceeded: false };
	}

	// Roll dispel dice
	let dispelRolls = rollDispelDice(params.dispelDice);
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
	let dispelSuccesses = 0;
	let spellSuccesses = 0;

	for (let i = 0; i < fullParams.iterations; i++) {
		const result = simulateSingleCast(fullParams);

		if (!result.castSucceeded) {
			castingFailures++;
		} else {
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
	// Two main categories: spell success vs spell fails
	// Spell fails split into: casting fail + dispel success
	// All three sum to 100%
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
