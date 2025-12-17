/**
 * Integration tests for the complete simulator
 */

import { describe, expect, it } from "vitest";
import { runSimulation, type SimulationParameters } from "./index";

describe("runSimulation", () => {
  const baseParams: SimulationParameters = {
    numAttacks: 10,
    toHit: 4,
    rerollHits: "none",
    toWound: 4,
    rerollWounds: "none",
    armorSave: "none",
    armorPiercing: 0,
    rerollArmorSaves: "none",
    specialSave: "none",
    rerollSpecialSaves: "none",
    poison: false,
    lethalStrike: false,
    fury: false,
    multipleWounds: 1,
    targetMaxWounds: 10,
    iterations: 1000,
  };

  it("should return valid simulation results", () => {
    const results = runSimulation(baseParams);

    expect(results).toBeDefined();
    expect(results.distribution).toHaveLength(1000);
    expect(results.totalIterations).toBe(1000);
    expect(results.executionTimeMs).toBeGreaterThan(0);
  });

  it("should have reasonable statistics for basic scenario", () => {
    // 10 attacks, 4+ to hit (50%), 4+ to wound (50%), no saves
    // Expected: ~2.5 wounds average
    const params = { ...baseParams, iterations: 5000 };
    const results = runSimulation(params);

    expect(results.mean).toBeGreaterThan(2);
    expect(results.mean).toBeLessThan(3);
    expect(results.min).toBeGreaterThanOrEqual(0);
    expect(results.max).toBeLessThanOrEqual(10);
  });

  it("should account for armor saves", () => {
    const withoutArmor = runSimulation({
      ...baseParams,
      armorSave: "none",
      iterations: 5000,
    });

    const withArmor = runSimulation({
      ...baseParams,
      armorSave: 4, // 4+ armor save (50% save)
      iterations: 5000,
    });

    // With armor saves, should deal approximately half the wounds
    expect(withArmor.mean).toBeLessThan(withoutArmor.mean);
    expect(withArmor.mean).toBeGreaterThan(0.5);
    expect(withArmor.mean).toBeLessThan(1.5);
  });

  it("should handle armor piercing correctly", () => {
    const noAP = runSimulation({
      ...baseParams,
      armorSave: 4,
      armorPiercing: 0,
      iterations: 5000,
    });

    const withAP = runSimulation({
      ...baseParams,
      armorSave: 4,
      armorPiercing: 1, // Makes save 5+ instead of 4+
      iterations: 5000,
    });

    // With AP, should deal more wounds
    expect(withAP.mean).toBeGreaterThan(noAP.mean);
  });

  it("should handle reroll hits correctly", () => {
    const noReroll = runSimulation({
      ...baseParams,
      rerollHits: "none",
      iterations: 5000,
    });

    const rerollFails = runSimulation({
      ...baseParams,
      rerollHits: "fails",
      iterations: 5000,
    });

    // Rerolling failed hits should increase average wounds
    expect(rerollFails.mean).toBeGreaterThan(noReroll.mean);
  });

  it("should handle poison correctly", () => {
    const noPoison = runSimulation({
      ...baseParams,
      toWound: 6, // Hard to wound
      poison: false,
      iterations: 5000,
    });

    const withPoison = runSimulation({
      ...baseParams,
      toWound: 6,
      poison: true, // 6s to hit auto-wound
      iterations: 5000,
    });

    // Poison should significantly increase wounds when wound target is high
    expect(withPoison.mean).toBeGreaterThan(noPoison.mean);
  });

  it("should handle fury correctly", () => {
    const noFury = runSimulation({
      ...baseParams,
      fury: false,
      iterations: 5000,
    });

    const withFury = runSimulation({
      ...baseParams,
      fury: true, // 6s to hit generate 2 hits
      iterations: 5000,
    });

    // Fury should increase average wounds
    expect(withFury.mean).toBeGreaterThan(noFury.mean);
  });

  it("should handle lethal strike correctly", () => {
    const noLethal = runSimulation({
      ...baseParams,
      armorSave: 2, // Very good armor
      specialSave: 4, // Ward save
      lethalStrike: false,
      iterations: 5000,
    });

    const withLethal = runSimulation({
      ...baseParams,
      armorSave: 2,
      specialSave: 4,
      lethalStrike: true, // 6s to wound bypass all saves
      iterations: 5000,
    });

    // Lethal strike should increase wounds when saves are good
    expect(withLethal.mean).toBeGreaterThan(noLethal.mean);
  });

  it("should handle multiple wounds correctly", () => {
    const singleWound = runSimulation({
      ...baseParams,
      multipleWounds: 1,
      iterations: 5000,
    });

    const doubleWound = runSimulation({
      ...baseParams,
      multipleWounds: 2,
      iterations: 5000,
    });

    // Multiple wounds should roughly double the damage
    expect(doubleWound.mean).toBeGreaterThan(singleWound.mean * 1.8);
    expect(doubleWound.mean).toBeLessThan(singleWound.mean * 2.2);
  });

  it("should respect target max wounds", () => {
    const results = runSimulation({
      ...baseParams,
      multipleWounds: 10, // Try to deal 10 wounds per hit
      targetMaxWounds: 3, // But target only has 3 wounds
      iterations: 1000,
    });

    // Should never exceed target max wounds
    expect(results.max).toBeLessThanOrEqual(3);
  });

  it("should handle dice expressions for attacks", () => {
    const fixed = runSimulation({
      ...baseParams,
      numAttacks: 10,
      iterations: 5000,
    });

    const variable = runSimulation({
      ...baseParams,
      numAttacks: "2d6", // 2-12 attacks
      iterations: 5000,
    });

    // Variable attacks should have similar but different results
    expect(variable.mean).toBeGreaterThan(1);
    expect(variable.mean).toBeLessThan(5);
    // Both should have reasonable ranges
    expect(variable.max - variable.min).toBeGreaterThan(0);
    expect(fixed.max - fixed.min).toBeGreaterThanOrEqual(0);
  });

  it("should handle dice expressions for multiple wounds", () => {
    const results = runSimulation({
      ...baseParams,
      numAttacks: 1,
      toHit: "auto",
      toWound: "auto",
      armorSave: "none",
      multipleWounds: "d3", // 1-3 wounds per hit
      iterations: 1000,
    });

    // With 1 auto-hit, auto-wound, should get 1-3 wounds
    expect(results.min).toBeGreaterThanOrEqual(1);
    expect(results.max).toBeLessThanOrEqual(3);
  });

  it("should handle auto-hit and auto-wound", () => {
    const results = runSimulation({
      ...baseParams,
      numAttacks: 10,
      toHit: "auto",
      toWound: "auto",
      armorSave: "none",
      iterations: 1000,
    });

    // 10 auto-hit, auto-wound, no saves = always 10 wounds
    expect(results.mean).toBe(10);
    expect(results.min).toBe(10);
    expect(results.max).toBe(10);
  });

  it("should handle impossible scenarios", () => {
    const results = runSimulation({
      ...baseParams,
      toHit: "none", // Can't hit
      iterations: 1000,
    });

    // Should never deal damage
    expect(results.mean).toBe(0);
    expect(results.max).toBe(0);
  });

  it("should run efficiently", () => {
    const startTime = performance.now();
    runSimulation({
      ...baseParams,
      iterations: 10000,
    });
    const endTime = performance.now();

    // 10k iterations should complete in under 2 seconds
    expect(endTime - startTime).toBeLessThan(2000);
  });

  it("should produce consistent results with same parameters", () => {
    // Run multiple times with high iteration count
    const results1 = runSimulation({ ...baseParams, iterations: 10000 });
    const results2 = runSimulation({ ...baseParams, iterations: 10000 });

    // Means should be very close (within 10%)
    const diff = Math.abs(results1.mean - results2.mean);
    const average = (results1.mean + results2.mean) / 2;
    const percentDiff = (diff / average) * 100;

    expect(percentDiff).toBeLessThan(10);
  });

  it("should handle special saves separately from armor", () => {
    const onlyArmor = runSimulation({
      ...baseParams,
      armorSave: 4,
      specialSave: "none",
      iterations: 5000,
    });

    const both = runSimulation({
      ...baseParams,
      armorSave: 4,
      specialSave: 4,
      iterations: 5000,
    });

    // With both saves, should deal fewer wounds
    expect(both.mean).toBeLessThan(onlyArmor.mean);
  });

  it("should handle complex scenario correctly", () => {
    // Complex realistic scenario
    const results = runSimulation({
      numAttacks: "2d6",
      toHit: 3,
      rerollHits: "1s",
      toWound: 4,
      rerollWounds: "none",
      armorSave: 4,
      armorPiercing: 1,
      rerollArmorSaves: "none",
      specialSave: 5,
      rerollSpecialSaves: "none",
      poison: false,
      lethalStrike: true,
      fury: false,
      multipleWounds: 1,
      targetMaxWounds: 10,
      iterations: 5000,
    });

    expect(results.mean).toBeGreaterThan(0);
    expect(results.mean).toBeLessThan(10);
    expect(results.distribution).toHaveLength(5000);
  });
});
