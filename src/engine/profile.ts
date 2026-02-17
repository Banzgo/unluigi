// Profile-based combat system for The Ninth Age

import type { FailureRerollType, HitValue, SimulationParameters } from "./types";

/**
 * Special rule phases that can be affected by modifiers
 */
export type RollPhase = "hit" | "wound" | "armorSave" | "specialSave";

/**
 * Types of rerolls that can be applied
 */
export type RerollType = "failed" | "1s" | "successful" | "all";

/**
 * Modifier operations for numerical changes
 */
export type ModifierType = "add" | "multiply" | "divide" | "set";

/**
 * Modifier configuration for special rules
 */
export interface ModifierConfig {
	operation: ModifierType;
	value: number;
	restriction?: {
		type: "min" | "max";
		value: number;
	};
}

/**
 * Special rule that can affect combat
 */
export interface SpecialRule {
	name: string;
	targetPhases: RollPhase[];
	effect: {
		type: "reroll" | "modifier" | "special";
		reroll?: RerollType;
		modifier?: ModifierConfig;
		special?: {
			ability: "poison" | "poisonOn5Plus" | "lethalStrike" | "fury" | "redFury";
		};
	};
	condition?: string; // For complex conditions (future use)
}

/**
 * Unit profile with all combat stats and special rules
 */
export interface UnitProfile {
	// Combat stats
	offensiveSkill: number; // Off - used for to-hit
	defensiveSkill: number; // Def - used for to-hit (defender)
	strength: number; // Str - used for to-wound
	resilience: number; // Res - used for to-wound (defender)
	armorPenetration: number; // AP - reduces defender's armor
	attacks: string | number; // Att - number or dice expression

	// Defensive stats
	wounds: number; // HP - maximum wounds the model has
	armor: number; // Arm - raw armor value (converted to save)
	aegisSave?: number; // Optional: 2-6 (e.g., 5 means "5+ Aegis")
	regenerationSave?: number; // Optional: 2-6 (e.g., 6 means "6+ Regen")

	// Simple special rules (V1 approach - direct boolean flags)
	poison?: boolean;
	poisonOn5Plus?: boolean;
	lethalStrike?: boolean;
	fury?: boolean;
	redFury?: boolean;
	multipleWounds?: string | number;
	hatred?: boolean; // Reroll failed to-hit rolls
	autoHit?: boolean; // Always hits (no roll needed)
	autoWound?: boolean; // Always wounds (no roll needed)

	// Structured special rules (V2 approach - for future expansion)
	specialRules?: SpecialRule[];

	// Future-proofing (not used in combat calculations yet)
	discipline?: number;
	agility?: number;

	// Optional label
	name?: string;
}

/**
 * Calculate to-hit value based on offensive skill vs defensive skill
 *
 * @param attackerOff - Attacker's offensive skill
 * @param defenderDef - Defender's defensive skill
 * @returns The target number needed to hit (2-6+)
 *
 * Rules:
 * - Attacker 4+ higher: 2+
 * - Attacker 1-3 higher: 3+
 * - Equal or defender 1-3 higher: 4+
 * - Defender 4+ higher: 5+
 */
export function calculateToHit(attackerOff: number, defenderDef: number): HitValue {
	const difference = attackerOff - defenderDef;

	if (difference >= 4) return 2; // Attacker 4+ higher
	if (difference > 0) return 3; // Attacker 1-3 higher
	if (difference > -4) return 4; // Equal or defender 1-3 higher
	return 5; // Defender 4+ higher
}

/**
 * Calculate to-wound value based on strength vs resilience
 *
 * @param attackerStr - Attacker's strength
 * @param defenderRes - Defender's resilience
 * @returns The target number needed to wound (2-6+)
 *
 * Rules:
 * - Base is 4+
 * - +1 easier for each point of Strength above Resilience (min 2+)
 * - -1 harder for each point of Resilience above Strength (max 6+)
 */
export function calculateToWound(attackerStr: number, defenderRes: number): HitValue {
	if (attackerStr === defenderRes) return 4;

	const difference = attackerStr - defenderRes;

	// Strength higher: easier to wound (+1 per point, max 2+)
	if (difference > 0) {
		return Math.max(2, 4 - difference) as HitValue;
	}

	// Resilience higher: harder to wound (-1 per point, max 6+)
	return Math.min(6, 4 - difference) as HitValue;
}

/**
 * Calculate armor save value based on armor minus armor penetration
 *
 * @param defenderArm - Defender's armor value
 * @param attackerAP - Attacker's armor penetration
 * @returns The target number needed to save (2-6+) or 'none'
 *
 * Rules:
 * - Effective armor = armor - AP
 * - Armor save = 7 - effective armor
 * - Minimum: 2+ (best save)
 * - Maximum: 6+ (worst save)
 * - Returns 'none' if effective armor <= 0
 */
export function calculateArmorSave(defenderArm: number, attackerAP: number): HitValue {
	const effectiveArmor = defenderArm - attackerAP;

	// No armor left after AP
	if (effectiveArmor <= 0) return "none";

	// Armor save formula: 7 - effectiveArmor
	const armorSave = 7 - effectiveArmor;

	// Cap at 6+ (worst possible save)
	if (armorSave > 6) return "none";

	// Cap at 2+ (best possible save)
	return Math.max(2, armorSave) as HitValue;
}

/**
 * Determine special save from profile (Aegis or Regeneration)
 *
 * @param profile - Unit profile with potential special saves
 * @param preferAegis - If both saves available, prefer Aegis (default: auto-select best)
 * @returns The special save value (2-6+) or 'none'
 *
 * Rules:
 * - A model can have both Aegis and Regeneration
 * - Only one can be used per wound
 * - Auto-select the better save (lower number) by default
 * - Special rules may force one type (e.g., Divine Attacks prevents Aegis)
 */
export function determineSpecialSave(profile: UnitProfile, preferAegis?: boolean): HitValue {
	const hasAegis = profile.aegisSave !== undefined;
	const hasRegen = profile.regenerationSave !== undefined;

	// No special saves
	if (!hasAegis && !hasRegen) return "none";

	// Only one available
	if (hasAegis && !hasRegen) return profile.aegisSave as HitValue;
	if (hasRegen && !hasAegis) return profile.regenerationSave as HitValue;

	// Both available - choose based on strategy or special rules
	if (preferAegis !== undefined) {
		return preferAegis ? (profile.aegisSave as HitValue) : (profile.regenerationSave as HitValue);
	}

	// Auto-select better save (lower number is better)
	return Math.min(profile.aegisSave as number, profile.regenerationSave as number) as HitValue;
}

/**
 * Convert unit profiles to simulation parameters
 *
 * @param attacker - Attacker's unit profile
 * @param defender - Defender's unit profile
 * @returns Simulation parameters ready for the combat simulator
 */
export function profileToSimulationParams(attacker: UnitProfile, defender: UnitProfile): SimulationParameters {
	// Calculate base values from profiles
	// If autoHit/autoWound are set, override calculated values with "auto"
	const toHit = attacker.autoHit ? "auto" : calculateToHit(attacker.offensiveSkill, defender.defensiveSkill);
	const toWound = attacker.autoWound ? "auto" : calculateToWound(attacker.strength, defender.resilience);
	const armorSave = calculateArmorSave(defender.armor, attacker.armorPenetration);
	const specialSave = determineSpecialSave(defender);

	// Map boolean special rules to reroll mechanics
	const rerollHitFailures: FailureRerollType = attacker.hatred ? "all" : "none";

	return {
		// Attack configuration
		numAttacks: attacker.attacks,
		toHit,
		toWound,
		armorSave,
		specialSave,

		// Rerolls
		rerollHitFailures,
		rerollWoundFailures: "none", // TODO: map from special rules
		rerollArmorSaveFailures: "none", // TODO: map from defender special rules

		// Attacker special rules (direct mapping)
		poison: attacker.poison,
		poisonOn5Plus: attacker.poisonOn5Plus,
		lethalStrike: attacker.lethalStrike,
		fury: attacker.fury,
		redFury: attacker.redFury,
		multipleWounds: attacker.multipleWounds,
		targetMaxWounds: defender.wounds,
	};
}
