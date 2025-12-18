/**
 * Integration tests for the complete simulator
 */

import { describe, expect, it } from "vitest";
import { runSimulationWithStats, type SimulationParameters } from "./index";

describe("runSimulationWithStats", () => {
  // Base params with only required fields - testing the new optional interface
  const baseParams: SimulationParameters = {
    numAttacks: 10,
    toHit: 4,
    toWound: 4,
    iterations: 1000,
  };

  it("should return valid simulation results", () => {
    const results = runSimulationWithStats(baseParams);

    expect(results).toBeDefined();
    expect(results.distribution).toHaveLength(1000);
    expect(results.totalIterations).toBe(1000);
    expect(results.executionTimeMs).toBeGreaterThan(0);
  });

  it("should have reasonable statistics for basic scenario", () => {
    // 10 attacks, 4+ to hit (50%), 4+ to wound (50%), no saves
    // Expected: ~2.5 wounds average
    const params = { ...baseParams, iterations: 5000 };
    const results = runSimulationWithStats(params);

    expect(results.mean).toBeGreaterThan(2);
    expect(results.mean).toBeLessThan(3);
    expect(results.min).toBeGreaterThanOrEqual(0);
    expect(results.max).toBeLessThanOrEqual(10);
  });

  it("should account for armor saves", () => {
    const withoutArmor = runSimulationWithStats({
      ...baseParams,
      armorSave: "none",
      iterations: 5000,
    });

    const withArmor = runSimulationWithStats({
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
    const noAP = runSimulationWithStats({
      ...baseParams,
      armorSave: 4,
      armorPiercing: 0,
      iterations: 5000,
    });

    const withAP = runSimulationWithStats({
      ...baseParams,
      armorSave: 4,
      armorPiercing: 1, // Makes save 5+ instead of 4+
      iterations: 5000,
    });

    // With AP, should deal more wounds
    expect(withAP.mean).toBeGreaterThan(noAP.mean);
  });

  it("should handle reroll hits correctly", () => {
    const noReroll = runSimulationWithStats({
      ...baseParams,
      rerollHits: "none",
      iterations: 5000,
    });

    const rerollFails = runSimulationWithStats({
      ...baseParams,
      rerollHits: "fails",
      iterations: 5000,
    });

    // Rerolling failed hits should increase average wounds
    expect(rerollFails.mean).toBeGreaterThan(noReroll.mean);
  });

  it("should handle poison correctly", () => {
    const noPoison = runSimulationWithStats({
      ...baseParams,
      toWound: 6, // Hard to wound
      poison: false,
      iterations: 5000,
    });

    const withPoison = runSimulationWithStats({
      ...baseParams,
      toWound: 6,
      poison: true, // 6s to hit auto-wound
      iterations: 5000,
    });

    // Poison should significantly increase wounds when wound target is high
    expect(withPoison.mean).toBeGreaterThan(noPoison.mean);
  });

  it("should handle fury correctly", () => {
    const noFury = runSimulationWithStats({
      ...baseParams,
      fury: false,
      iterations: 5000,
    });

    const withFury = runSimulationWithStats({
      ...baseParams,
      fury: true, // 6s to hit generate 2 hits
      iterations: 5000,
    });

    // Fury should increase average wounds
    expect(withFury.mean).toBeGreaterThan(noFury.mean);
  });

  it("should handle lethal strike correctly", () => {
    const noLethal = runSimulationWithStats({
      ...baseParams,
      armorSave: 2, // Very good armor
      specialSave: 4, // Ward save
      lethalStrike: false,
      iterations: 5000,
    });

    const withLethal = runSimulationWithStats({
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
    const singleWound = runSimulationWithStats({
      ...baseParams,
      multipleWounds: 1,
      iterations: 5000,
    });

    const doubleWound = runSimulationWithStats({
      ...baseParams,
      multipleWounds: 2,
      iterations: 5000,
    });

    // Multiple wounds should roughly double the damage
    expect(doubleWound.mean).toBeGreaterThan(singleWound.mean * 1.8);
    expect(doubleWound.mean).toBeLessThan(singleWound.mean * 2.2);
  });

  it("should respect target max wounds", () => {
    const results = runSimulationWithStats({
      numAttacks: 1, // Single attack to test capping
      toHit: "auto",
      toWound: "auto",
      multipleWounds: 10, // Try to deal 10 wounds per hit
      targetMaxWounds: 3, // But target only has 3 wounds
      iterations: 1000,
    });

    // With 1 auto-hit, auto-wound, should cap at 3 wounds
    expect(results.max).toBeLessThanOrEqual(3);
    expect(results.mean).toBe(3);
  });

  it("should handle dice expressions for attacks", () => {
    const fixed = runSimulationWithStats({
      ...baseParams,
      numAttacks: 10,
      iterations: 5000,
    });

    const variable = runSimulationWithStats({
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
    const results = runSimulationWithStats({
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
    const results = runSimulationWithStats({
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
    const results = runSimulationWithStats({
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
    runSimulationWithStats({
      ...baseParams,
      iterations: 10000,
    });
    const endTime = performance.now();

    // 10k iterations should complete in under 2 seconds
    expect(endTime - startTime).toBeLessThan(2000);
  });

  it("should produce consistent results with same parameters", () => {
    // Run multiple times with high iteration count
    const results1 = runSimulationWithStats({
      ...baseParams,
      iterations: 10000,
    });
    const results2 = runSimulationWithStats({
      ...baseParams,
      iterations: 10000,
    });

    // Means should be very close (within 10%)
    const diff = Math.abs(results1.mean - results2.mean);
    const average = (results1.mean + results2.mean) / 2;
    const percentDiff = (diff / average) * 100;

    expect(percentDiff).toBeLessThan(10);
  });

  it("should handle special saves separately from armor", () => {
    const onlyArmor = runSimulationWithStats({
      ...baseParams,
      armorSave: 4,
      specialSave: "none",
      iterations: 5000,
    });

    const both = runSimulationWithStats({
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
    const results = runSimulationWithStats({
      numAttacks: "2d6",
      toHit: 3,
      rerollHits: "1s",
      toWound: 4,
      armorSave: 4,
      armorPiercing: 1,
      specialSave: 5,
      lethalStrike: true,
      iterations: 5000,
    });

    expect(results.mean).toBeGreaterThan(0);
    expect(results.mean).toBeLessThan(10);
    expect(results.distribution).toHaveLength(5000);
  });

  // Additional tests for comprehensive special rule coverage
  it("should handle reroll wounds correctly", () => {
    const noReroll = runSimulationWithStats({
      ...baseParams,
      toWound: 5, // Harder to wound
      rerollWounds: "none",
      iterations: 5000,
    });

    const rerollFails = runSimulationWithStats({
      ...baseParams,
      toWound: 5,
      rerollWounds: "fails",
      iterations: 5000,
    });

    // Rerolling failed wounds should increase average wounds
    expect(rerollFails.mean).toBeGreaterThan(noReroll.mean);
  });

  it("should handle reroll 1s for hits", () => {
    const noReroll = runSimulationWithStats({
      ...baseParams,
      toHit: 4,
      rerollHits: "none",
      iterations: 5000,
    });

    const reroll1s = runSimulationWithStats({
      ...baseParams,
      toHit: 4,
      rerollHits: "1s",
      iterations: 5000,
    });

    // Rerolling 1s should increase wounds
    expect(reroll1s.mean).toBeGreaterThan(noReroll.mean);
  });

  it("should handle reroll successes for hits", () => {
    const noReroll = runSimulationWithStats({
      ...baseParams,
      toHit: 2, // Easy to hit (5/6 chance)
      rerollHits: "none",
      iterations: 5000,
    });

    const rerollSuccesses = runSimulationWithStats({
      ...baseParams,
      toHit: 2,
      rerollHits: "successes",
      iterations: 5000,
    });

    // Rerolling successes should decrease wounds
    expect(rerollSuccesses.mean).toBeLessThan(noReroll.mean);
  });

  it("should handle reroll armor saves correctly", () => {
    const noReroll = runSimulationWithStats({
      ...baseParams,
      armorSave: 4,
      rerollArmorSaves: "none",
      iterations: 5000,
    });

    const rerollFails = runSimulationWithStats({
      ...baseParams,
      armorSave: 4,
      rerollArmorSaves: "fails",
      iterations: 5000,
    });

    // Defender rerolling failed saves should reduce wounds dealt
    expect(rerollFails.mean).toBeLessThan(noReroll.mean);
  });

  it("should handle reroll special saves correctly", () => {
    const noReroll = runSimulationWithStats({
      ...baseParams,
      specialSave: 5,
      rerollSpecialSaves: "none",
      iterations: 5000,
    });

    const rerollFails = runSimulationWithStats({
      ...baseParams,
      specialSave: 5,
      rerollSpecialSaves: "fails",
      iterations: 5000,
    });

    // Defender rerolling failed special saves should reduce wounds dealt
    expect(rerollFails.mean).toBeLessThan(noReroll.mean);
  });

  it("should combine poison and fury correctly", () => {
    const results = runSimulationWithStats({
      numAttacks: 10,
      toHit: 4,
      toWound: 5, // Hard to wound
      poison: true, // 6s to hit auto-wound
      fury: true, // 6s to hit generate extra hits
      iterations: 5000,
    });

    // With both poison and fury, 6s should auto-wound and generate extra hits
    expect(results.mean).toBeGreaterThan(1);
  });

  it("should handle lethal strike with armor piercing", () => {
    const results = runSimulationWithStats({
      numAttacks: 10,
      toHit: 4,
      toWound: 4,
      armorSave: 2, // Very good armor
      armorPiercing: 2, // AP helps but not enough
      specialSave: 4, // Ward save
      lethalStrike: true, // 6s to wound bypass everything
      iterations: 5000,
    });

    // Should still deal some wounds despite good saves
    expect(results.mean).toBeGreaterThan(0.5);
  });

  it("should handle variable multiple wounds with dice expressions", () => {
    const results = runSimulationWithStats({
      numAttacks: 5,
      toHit: "auto",
      toWound: "auto",
      multipleWounds: "d3+1", // 2-4 wounds per hit
      targetMaxWounds: 10,
      iterations: 5000,
    });

    // 5 hits with d3+1 wounds each = 10-20 wounds
    expect(results.mean).toBeGreaterThan(10);
    expect(results.mean).toBeLessThan(20);
    expect(results.min).toBeGreaterThanOrEqual(10); // 5 * 2
    expect(results.max).toBeLessThanOrEqual(20); // 5 * 4
  });

  it("should verify all optional parameters work with minimal config", () => {
    // Test that we can call with just the required fields
    const results = runSimulationWithStats({
      numAttacks: 10,
      toHit: 4,
      toWound: 4,
    });

    // Should use defaults and work correctly
    expect(results.mean).toBeGreaterThan(0);
    expect(results.distribution).toHaveLength(10000); // Default iterations
  });
});
