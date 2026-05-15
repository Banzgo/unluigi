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
 * divineTruth dice auto-succeed as normal hits.
 * Returns { crits, normal } before rerolls/titanic.
 */
export function rollAttacks(
	poolSize: number,
	as: number,
	critThreshold: number,
	divineTruth: number,
): { crits: number; normal: number; failedRolls: number[]; successRolls: number[] } {
	let crits = 0;
	const autoHits = Math.min(divineTruth, poolSize);
	let normal = autoHits; // auto-hits are always normal hits
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

/**
 * Apply attacker good rerolls (reroll failures) and bad tokens (reroll successes).
 * Good rerolls happen first; bad tokens apply to all successes after good rerolls.
 * Each original die is rerolled at most once.
 */
export function applyAttackerRerolls(
	crits: number,
	normal: number,
	failedCount: number,
	as: number,
	critThreshold: number,
	goodRerolls: RerollCount,
	badTokens: RerollCount,
): HitPool {
	let c = crits;
	let n = normal;

	// Good rerolls: reroll failed attack dice
	const goodCount = rerollCount(failedCount, goodRerolls);
	for (let i = 0; i < goodCount; i++) {
		const die = rollD6();
		if (die >= critThreshold) c++;
		else if (die >= as) n++;
	}

	// Bad tokens: force-reroll successes (strip crits first, then normal hits)
	const badCount = rerollCount(c + n, badTokens);
	let toStrip = badCount;
	const strippedCrits = Math.min(toStrip, c);
	c -= strippedCrits;
	toStrip -= strippedCrits;
	n -= Math.min(toStrip, n);

	for (let i = 0; i < badCount; i++) {
		const die = rollD6();
		if (die >= critThreshold) c++;
		else if (die >= as) n++;
	}

	return { crits: c, normal: n };
}

/** Apply Titanic Strikes: each hit becomes X+1 hits, crits stay crits. */
export function applyTitanic(hits: HitPool, titanicStrikes: number): HitPool {
	if (titanicStrikes === 0) return hits;
	const multiplier = titanicStrikes + 1;
	return { crits: hits.crits * multiplier, normal: hits.normal * multiplier };
}

/**
 * Roll defence for normal hits.
 * Resilient: pool = normalHits + resilient extra dice, assign top normalHits vs DS.
 * Returns { negated, survived } normal hits.
 */
export function resolveDefence(
	normalHits: number,
	ds: number,
	resilient: number,
	defenderGoodRerolls: RerollCount,
	defenderBadTokens: RerollCount,
): { negated: number; survived: number } {
	if (normalHits === 0) return { negated: 0, survived: 0 };

	const poolSize = normalHits + resilient;
	const rolls: number[] = [];

	for (let i = 0; i < poolSize; i++) {
		rolls.push(rollD6());
	}

	// Defender good rerolls: reroll dice below DS
	const failedIndices = rolls.map((r, i) => (r < ds ? i : -1)).filter((i) => i >= 0);
	const goodCount = rerollCount(failedIndices.length, defenderGoodRerolls);
	for (let i = 0; i < goodCount; i++) {
		rolls[failedIndices[i]] = rollD6();
	}

	// Defender bad tokens: force-reroll dice at or above DS
	const successIndices = rolls.map((r, i) => (r >= ds ? i : -1)).filter((i) => i >= 0);
	const badCount = rerollCount(successIndices.length, defenderBadTokens);
	for (let i = 0; i < badCount; i++) {
		rolls[successIndices[i]] = rollD6();
	}

	// Assign top normalHits rolls to hits
	rolls.sort((a, b) => b - a);
	const assigned = rolls.slice(0, normalHits);

	const negated = assigned.filter((r) => r >= ds).length;
	return { negated, survived: normalHits - negated };
}

/** Block/Crush: effectiveBlock = max(0, block - crush). Returns crits cancelled. */
export function applyBlock(crits: number, block: number, crush: number): { remainingCrits: number; blocked: number } {
	const effectiveBlock = Math.max(0, block - crush);
	const blocked = Math.min(crits, effectiveBlock);
	return { remainingCrits: crits - blocked, blocked };
}

/** Lethality: add X extra hits to the pool (flat bonus). No effect if no hits. */
export function applyLethality(totalHits: number, lethality: number): number {
	if (lethality === 0 || totalHits === 0) return totalHits;
	return totalHits + lethality;
}
