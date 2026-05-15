import { describe, expect, it } from "vitest";
import { applyBlock, applyLethality, applyTitanic, getCritThreshold } from "../rules";

describe("getCritThreshold", () => {
	it("returns 7 (impossible) for -1", () => {
		expect(getCritThreshold(-1)).toBe(7);
	});
	it("returns 6 for 0 (only 6s)", () => {
		expect(getCritThreshold(0)).toBe(6);
	});
	it("returns 5 for 1 (5+)", () => {
		expect(getCritThreshold(1)).toBe(5);
	});
	it("returns 3 for 3 (3+)", () => {
		expect(getCritThreshold(3)).toBe(3);
	});
	it("clamps minimum to 2", () => {
		// criticalStrike=3 → 6-3=3, already ≥2
		expect(getCritThreshold(3)).toBeGreaterThanOrEqual(2);
	});
});

describe("applyTitanic", () => {
	it("no-op when 0", () => {
		expect(applyTitanic({ crits: 2, normal: 1 }, 0)).toEqual({ crits: 2, normal: 1 });
	});
	it("doubles hits at X=1", () => {
		expect(applyTitanic({ crits: 2, normal: 3 }, 1)).toEqual({ crits: 4, normal: 6 });
	});
	it("triples hits at X=2", () => {
		expect(applyTitanic({ crits: 1, normal: 1 }, 2)).toEqual({ crits: 3, normal: 3 });
	});
	it("preserves crit status", () => {
		const result = applyTitanic({ crits: 3, normal: 0 }, 1);
		expect(result.crits).toBe(6);
		expect(result.normal).toBe(0);
	});
});

describe("applyBlock", () => {
	it("effectiveBlock = block - crush, min 0", () => {
		expect(applyBlock(5, 2, 3)).toEqual({ remainingCrits: 5, blocked: 0 });
	});
	it("cancels up to effectiveBlock crits", () => {
		expect(applyBlock(5, 3, 1)).toEqual({ remainingCrits: 3, blocked: 2 });
	});
	it("cannot block more crits than exist", () => {
		expect(applyBlock(1, 3, 0)).toEqual({ remainingCrits: 0, blocked: 1 });
	});
	it("crush=0 uses full block value", () => {
		expect(applyBlock(4, 2, 0)).toEqual({ remainingCrits: 2, blocked: 2 });
	});
});

describe("applyLethality", () => {
	it("no bonus when lethality=0", () => {
		expect(applyLethality(4, 0)).toBe(4);
	});
	it("adds X per hit", () => {
		expect(applyLethality(3, 1)).toBe(6); // 3 + min(3*1, 3) = 6
	});
	it("caps bonus at base damage", () => {
		// 2 hits, lethality=3 → bonus = min(6, 2) = 2 → total 4
		expect(applyLethality(2, 3)).toBe(4);
	});
	it("zero hits produces zero", () => {
		expect(applyLethality(0, 2)).toBe(0);
	});
});
