import type { SimulationResults } from "../../engine/types";

export type RerollCount = 0 | 1 | 2 | "all";

export interface PohjolaAttackParams {
	attackPool: number | string;
	as: 2 | 3 | 4 | 5 | 6;
	ds: 2 | 3 | 4 | 5 | 6;
	lethality: 0 | 1 | 2 | 3;
	/** crit threshold = max(2, 6 - X); -1 means crits impossible (threshold 7) */
	criticalStrike: -1 | 0 | 1 | 2 | 3;
	crush: 0 | 1 | 2 | 3;
	block: 0 | 1 | 2 | 3;
	/** each hit becomes X+1 hits before defence */
	titanicStrikes: 0 | 1 | 2 | 3;
	/** extra defence dice, pool model: roll hitCount+X, assign top hitCount */
	resilient: 0 | 1 | 2 | 3;
	attackerGoodRerolls: RerollCount;
	attackerBadTokens: RerollCount;
	defenderGoodRerolls: RerollCount;
	defenderBadTokens: RerollCount;
	/** count of auto-hit normal hits (first N dice skip the roll) */
	divineTruth: number;
	reverberating: boolean;
	iterations?: number;
}

export interface PohjolaIterationOutcome {
	damage: number;
	crits: number;
	blocks: number;
}

export interface ByDamageBucket {
	count: number;
	probability: number;
	avgCrits: number;
	avgBlocks: number;
}

export interface PohjolaSimulationResults {
	damage: SimulationResults;
	meanCrits: number;
	meanBlocks: number;
	byDamage: Record<number, ByDamageBucket>;
}
