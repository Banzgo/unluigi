import { calculateStatistics } from "../../engine/probability";
import { runPohjolaSimulation } from "./simulator";
import type { PohjolaAttackParams, PohjolaIterationOutcome, PohjolaSimulationResults } from "./types";

function aggregateResults(
	outcomes: PohjolaIterationOutcome[],
	iterations: number,
	executionTimeMs: number,
): PohjolaSimulationResults {
	const damageArr = outcomes.map((o) => o.damage);
	const damage = calculateStatistics(damageArr, iterations, executionTimeMs);

	const meanCrits = outcomes.reduce((s, o) => s + o.crits, 0) / iterations;
	const meanBlocks = outcomes.reduce((s, o) => s + o.blocks, 0) / iterations;

	// Build per-damage buckets
	const bucketCrits = new Map<number, number>();
	const bucketBlocks = new Map<number, number>();
	const bucketCount = new Map<number, number>();

	for (const o of outcomes) {
		const d = o.damage;
		bucketCount.set(d, (bucketCount.get(d) ?? 0) + 1);
		bucketCrits.set(d, (bucketCrits.get(d) ?? 0) + o.crits);
		bucketBlocks.set(d, (bucketBlocks.get(d) ?? 0) + o.blocks);
	}

	const byDamage: PohjolaSimulationResults["byDamage"] = {};
	for (const [d, count] of bucketCount) {
		byDamage[d] = {
			count,
			probability: (count / iterations) * 100,
			avgCrits: (bucketCrits.get(d) ?? 0) / count,
			avgBlocks: (bucketBlocks.get(d) ?? 0) / count,
		};
	}

	return { damage, meanCrits, meanBlocks, byDamage };
}

export function runPohjolaSimulationWithStats(params: PohjolaAttackParams): PohjolaSimulationResults {
	const iterations = params.iterations ?? 10_000;
	const start = performance.now();
	const outcomes = runPohjolaSimulation(params);
	const elapsed = performance.now() - start;
	return aggregateResults(outcomes, iterations, elapsed);
}
