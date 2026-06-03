import { rollD6 } from "../../engine/dice";
import type { RerollCount } from "./types";

export interface HitPool {
	crits: number;
	normal: number;
}

/** critThreshold: die must be >= this to be a crit. Returns 7 when crits impossible. */
export function getCritThreshold(criticalStrike: -1 | 0 | 1 | 2 | 3): number {
	if (criticalStrike === -1) return 7;
	return Math.max(2, 6 - criticalStrike);
}

/**
 * Roll the attack pool and classify hits.
 * divineTruth dice auto-succeed as crits (skip the roll entirely).
 * Returns { crits, normal } before rerolls/titanic.
 */
export function rollAttacks(
	poolSize: number,
	as: number,
	critThreshold: number,
	divineTruth: number,
): { crits: number; normal: number; failedRolls: number[]; successRolls: number[] } {
	const autoHits = Math.min(divineTruth, poolSize);
	let crits = autoHits; // auto-hits are always crits
	let normal = 0;
	const failedRolls: number[] = [];
	const successRolls: number[] = [];

	const rollCount = poolSize - autoHits;
	for (let i = 0; i < rollCount; i++) {
		const die = rollD6();
		if (die >= critThreshold) {
			crits++;
			successRolls.push(die);
		} else if (die >= as) {
			normal++;
			successRolls.push(die);
		} else {
			failedRolls.push(die);
		}
	}

	return { crits, normal, failedRolls, successRolls };
}

/** How many dice to reroll given a count constraint and eligible dice count. */
function rerollCount(eligible: number, limit: RerollCount): number {
	if (limit === 0) return 0;
	if (limit === "all") return eligible;
	return Math.min(eligible, limit);
}

export interface AttackerRerollResult extends HitPool {
	goodUsed: number;
	badUsed: number;
}

/** Subtract used rerolls from budget. "all" is inexhaustible. */
export function subtractRerollBudget(original: RerollCount, used: number): RerollCount {
	if (original === "all") return "all";
	return Math.max(0, original - used) as RerollCount;
}

/**
 * Apply attacker good rerolls (reroll failures) and bad tokens (reroll successes).
 * Both determined from the initial roll — each die rerolled at most once.
 * Returns hits plus how many rerolls were consumed (for reverberating budget).
 */
export function applyAttackerRerolls(
	crits: number,
	normal: number,
	failedCount: number,
	as: number,
	critThreshold: number,
	goodRerolls: RerollCount,
	badTokens: RerollCount,
): AttackerRerollResult {
	let c = crits;
	let n = normal;

	// Determine rerolls from INITIAL roll — bad budget from original successes, not post-good-reroll
	const goodUsed = rerollCount(failedCount, goodRerolls);
	const badUsed = rerollCount(c + n, badTokens);

	// Strip original successes claimed by bad tokens (crits first)
	const strippedCrits = Math.min(badUsed, c);
	c -= strippedCrits;
	n -= Math.min(badUsed - strippedCrits, n);

	// Reroll all targeted dice — no die rerolled twice (failures ∩ successes = ∅)
	for (let i = 0; i < goodUsed + badUsed; i++) {
		const die = rollD6();
		if (die >= critThreshold) c++;
		else if (die >= as) n++;
	}

	return { crits: c, normal: n, goodUsed, badUsed };
}

/** Apply Titanic Strikes: add X flat normal hits to the pool. Can at most double the total number of hits + crits. No bonus on complete miss. */
export function applyTitanic(hits: HitPool, titanicStrikes: number): HitPool {
	if (titanicStrikes === 0) return hits;
	const totalHits = hits.crits + hits.normal;
	const titanic = Math.min(titanicStrikes, totalHits);
	return { crits: hits.crits, normal: hits.normal + titanic };
}

/**
 * Roll defence for normal hits.
 * defenderDivineTruth: first N hits auto-save without rolling.
 * Resilient: pool = normalHits + resilient extra dice, assign top normalHits vs DS.
 * Returns { negated, survived } normal hits.
 */
export function resolveDefence(
	normalHits: number,
	ds: number,
	resilient: number,
	defenderGoodRerolls: RerollCount,
	defenderBadTokens: RerollCount,
	defenderDivineTruth = 0,
): { negated: number; survived: number } {
	if (normalHits === 0) return { negated: 0, survived: 0 };

	const autoSaves = Math.min(defenderDivineTruth, normalHits);
	const hitsNeedingRoll = normalHits - autoSaves;

	if (hitsNeedingRoll === 0) return { negated: normalHits, survived: 0 };

	const poolSize = hitsNeedingRoll + resilient;
	const rolls: number[] = [];

	for (let i = 0; i < poolSize; i++) {
		rolls.push(rollD6());
	}

	// Determine reroll targets from ORIGINAL rolls — each die rerolled at most once
	const failedIndices = rolls.map((r, i) => (r < ds ? i : -1)).filter((i) => i >= 0);
	const successIndices = rolls.map((r, i) => (r >= ds ? i : -1)).filter((i) => i >= 0);

	const goodCount = rerollCount(failedIndices.length, defenderGoodRerolls);
	const badCount = rerollCount(successIndices.length, defenderBadTokens);

	for (let i = 0; i < goodCount; i++) {
		rolls[failedIndices[i]] = rollD6();
	}
	for (let i = 0; i < badCount; i++) {
		rolls[successIndices[i]] = rollD6();
	}

	// Assign top hitsNeedingRoll rolls to hits
	rolls.sort((a, b) => b - a);
	const assigned = rolls.slice(0, hitsNeedingRoll);

	const rolledNegated = assigned.filter((r) => r >= ds).length;
	const negated = autoSaves + rolledNegated;
	return { negated, survived: normalHits - negated };
}

/** Block/Crush: effectiveBlock = max(0, block - crush). Converts crits to normal hits (still face defence). */
export function applyBlock(
	crits: number,
	block: number,
	crush: number,
): { remainingCrits: number; convertedToNormal: number } {
	const effectiveBlock = Math.max(0, block - crush);
	const converted = Math.min(crits, effectiveBlock);
	return { remainingCrits: crits - converted, convertedToNormal: converted };
}

/** Lethality: add X extra damage to the pool (flat bonus) at most doubling the total damage. No effect if no hits. */
export function applyLethality(totalHits: number, lethality: number): number {
	if (lethality === 0) return totalHits;
	const lethalityBonus = Math.min(lethality, totalHits);
	return totalHits + lethalityBonus;
}
