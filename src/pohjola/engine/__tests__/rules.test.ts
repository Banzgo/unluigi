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
	it("adds X flat normal hits — 2 hits + X=1 → 3 hits", () => {
		expect(applyTitanic({ crits: 0, normal: 2 }, 1)).toEqual({ crits: 0, normal: 3 });
	});
	it("adds X to normals, crits unchanged", () => {
		expect(applyTitanic({ crits: 2, normal: 3 }, 1)).toEqual({ crits: 2, normal: 4 });
	});
	it("adds X=2 flat normal hits", () => {
		expect(applyTitanic({ crits: 1, normal: 1 }, 2)).toEqual({ crits: 1, normal: 3 });
	});
	it("no bonus on complete miss", () => {
		expect(applyTitanic({ crits: 0, normal: 0 }, 2)).toEqual({ crits: 0, normal: 0 });
	});
	it("can at most double the total number of hits + crits", () => {
		expect(applyTitanic({ crits: 1, normal: 1 }, 5)).toEqual({ crits: 1, normal: 3 });
	});
	it("preserves crits, adds normal bonus even when no normals", () => {
		const result = applyTitanic({ crits: 3, normal: 0 }, 1);
		expect(result.crits).toBe(3);
		expect(result.normal).toBe(1);
	});
});

describe("applyBlock", () => {
	it("effectiveBlock = block - crush, min 0", () => {
		expect(applyBlock(5, 2, 3)).toEqual({ remainingCrits: 5, convertedToNormal: 0 });
	});
	it("converts up to effectiveBlock crits to normals", () => {
		expect(applyBlock(5, 3, 1)).toEqual({ remainingCrits: 3, convertedToNormal: 2 });
	});
	it("cannot convert more crits than exist", () => {
		expect(applyBlock(1, 3, 0)).toEqual({ remainingCrits: 0, convertedToNormal: 1 });
	});
	it("crush=0 uses full block value", () => {
		expect(applyBlock(4, 2, 0)).toEqual({ remainingCrits: 2, convertedToNormal: 2 });
	});
});

describe("applyLethality", () => {
	it("no bonus when lethality=0", () => {
		expect(applyLethality(4, 0)).toBe(4);
	});
	it("adds flat X hits to pool", () => {
		expect(applyLethality(3, 1)).toBe(4); // 3 + 1
		expect(applyLethality(3, 2)).toBe(5); // 3 + 2
	});
	it("Adds at most double the total damage", () => {
		expect(applyLethality(2, 3)).toBe(4); // 2 + 2
	});
	it("zero hits produces zero (no lethality without hits)", () => {
		expect(applyLethality(0, 2)).toBe(0);
	});
});
