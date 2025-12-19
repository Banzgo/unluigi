/**
 * Unit tests for the magic phase simulator
 */

import { describe, expect, it } from "vitest";
import { type MagicSimulationParameters, runMagicSimulation } from "./magic-simulator";

describe("runMagicSimulation", () => {
	// Base params for testing
	const baseParams: MagicSimulationParameters = {
		castingDice: 3,
		dispelDice: 3,
		castingValue: 7,
		castingModifier: 0,
		dispelModifier: 0,
		magicResistance: 0,
		rerollCasting: "none",
		rerollDispel: "none",
		isBoundSpell: false,
		iterations: 10000,
	};

	it("should return valid simulation results", () => {
		const results = runMagicSimulation(baseParams);

		expect(results).toBeDefined();
		expect(results.iterations).toBe(10000);
		expect(results.executionTimeMs).toBeGreaterThan(0);
		expect(results.castingFailPercent).toBeGreaterThanOrEqual(0);
		expect(results.castingFailPercent).toBeLessThanOrEqual(100);
		expect(results.dispelSuccessPercent).toBeGreaterThanOrEqual(0);
		expect(results.dispelSuccessPercent).toBeLessThanOrEqual(100);
		expect(results.spellSuccessPercent).toBeGreaterThanOrEqual(0);
		expect(results.spellSuccessPercent).toBeLessThanOrEqual(100);
	});

	it("should have probabilities sum correctly", () => {
		const results = runMagicSimulation({ ...baseParams, iterations: 50000 });

		// Casting fail + spell success + dispel success should be ~100%
		// Allow 2% margin for simulation variance
		expect(
			Math.abs(results.spellSuccessPercent + results.dispelSuccessPercent + results.castingFailPercent - 100),
		).toBeLessThan(2);
	});

	it("should have higher casting fail rate with fewer dice", () => {
		const twoDice = runMagicSimulation({
			...baseParams,
			castingDice: 2,
			iterations: 20000,
		});

		const fiveDice = runMagicSimulation({
			...baseParams,
			castingDice: 5,
			iterations: 20000,
		});

		// Fewer dice = higher failure rate
		expect(twoDice.castingFailPercent).toBeGreaterThan(fiveDice.castingFailPercent);
	});

	it("should have higher dispel success with more dispel dice", () => {
		const threeDice = runMagicSimulation({
			...baseParams,
			dispelDice: 3,
			iterations: 20000,
		});

		const sevenDice = runMagicSimulation({
			...baseParams,
			dispelDice: 7,
			iterations: 20000,
		});

		// More dispel dice = higher dispel success
		expect(sevenDice.dispelSuccessPercent).toBeGreaterThan(threeDice.dispelSuccessPercent);
	});

	it("should have higher casting fail rate with higher casting value", () => {
		const lowCV = runMagicSimulation({
			...baseParams,
			castingValue: 5,
			iterations: 20000,
		});

		const highCV = runMagicSimulation({
			...baseParams,
			castingValue: 11,
			iterations: 20000,
		});

		// Higher CV = harder to cast = higher failure rate
		expect(highCV.castingFailPercent).toBeGreaterThan(lowCV.castingFailPercent);
	});

	it("should handle casting modifier correctly", () => {
		const noModifier = runMagicSimulation({
			...baseParams,
			castingModifier: 0,
			iterations: 20000,
		});

		const plusTwo = runMagicSimulation({
			...baseParams,
			castingModifier: 2,
			iterations: 20000,
		});

		// Positive modifier = easier to cast = lower failure rate
		expect(plusTwo.castingFailPercent).toBeLessThan(noModifier.castingFailPercent);
	});

	it("should handle negative casting modifier correctly", () => {
		const noModifier = runMagicSimulation({
			...baseParams,
			castingModifier: 0,
			iterations: 20000,
		});

		const minusOne = runMagicSimulation({
			...baseParams,
			castingModifier: -1,
			iterations: 20000,
		});

		// Negative modifier = harder to cast = higher failure rate
		expect(minusOne.castingFailPercent).toBeGreaterThan(noModifier.castingFailPercent);
	});

	it("should handle dispel modifier correctly", () => {
		const noModifier = runMagicSimulation({
			...baseParams,
			dispelModifier: 0,
			iterations: 20000,
		});

		const plusTwo = runMagicSimulation({
			...baseParams,
			dispelModifier: 2,
			iterations: 20000,
		});

		// Positive dispel modifier = easier to dispel = higher dispel success
		expect(plusTwo.dispelSuccessPercent).toBeGreaterThan(noModifier.dispelSuccessPercent);
	});

	it("should handle magic resistance correctly", () => {
		const noResistance = runMagicSimulation({
			...baseParams,
			magicResistance: 0,
			iterations: 20000,
		});

		const maxResistance = runMagicSimulation({
			...baseParams,
			magicResistance: 3,
			iterations: 20000,
		});

		// Magic resistance makes casting harder (subtracts from roll)
		// AND makes dispelling easier (lower casting total to beat)
		expect(maxResistance.castingFailPercent).toBeGreaterThan(noResistance.castingFailPercent);
		expect(maxResistance.spellSuccessPercent).toBeLessThan(noResistance.spellSuccessPercent);
	});

	it("should handle reroll casting 1s correctly", () => {
		const noReroll = runMagicSimulation({
			...baseParams,
			rerollCasting: "none",
			iterations: 20000,
		});

		const reroll1s = runMagicSimulation({
			...baseParams,
			rerollCasting: "1s",
			iterations: 20000,
		});

		// Rerolling 1s should reduce casting failures
		expect(reroll1s.castingFailPercent).toBeLessThan(noReroll.castingFailPercent);
	});

	it("should handle reroll casting all correctly", () => {
		const noReroll = runMagicSimulation({
			...baseParams,
			rerollCasting: "none",
			iterations: 20000,
		});

		const rerollAll = runMagicSimulation({
			...baseParams,
			rerollCasting: "all",
			iterations: 20000,
		});

		// Rerolling all dice averages out the distribution
		// With 3d6 CV 7, rerolling all should actually increase failures
		// because we're replacing potentially good rolls with average ones
		// Let's just verify it's different
		expect(rerollAll.castingFailPercent).not.toBeCloseTo(noReroll.castingFailPercent, 1);
	});

	it("should handle reroll dispel all correctly", () => {
		const noReroll = runMagicSimulation({
			...baseParams,
			rerollDispel: "none",
			iterations: 20000,
		});

		const rerollAll = runMagicSimulation({
			...baseParams,
			rerollDispel: "all",
			iterations: 20000,
		});

		// Rerolling dispel dice should change dispel success rate
		expect(rerollAll.dispelSuccessPercent).not.toBeCloseTo(noReroll.dispelSuccessPercent, 1);
	});

	it("should handle extreme case: easy spell with no dispel", () => {
		const results = runMagicSimulation({
			castingDice: 5,
			dispelDice: 1,
			castingValue: 5,
			castingModifier: 2,
			dispelModifier: -1,
			magicResistance: 0,
			rerollCasting: "1s",
			rerollDispel: "none",
			iterations: 10000,
		});

		// Easy spell should almost always be cast
		expect(results.castingFailPercent).toBeLessThan(1);
		// High spell success rate
		expect(results.spellSuccessPercent).toBeGreaterThan(80);
	});

	it("should handle extreme case: hard spell with strong dispel", () => {
		const results = runMagicSimulation({
			castingDice: 2,
			dispelDice: 7,
			castingValue: 11,
			castingModifier: -1,
			dispelModifier: 2,
			magicResistance: 3,
			rerollCasting: "none",
			rerollDispel: "all",
			iterations: 10000,
		});

		// Hard spell should often fail to cast
		expect(results.castingFailPercent).toBeGreaterThan(90);
		// Very low spell success rate
		expect(results.spellSuccessPercent).toBeLessThan(5);
	});

	it("should run efficiently", () => {
		const startTime = performance.now();
		runMagicSimulation({
			...baseParams,
			iterations: 50000,
		});
		const endTime = performance.now();

		// 50k iterations should complete in under 2 seconds
		expect(endTime - startTime).toBeLessThan(2000);
	});

	it("should produce consistent results", () => {
		const results1 = runMagicSimulation({
			...baseParams,
			iterations: 50000,
		});

		const results2 = runMagicSimulation({
			...baseParams,
			iterations: 50000,
		});

		// Results should be within 3% of each other
		expect(Math.abs(results1.castingFailPercent - results2.castingFailPercent)).toBeLessThan(3);
		expect(Math.abs(results1.spellSuccessPercent - results2.spellSuccessPercent)).toBeLessThan(3);
	});

	it("should handle CV 5 with 2 dice correctly", () => {
		// 2d6 >= 5: theoretical probability is ~83.3%
		const results = runMagicSimulation({
			...baseParams,
			castingDice: 2,
			dispelDice: 1, // Minimal dispel
			castingValue: 5,
			iterations: 50000,
		});

		// Casting success should be around 83%
		expect(results.castingFailPercent).toBeGreaterThan(14);
		expect(results.castingFailPercent).toBeLessThan(20);
	});

	it("should handle balanced scenario correctly", () => {
		// Same dice on both sides, should be roughly 50/50 dispel when cast succeeds
		const results = runMagicSimulation({
			castingDice: 3,
			dispelDice: 3,
			castingValue: 7,
			castingModifier: 0,
			dispelModifier: 0,
			magicResistance: 0,
			rerollCasting: "none",
			rerollDispel: "none",
			iterations: 50000,
		});

		// Dispel success should be around 40-60% (dispel needs >= casting total)
		expect(results.dispelSuccessPercent).toBeGreaterThan(35);
		expect(results.dispelSuccessPercent).toBeLessThan(65);
	});

	it("should handle minimum inputs", () => {
		const results = runMagicSimulation({
			castingDice: 2,
			dispelDice: 1,
			castingValue: 5,
			castingModifier: -1,
			dispelModifier: -1,
			magicResistance: 0,
			rerollCasting: "none",
			rerollDispel: "none",
			iterations: 5000,
		});

		expect(results.castingFailPercent).toBeGreaterThanOrEqual(0);
		expect(results.spellSuccessPercent).toBeGreaterThanOrEqual(0);
	});

	it("should handle maximum inputs", () => {
		const results = runMagicSimulation({
			castingDice: 5,
			dispelDice: 7,
			castingValue: 11,
			castingModifier: 2,
			dispelModifier: 2,
			magicResistance: 3,
			rerollCasting: "all",
			rerollDispel: "all",
			iterations: 5000,
		});

		expect(results.castingFailPercent).toBeGreaterThanOrEqual(0);
		expect(results.spellSuccessPercent).toBeGreaterThanOrEqual(0);
	});

	describe("bound spells", () => {
		it("should have higher fail rate than regular spells", () => {
			const regularSpell = runMagicSimulation({
				...baseParams,
				castingDice: 4,
				castingValue: 9,
				isBoundSpell: false,
				iterations: 20000,
			});

			const boundSpell = runMagicSimulation({
				...baseParams,
				castingDice: 4,
				castingValue: 9,
				isBoundSpell: true,
				iterations: 20000,
			});

			// Bound spells (1d6+3d3) have lower average than regular (4d6)
			expect(boundSpell.castingFailPercent).toBeGreaterThan(regularSpell.castingFailPercent);
		});

		it("should work with rerolls", () => {
			const results = runMagicSimulation({
				...baseParams,
				castingDice: 3,
				castingValue: 7,
				isBoundSpell: true,
				rerollCasting: "1s",
				iterations: 10000,
			});

			expect(results).toBeDefined();
			expect(results.castingFailPercent).toBeGreaterThanOrEqual(0);
			expect(results.castingFailPercent).toBeLessThanOrEqual(100);
		});

		it("should handle edge case of 2 dice bound spell", () => {
			const results = runMagicSimulation({
				...baseParams,
				castingDice: 2,
				castingValue: 5,
				isBoundSpell: true,
				iterations: 10000,
			});

			// 1d6+1d3 should have reasonable success rate for CV 5
			expect(results.castingFailPercent).toBeGreaterThan(20);
			expect(results.castingFailPercent).toBeLessThan(60);
		});

		it("should produce lower casting totals on average", () => {
			const regularResults = runMagicSimulation({
				...baseParams,
				castingDice: 5,
				castingValue: 15,
				isBoundSpell: false,
				iterations: 20000,
			});

			const boundResults = runMagicSimulation({
				...baseParams,
				castingDice: 5,
				castingValue: 15,
				isBoundSpell: true,
				iterations: 20000,
			});

			// Bound spell should have much higher failure rate for high CV
			expect(boundResults.castingFailPercent).toBeGreaterThan(regularResults.castingFailPercent + 20);
		});
	});
});
