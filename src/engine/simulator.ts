/**
 * Core simulation engine for The Ninth Age dice simulator
 */

import { isSuccess, parseDiceExpression, rollD6, shouldReroll } from "./dice";
import { calculateStatistics } from "./probability";
import type {
  HitTracker,
  SimulationParameters,
  SimulationResults,
} from "./types";

/**
 * Run the complete simulation with the given parameters
 * @param params Simulation parameters
 * @returns Simulation results with statistics and distribution
 */
export function runSimulation(params: SimulationParameters): SimulationResults {
  const startTime = performance.now();

  const distribution: number[] = [];

  for (let i = 0; i < params.iterations; i++) {
    const wounds = simulateSingleSequence(params);
    distribution.push(wounds);
  }

  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  return calculateStatistics(distribution, params.iterations, executionTimeMs);
}

/**
 * Simulate a single attack sequence
 * @param params Simulation parameters
 * @returns Number of wounds dealt
 */
function simulateSingleSequence(params: SimulationParameters): number {
  // Phase 0: Determine number of attacks
  const numAttacks = parseDiceExpression(params.numAttacks);

  // Phase 1: To-Hit Rolls
  const hitTrackers = rollToHit(numAttacks, params);

  // Phase 2: To-Wound Rolls
  const woundTrackers = rollToWound(hitTrackers, params);

  // Phase 3: Armor Saves
  const unsavedAfterArmor = rollArmorSaves(woundTrackers, params);

  // Phase 4: Special Saves (Ward/Regen)
  const unsavedAfterSpecial = rollSpecialSaves(unsavedAfterArmor, params);

  // Phase 5: Apply Multiple Wounds
  const totalWounds = applyMultipleWounds(unsavedAfterSpecial, params);

  return totalWounds;
}

/**
 * Phase 1: Roll to hit
 * @param numAttacks Number of attacks
 * @param params Simulation parameters
 * @returns Array of hit trackers for successful hits
 */
function rollToHit(
  numAttacks: number,
  params: SimulationParameters
): HitTracker[] {
  const hits: HitTracker[] = [];

  for (let i = 0; i < numAttacks; i++) {
    let roll = rollD6();
    const unmodifiedRoll = roll;

    // Check for rerolls
    if (shouldReroll(roll, params.toHit, params.rerollHits)) {
      roll = rollD6();
    }

    // Check if hit succeeded
    if (isSuccess(roll, params.toHit)) {
      const tracker: HitTracker = {
        isPoison: params.poison && unmodifiedRoll === 6,
        isLethal: false, // Set during wound phase
      };

      hits.push(tracker);

      // Fury: 6s generate an additional hit
      if (params.fury && unmodifiedRoll === 6) {
        hits.push({ isPoison: false, isLethal: false });
      }
    }
  }

  return hits;
}

/**
 * Phase 2: Roll to wound
 * @param hitTrackers Array of hit trackers from to-hit phase
 * @param params Simulation parameters
 * @returns Array of wound trackers for successful wounds
 */
function rollToWound(
  hitTrackers: HitTracker[],
  params: SimulationParameters
): HitTracker[] {
  const wounds: HitTracker[] = [];

  for (const hit of hitTrackers) {
    // Poison hits auto-wound
    if (hit.isPoison) {
      wounds.push(hit);
      continue;
    }

    let roll = rollD6();
    const unmodifiedRoll = roll;

    // Check for rerolls
    if (shouldReroll(roll, params.toWound, params.rerollWounds)) {
      roll = rollD6();
    }

    // Check if wound succeeded
    if (isSuccess(roll, params.toWound)) {
      const tracker: HitTracker = {
        isPoison: hit.isPoison,
        isLethal: params.lethalStrike && unmodifiedRoll === 6,
      };
      wounds.push(tracker);
    }
  }

  return wounds;
}

/**
 * Phase 3: Roll armor saves
 * @param woundTrackers Array of wound trackers from to-wound phase
 * @param params Simulation parameters
 * @returns Array of wound trackers that failed armor saves
 */
function rollArmorSaves(
  woundTrackers: HitTracker[],
  params: SimulationParameters
): HitTracker[] {
  const unsavedWounds: HitTracker[] = [];

  for (const wound of woundTrackers) {
    // Lethal Strike bypasses all saves
    if (wound.isLethal) {
      unsavedWounds.push(wound);
      continue;
    }

    // Check if armor save is possible
    if (params.armorSave === "none") {
      unsavedWounds.push(wound);
      continue;
    }

    if (params.armorSave === "auto") {
      // Auto-save, wound is negated
      continue;
    }

    // Calculate modified armor save
    const modifiedArmorSave = Math.min(
      7,
      params.armorSave + params.armorPiercing
    );

    // If modified save is 7+, it's impossible
    if (modifiedArmorSave > 6) {
      unsavedWounds.push(wound);
      continue;
    }

    let roll = rollD6();

    // Check for rerolls (defender's perspective)
    if (shouldReroll(roll, modifiedArmorSave, params.rerollArmorSaves)) {
      roll = rollD6();
    }

    // Check if save failed
    if (!isSuccess(roll, modifiedArmorSave)) {
      unsavedWounds.push(wound);
    }
  }

  return unsavedWounds;
}

/**
 * Phase 4: Roll special saves (Ward/Regen)
 * @param woundTrackers Array of wound trackers that failed armor saves
 * @param params Simulation parameters
 * @returns Array of wound trackers that failed special saves
 */
function rollSpecialSaves(
  woundTrackers: HitTracker[],
  params: SimulationParameters
): HitTracker[] {
  const unsavedWounds: HitTracker[] = [];

  for (const wound of woundTrackers) {
    // Lethal Strike bypasses all saves (including special)
    if (wound.isLethal) {
      unsavedWounds.push(wound);
      continue;
    }

    // Check if special save is possible
    if (params.specialSave === "none") {
      unsavedWounds.push(wound);
      continue;
    }

    if (params.specialSave === "auto") {
      // Auto-save, wound is negated
      continue;
    }

    let roll = rollD6();

    // Check for rerolls (defender's perspective)
    if (shouldReroll(roll, params.specialSave, params.rerollSpecialSaves)) {
      roll = rollD6();
    }

    // Check if save failed
    if (!isSuccess(roll, params.specialSave)) {
      unsavedWounds.push(wound);
    }
  }

  return unsavedWounds;
}

/**
 * Phase 5: Apply multiple wounds
 * @param woundTrackers Array of wound trackers that passed all saves
 * @param params Simulation parameters
 * @returns Total number of wounds dealt
 */
function applyMultipleWounds(
  woundTrackers: HitTracker[],
  params: SimulationParameters
): number {
  let totalWounds = 0;

  for (const _wound of woundTrackers) {
    const woundsPerHit = parseDiceExpression(params.multipleWounds);
    // Cap each individual hit's wounds, but not the total across all hits
    const cappedWounds = Math.min(woundsPerHit, params.targetMaxWounds);
    totalWounds += cappedWounds;
  }

  return totalWounds;
}
