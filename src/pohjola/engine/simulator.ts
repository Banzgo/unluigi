import { parseDiceExpression } from "../../engine/dice";
import {
	applyAttackerRerolls,
	applyBlock,
	applyLethality,
	applyTitanic,
	getCritThreshold,
	resolveDefence,
	rollAttacks,
	subtractRerollBudget,
} from "./rules";
import type { PohjolaAttackParams, PohjolaIterationOutcome } from "./types";

const DEFAULTS = {
	lethality: 0 as const,
	criticalStrike: 0 as const,
	crush: 0 as const,
	block: 0 as const,
	titanicStrikes: 0 as const,
	resilient: 0 as const,
	attackerGoodRerolls: 0 as const,
	attackerBadTokens: 0 as const,
	defenderGoodRerolls: 0 as const,
	defenderBadTokens: 0 as const,
	divineTruth: 0,
	defenderDivineTruth: 0,
	reverberating: false,
	iterations: 10_000,
};

function withDefaults(params: PohjolaAttackParams): Required<PohjolaAttackParams> {
	return { ...DEFAULTS, ...params } as Required<PohjolaAttackParams>;
}

export function resolveAttack(params: Required<PohjolaAttackParams>): PohjolaIterationOutcome {
	const poolSize = parseDiceExpression(params.attackPool);
	const critThreshold = getCritThreshold(params.criticalStrike);

	// Step 1: Roll attacks, classify hits
	const { crits: rawCrits, normal: rawNormal, failedRolls } = rollAttacks(
		poolSize,
		params.as,
		critThreshold,
		params.divineTruth,
	);

	// Step 2: Attacker rerolls — both good/bad determined from initial roll, each die rerolled once
	const afterRerolls = applyAttackerRerolls(
		rawCrits,
		rawNormal,
		failedRolls.length,
		params.as,
		critThreshold,
		params.attackerGoodRerolls,
		params.attackerBadTokens,
	);

	// Step 3: Titanic Strikes — flat +X normal hits added to pool
	let combined = applyTitanic(afterRerolls, params.titanicStrikes);

	// Step 4: Reverberating Strikes — each hit spawns one new d6 attack, results join pool
	// Reroll budget is reduced by what was consumed on the main attack
	if (params.reverberating) {
		const hitCount = combined.crits + combined.normal;
		let extraCrits = 0;
		let extraNormals = 0;
		let gBudget = subtractRerollBudget(params.attackerGoodRerolls, afterRerolls.goodUsed);
		let bBudget = subtractRerollBudget(params.attackerBadTokens, afterRerolls.badUsed);
		for (let i = 0; i < hitCount; i++) {
			const { crits: rc, normal: rn, failedRolls: subFailed } = rollAttacks(1, params.as, critThreshold, 0);
			const sub = applyAttackerRerolls(rc, rn, subFailed.length, params.as, critThreshold, gBudget, bBudget);
			extraCrits += sub.crits;
			extraNormals += sub.normal;
			gBudget = subtractRerollBudget(gBudget, sub.goodUsed);
			bBudget = subtractRerollBudget(bBudget, sub.badUsed);
		}
		combined = { crits: combined.crits + extraCrits, normal: combined.normal + extraNormals };
	}

	// Step 5: Block / Crush — convert crits to normal hits (converted still face defence)
	const { remainingCrits, convertedToNormal } = applyBlock(combined.crits, params.block, params.crush);

	// Step 6: Defence phase (all normal hits including Block-converted crits)
	const { survived: survivedNormal, negated } = resolveDefence(
		combined.normal + convertedToNormal,
		params.ds,
		params.resilient,
		params.defenderGoodRerolls,
		params.defenderBadTokens,
		params.defenderDivineTruth,
	);

	// Step 7: Total hits + Lethality
	const totalHits = remainingCrits + survivedNormal;
	const damage = applyLethality(totalHits, params.lethality);

	return {
		damage,
		crits: combined.crits,
		blocks: negated,
	};
}

export function runPohjolaSimulation(params: PohjolaAttackParams): PohjolaIterationOutcome[] {
	const full = withDefaults(params);
	const outcomes: PohjolaIterationOutcome[] = [];
	for (let i = 0; i < full.iterations; i++) {
		outcomes.push(resolveAttack(full));
	}
	return outcomes;
}
