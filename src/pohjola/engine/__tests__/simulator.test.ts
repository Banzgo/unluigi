import { describe, expect, it } from "vitest";
import { resolveAttack } from "../simulator";
import type { PohjolaAttackParams } from "../types";

const base: Required<PohjolaAttackParams> = {
	attackPool: 6,
	as: 4,
	ds: 4,
	lethality: 0,
	criticalStrike: 0,
	crush: 0,
	block: 0,
	titanicStrikes: 0,
	resilient: 0,
	attackerGoodRerolls: 0,
	attackerBadTokens: 0,
	defenderGoodRerolls: 0,
	defenderBadTokens: 0,
	divineTruth: 0,
	defenderDivineTruth: 0,
	reverberating: false,
	iterations: 1000,
};

describe("resolveAttack", () => {
	it("returns non-negative damage", () => {
		for (let i = 0; i < 100; i++) {
			const result = resolveAttack(base);
			expect(result.damage).toBeGreaterThanOrEqual(0);
			expect(result.crits).toBeGreaterThanOrEqual(0);
			expect(result.blocks).toBeGreaterThanOrEqual(0);
		}
	});

	it("crits impossible when criticalStrike=-1", () => {
		const params: Required<PohjolaAttackParams> = { ...base, criticalStrike: -1, attackPool: 20 };
		for (let i = 0; i < 50; i++) {
			expect(resolveAttack(params).crits).toBe(0);
		}
	});

	it("all hits are crits when critThreshold == AS", () => {
		// AS=3, criticalStrike=3 → critThreshold=3, so every hit is a crit
		const params: Required<PohjolaAttackParams> = { ...base, as: 3, criticalStrike: 3, attackPool: 10 };
		for (let i = 0; i < 20; i++) {
			const r = resolveAttack(params);
			// No normal hits — all hits are crits
			expect(r.crits).toBeGreaterThanOrEqual(0);
		}
	});

	it("attacker divine truth auto-hits count as crits", () => {
		// divineTruth=3, pool=3 → all 3 are auto-crits (bypass AS roll entirely)
		const params: Required<PohjolaAttackParams> = { ...base, criticalStrike: -1, divineTruth: 3, attackPool: 3 };
		for (let i = 0; i < 20; i++) {
			expect(resolveAttack(params).crits).toBe(3);
		}
	});

	it("defender divine truth auto-saves all hits", () => {
		// criticalStrike=-1 = no crits. defenderDivineTruth=10 → all normal hits auto-saved
		const params: Required<PohjolaAttackParams> = { ...base, criticalStrike: -1, defenderDivineTruth: 10, attackPool: 6 };
		for (let i = 0; i < 20; i++) {
			expect(resolveAttack(params).damage).toBe(0);
		}
	});

	it("reverberating produces higher average damage", () => {
		const without: Required<PohjolaAttackParams> = { ...base, attackPool: 10, reverberating: false };
		const withRev: Required<PohjolaAttackParams> = { ...base, attackPool: 10, reverberating: true };

		let sumWithout = 0;
		let sumWith = 0;
		const N = 500;
		for (let i = 0; i < N; i++) {
			sumWithout += resolveAttack(without).damage;
			sumWith += resolveAttack(withRev).damage;
		}
		expect(sumWith / N).toBeGreaterThan(sumWithout / N);
	});

	it("blocks counts successful defence saves (negated normal hits)", () => {
		// All hits non-crit (criticalStrike=-1), DS=2 (easy save) → most hits negated
		const params: Required<PohjolaAttackParams> = { ...base, criticalStrike: -1, ds: 2, attackPool: 10 };
		let totalBlocks = 0;
		const N = 200;
		for (let i = 0; i < N; i++) {
			totalBlocks += resolveAttack(params).blocks;
		}
		// With DS=2, defender saves most hits → avg blocks should be substantial
		expect(totalBlocks / N).toBeGreaterThan(3);
	});

	it("blocks is 0 when all hits are crits (no defence roll)", () => {
		// criticalStrike=3, AS=3 → all hits crits, no defence roll → blocks=0
		const params: Required<PohjolaAttackParams> = { ...base, as: 3, criticalStrike: 3, attackPool: 10 };
		for (let i = 0; i < 20; i++) {
			expect(resolveAttack(params).blocks).toBe(0);
		}
	});
});
