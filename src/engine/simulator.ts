/**
 * Core simulation engine for The Ninth Age dice simulator
 */

import { isSuccess, parseDiceExpression, rollD6, shouldRerollSplit } from "./dice";
import { calculateStatistics } from "./probability";
import type { HitTracker, SimulationParameters, SimulationResults } from "./types";

/**
 * Default values for optional simulation parameters
 */
const DEFAULT_PARAMS = {
	rerollHitFailures: "none" as const,
	rerollHitSuccesses: "none" as const,
	rerollWoundFailures: "none" as const,
	rerollWoundSuccesses: "none" as const,
	armorSave: "none" as const,
	armorPiercing: 0,
	rerollArmorSaveFailures: "none" as const,
	rerollArmorSaveSuccesses: "none" as const,
	specialSave: "none" as const,
	rerollSpecialSaveFailures: "none" as const,
	rerollSpecialSaveSuccesses: "none" as const,
	poison: false,
	poisonOn5Plus: false,
	lethalStrike: false,
	fury: false,
	redFury: false,
	multipleWounds: 1,
	targetMaxWounds: 3,
	iterations: 10000,
};

/**
 * Merge user parameters with defaults
 * @param params User-provided simulation parameters
 * @returns Complete simulation parameters with defaults applied
 */
function applyDefaults(params: SimulationParameters): Required<SimulationParameters> {
	return {
		...DEFAULT_PARAMS,
		...params,
	} as Required<SimulationParameters>;
}

/**
 * Run the complete simulation with the given parameters
 * @param params Simulation parameters
 * @returns Raw distribution array
 */
export function runSimulation(params: SimulationParameters): number[] {
	const fullParams = applyDefaults(params);
	const distribution: number[] = [];

	for (let i = 0; i < fullParams.iterations; i++) {
		const wounds = simulateSingleSequence(fullParams);
		distribution.push(wounds);
	}

	return distribution;
}

/**
 * Run simulation and calculate statistics
 * @param params Simulation parameters
 * @returns Simulation results with statistics and distribution
 */
export function runSimulationWithStats(params: SimulationParameters): SimulationResults {
	const fullParams = applyDefaults(params);
	const startTime = performance.now();
	const distribution = runSimulation(params);
	const endTime = performance.now();
	const executionTimeMs = endTime - startTime;

	return calculateStatistics(distribution, fullParams.iterations, executionTimeMs);
}

/**
 * Simulate a single attack sequence
 * @param params Complete simulation parameters with defaults applied
 * @returns Number of wounds dealt
 */
function simulateSingleSequence(params: Required<SimulationParameters>): number {
	// Phase 0: Determine number of attacks
	const numAttacks = parseDiceExpression(params.numAttacks);

	// If Red Fury is not active, we can run the standard pipeline once
	if (!params.redFury) {
		const { totalWounds } = simulateAttackBatch(numAttacks, params);
		return totalWounds;
	}

	// With Red Fury: each unsaved wound from the initial batch generates
	// one additional attack, but these extra attacks do not generate
	// further Red Fury attacks (no chaining).
	const { unsavedHits, totalWounds: baseWounds } = simulateAttackBatch(numAttacks, params);

	if (unsavedHits === 0) {
		return baseWounds;
	}

	// Extra attacks use the same properties, but Red Fury is disabled so
	// they cannot generate further attacks.
	const paramsWithoutRedFury: Required<SimulationParameters> = {
		...params,
		redFury: false,
	};

	const { totalWounds: extraWounds } = simulateAttackBatch(unsavedHits, paramsWithoutRedFury);

	return baseWounds + extraWounds;
}

/**
 * Simulate a batch of attacks with the given number of attacks.
 * Returns both the number of unsaved wounds (before multiple wounds)
 * and the final total wounds after applying multiple wounds.
 */
function simulateAttackBatch(
	numAttacks: number,
	params: Required<SimulationParameters>,
): { unsavedHits: number; totalWounds: number } {
	// Phase 1: To-Hit Rolls
	const hitTrackers = rollToHit(numAttacks, params);

	// Phase 2: To-Wound Rolls
	const woundTrackers = rollToWound(hitTrackers, params);

	// Phase 3: Armor Saves
	const unsavedAfterArmor = rollArmorSaves(woundTrackers, params);

	// Phase 4: Special Saves (Ward/Regen)
	const unsavedAfterSpecial = rollSpecialSaves(unsavedAfterArmor, params);

	// Phase 5: Apply Multiple Wounds
	const totalWounds = applyMultipleWounds(unsavedAfterSpecial, params);

	return {
		unsavedHits: unsavedAfterSpecial.length,
		totalWounds,
	};
}

/**
 * Phase 1: Roll to hit
 * @param numAttacks Number of attacks
 * @param params Complete simulation parameters with defaults applied
 * @returns Array of hit trackers for successful hits
 */
function rollToHit(numAttacks: number, params: Required<SimulationParameters>): HitTracker[] {
	const hits: HitTracker[] = [];

	for (let i = 0; i < numAttacks; i++) {
		let roll = rollD6();
		const unmodifiedRoll = roll;

		// Check for rerolls (a die can only be rerolled once)
		if (shouldRerollSplit(roll, params.toHit, params.rerollHitFailures, params.rerollHitSuccesses)) {
			roll = rollD6();
		}

		// Check if hit succeeded
		if (isSuccess(roll, params.toHit)) {
			const isPoisonHit =
				(params.poisonOn5Plus && unmodifiedRoll >= 5) || (params.poison && unmodifiedRoll === 6);

			const tracker: HitTracker = {
				isPoison: isPoisonHit,
				isLethal: false, // Set during wound phase
			};

			hits.push(tracker);

			// Fury: 6s generate an additional hit
			if (params.fury && unmodifiedRoll === 6) {
				hits.push({ isPoison: false, isLethal: false });
			}
		}
	}

	return hits;
}

/**
 * Phase 2: Roll to wound
 * @param hitTrackers Array of hit trackers from to-hit phase
 * @param params Complete simulation parameters with defaults applied
 * @returns Array of wound trackers for successful wounds
 */
function rollToWound(hitTrackers: HitTracker[], params: Required<SimulationParameters>): HitTracker[] {
	const wounds: HitTracker[] = [];

	for (const hit of hitTrackers) {
		// Poison hits auto-wound
		if (hit.isPoison) {
			wounds.push(hit);
			continue;
		}

		let roll = rollD6();
		const unmodifiedRoll = roll;

		// Check for rerolls (a die can only be rerolled once)
		if (shouldRerollSplit(roll, params.toWound, params.rerollWoundFailures, params.rerollWoundSuccesses)) {
			roll = rollD6();
		}

		// Check if wound succeeded
		if (isSuccess(roll, params.toWound)) {
			const tracker: HitTracker = {
				isPoison: hit.isPoison,
				isLethal: params.lethalStrike && unmodifiedRoll === 6,
			};
			wounds.push(tracker);
		}
	}

	return wounds;
}

/**
 * Phase 3: Roll armor saves
 * @param woundTrackers Array of wound trackers from to-wound phase
 * @param params Complete simulation parameters with defaults applied
 * @returns Array of wound trackers that failed armor saves
 */
function rollArmorSaves(woundTrackers: HitTracker[], params: Required<SimulationParameters>): HitTracker[] {
	const unsavedWounds: HitTracker[] = [];

	for (const wound of woundTrackers) {
		// Lethal Strike bypasses all saves
		if (wound.isLethal) {
			unsavedWounds.push(wound);
			continue;
		}

		// Check if armor save is possible
		if (params.armorSave === "none") {
			unsavedWounds.push(wound);
			continue;
		}

		if (params.armorSave === "auto") {
			// Auto-save, wound is negated
			continue;
		}

		// Calculate modified armor save
		const modifiedArmorSave = Math.min(7, params.armorSave + params.armorPiercing);

		// If modified save is 7+, it's impossible
		if (modifiedArmorSave > 6) {
			unsavedWounds.push(wound);
			continue;
		}

		let roll = rollD6();

		// Check for rerolls (defender's perspective, a die can only be rerolled once)
		if (shouldRerollSplit(roll, modifiedArmorSave, params.rerollArmorSaveFailures, params.rerollArmorSaveSuccesses)) {
			roll = rollD6();
		}

		// Check if save failed
		if (!isSuccess(roll, modifiedArmorSave)) {
			unsavedWounds.push(wound);
		}
	}

	return unsavedWounds;
}

/**
 * Phase 4: Roll special saves (Ward/Regen)
 * @param woundTrackers Array of wound trackers that failed armor saves
 * @param params Complete simulation parameters with defaults applied
 * @returns Array of wound trackers that failed special saves
 */
function rollSpecialSaves(woundTrackers: HitTracker[], params: Required<SimulationParameters>): HitTracker[] {
	const unsavedWounds: HitTracker[] = [];

	for (const wound of woundTrackers) {
		// Lethal Strike bypasses all saves (including special)
		if (wound.isLethal) {
			unsavedWounds.push(wound);
			continue;
		}

		// Check if special save is possible
		if (params.specialSave === "none") {
			unsavedWounds.push(wound);
			continue;
		}

		if (params.specialSave === "auto") {
			// Auto-save, wound is negated
			continue;
		}

		let roll = rollD6();

		// Check for rerolls (defender's perspective, a die can only be rerolled once)
		if (
			shouldRerollSplit(roll, params.specialSave, params.rerollSpecialSaveFailures, params.rerollSpecialSaveSuccesses)
		) {
			roll = rollD6();
		}

		// Check if save failed
		if (!isSuccess(roll, params.specialSave)) {
			unsavedWounds.push(wound);
		}
	}

	return unsavedWounds;
}

/**
 * Phase 5: Apply multiple wounds
 * @param woundTrackers Array of wound trackers that passed all saves
 * @param params Complete simulation parameters with defaults applied
 * @returns Total number of wounds dealt
 */
function applyMultipleWounds(woundTrackers: HitTracker[], params: Required<SimulationParameters>): number {
	let totalWounds = 0;

	for (const _wound of woundTrackers) {
		const woundsPerHit = parseDiceExpression(params.multipleWounds);
		// Cap each individual hit's wounds, but not the total across all hits
		const cappedWounds = Math.min(woundsPerHit, params.targetMaxWounds);
		totalWounds += cappedWounds;
	}

	return totalWounds;
}
