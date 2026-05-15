import { parseDiceExpression } from "../../engine/dice";
import {
	applyAttackerRerolls,
	applyBlock,
	applyLethality,
	applyTitanic,
	getCritThreshold,
	resolveDefence,
	rollAttacks,
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
	reverberating: false,
	iterations: 10_000,
};

function withDefaults(params: PohjolaAttackParams): Required<PohjolaAttackParams> {
	return { ...DEFAULTS, ...params } as Required<PohjolaAttackParams>;
}

export function resolveAttack(params: Required<PohjolaAttackParams>): PohjolaIterationOutcome {
	const poolSize = parseDiceExpression(params.attackPool);
	const critThreshold = getCritThreshold(params.criticalStrike);

	// Step 1-3: Roll attacks, classify hits
	const {
		crits: rawCrits,
		normal: rawNormal,
		failedRolls,
	} = rollAttacks(poolSize, params.as, critThreshold, params.divineTruth);

	// Step 4: Attacker rerolls
	const afterRerolls = applyAttackerRerolls(
		rawCrits,
		rawNormal,
		failedRolls.length,
		params.as,
		critThreshold,
		params.attackerGoodRerolls,
		params.attackerBadTokens,
	);

	// Step 5: Titanic Strikes
	const afterTitanic = applyTitanic(afterRerolls, params.titanicStrikes);

	// Step 6: Defence phase (normal hits only)
	const { survived: survivedNormal, negated } = resolveDefence(
		afterTitanic.normal,
		params.ds,
		params.resilient,
		params.defenderGoodRerolls,
		params.defenderBadTokens,
	);

	// Step 7: Block / Crush
	const { remainingCrits } = applyBlock(afterTitanic.crits, params.block, params.crush);

	// Step 8: Total hits
	const totalHits = remainingCrits + survivedNormal;

	// Step 9: Lethality
	const damage = applyLethality(totalHits, params.lethality);

	// Step 10: Reverberating Strikes
	let subDamage = 0;
	let subCrits = 0;
	let subBlocks = 0;
	if (params.reverberating && totalHits > 0) {
		const subParams: Required<PohjolaAttackParams> = { ...params, attackPool: 1, reverberating: false };
		for (let i = 0; i < totalHits; i++) {
			const sub = resolveAttack(subParams);
			subDamage += sub.damage;
			subCrits += sub.crits;
			subBlocks += sub.blocks;
		}
	}

	return {
		damage: damage + subDamage,
		crits: afterTitanic.crits + subCrits,
		blocks: negated + subBlocks, // successful defence saves (normal hits negated)
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
