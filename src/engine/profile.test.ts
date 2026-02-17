// Unit tests for profile-based combat calculations

import { describe, expect, it } from "vitest";
import {
	calculateArmorSave,
	calculateToHit,
	calculateToWound,
	determineSpecialSave,
	profileToSimulationParams,
	type UnitProfile,
} from "./profile";

describe("calculateToHit", () => {
	it("should return 2+ when attacker is 4+ higher", () => {
		expect(calculateToHit(8, 4)).toBe(2);
		expect(calculateToHit(9, 4)).toBe(2);
		expect(calculateToHit(10, 4)).toBe(2);
	});

	it("should return 3+ when attacker is 1-3 higher", () => {
		expect(calculateToHit(5, 4)).toBe(3);
		expect(calculateToHit(6, 4)).toBe(3);
		expect(calculateToHit(7, 4)).toBe(3);
	});

	it("should return 4+ when skills are equal", () => {
		expect(calculateToHit(4, 4)).toBe(4);
		expect(calculateToHit(5, 5)).toBe(4);
		expect(calculateToHit(3, 3)).toBe(4);
	});

	it("should return 4+ when defender is 1-3 higher", () => {
		expect(calculateToHit(4, 5)).toBe(4);
		expect(calculateToHit(4, 6)).toBe(4);
		expect(calculateToHit(4, 7)).toBe(4);
	});

	it("should return 5+ when defender is 4+ higher", () => {
		expect(calculateToHit(4, 8)).toBe(5);
		expect(calculateToHit(3, 7)).toBe(5);
		expect(calculateToHit(4, 9)).toBe(5);
		expect(calculateToHit(4, 10)).toBe(5);
	});

	it("should handle edge cases", () => {
		// Very high attacker
		expect(calculateToHit(10, 0)).toBe(2);
		// Very high defender
		expect(calculateToHit(0, 10)).toBe(5);
		// Both very low
		expect(calculateToHit(1, 1)).toBe(4);
	});
});

describe("calculateToWound", () => {
	it("should return 4+ when strength equals resilience", () => {
		expect(calculateToWound(3, 3)).toBe(4);
		expect(calculateToWound(4, 4)).toBe(4);
		expect(calculateToWound(5, 5)).toBe(4);
	});

	it("should return easier values when strength is higher", () => {
		// S4 vs R3
		expect(calculateToWound(4, 3)).toBe(3);
		// S5 vs R3
		expect(calculateToWound(5, 3)).toBe(2);
		// S6 vs R3
		expect(calculateToWound(6, 3)).toBe(2);
		// S7 vs R3 (capped at 2+)
		expect(calculateToWound(7, 3)).toBe(2);
	});

	it("should return harder values when resilience is higher", () => {
		// S3 vs R4
		expect(calculateToWound(3, 4)).toBe(5);
		// S3 vs R5
		expect(calculateToWound(3, 5)).toBe(6);
		// S3 vs R6 (capped at 6+)
		expect(calculateToWound(3, 6)).toBe(6);
		// S3 vs R7 (capped at 6+)
		expect(calculateToWound(3, 7)).toBe(6);
	});

	it("should cap at 2+ minimum", () => {
		expect(calculateToWound(10, 3)).toBe(2);
		expect(calculateToWound(8, 2)).toBe(2);
	});

	it("should cap at 6+ maximum", () => {
		expect(calculateToWound(2, 8)).toBe(6);
		expect(calculateToWound(3, 10)).toBe(6);
	});

	it("should handle standard game scenarios", () => {
		// S4 vs T3 (common)
		expect(calculateToWound(4, 3)).toBe(3);
		// S6 vs T4 (heavy hitting)
		expect(calculateToWound(6, 4)).toBe(2);
		// S3 vs T4 (weak vs tough)
		expect(calculateToWound(3, 4)).toBe(5);
	});
});

describe("calculateArmorSave", () => {
	it("should calculate basic armor saves correctly", () => {
		// Arm 3, AP 0: 7 - 3 = 4+
		expect(calculateArmorSave(3, 0)).toBe(4);
		// Arm 4, AP 0: 7 - 4 = 3+
		expect(calculateArmorSave(4, 0)).toBe(3);
		// Arm 5, AP 0: 7 - 5 = 2+
		expect(calculateArmorSave(5, 0)).toBe(2);
	});

	it("should apply armor penetration correctly", () => {
		// Arm 4, AP 1: effective 3, 7 - 3 = 4+
		expect(calculateArmorSave(4, 1)).toBe(4);
		// Arm 5, AP 2: effective 3, 7 - 3 = 4+
		expect(calculateArmorSave(5, 2)).toBe(4);
		// Arm 3, AP 1: effective 2, 7 - 2 = 5+
		expect(calculateArmorSave(3, 1)).toBe(5);
	});

	it("should return 'none' when armor penetration exceeds armor", () => {
		expect(calculateArmorSave(3, 3)).toBe("none");
		expect(calculateArmorSave(3, 4)).toBe("none");
		expect(calculateArmorSave(2, 5)).toBe("none");
	});

	it("should return 'none' when armor is 0", () => {
		expect(calculateArmorSave(0, 0)).toBe("none");
		expect(calculateArmorSave(0, 1)).toBe("none");
	});

	it("should cap at 2+ best save", () => {
		// Arm 6, AP 0: would be 7 - 6 = 1+, caps to 2+
		expect(calculateArmorSave(6, 0)).toBe(2);
		// Arm 7, AP 0: would be 7 - 7 = 0+, caps to 2+
		expect(calculateArmorSave(7, 0)).toBe(2);
	});

	it("should cap at 6+ worst save before becoming none", () => {
		// Arm 1, AP 0: 7 - 1 = 6+
		expect(calculateArmorSave(1, 0)).toBe(6);
		// Arm 2, AP 1: effective 1, 7 - 1 = 6+
		expect(calculateArmorSave(2, 1)).toBe(6);
	});

	it("should handle negative effective armor", () => {
		expect(calculateArmorSave(1, 3)).toBe("none");
		expect(calculateArmorSave(2, 5)).toBe("none");
	});
});

describe("determineSpecialSave", () => {
	it("should return 'none' when no special saves exist", () => {
		const profile: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 4,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
		};
		expect(determineSpecialSave(profile)).toBe("none");
	});

	it("should return Aegis save when only Aegis exists", () => {
		const profile: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 4,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
			aegisSave: 5,
		};
		expect(determineSpecialSave(profile)).toBe(5);
	});

	it("should return Regeneration save when only Regen exists", () => {
		const profile: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 4,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
			regenerationSave: 6,
		};
		expect(determineSpecialSave(profile)).toBe(6);
	});

	it("should return better save when both exist and no preference", () => {
		const profile: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 4,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
			aegisSave: 5,
			regenerationSave: 6,
		};
		// Should pick Aegis (5+ is better than 6+)
		expect(determineSpecialSave(profile)).toBe(5);
	});

	it("should return better save when Regen is better", () => {
		const profile: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 4,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
			aegisSave: 6,
			regenerationSave: 4,
		};
		// Should pick Regen (4+ is better than 6+)
		expect(determineSpecialSave(profile)).toBe(4);
	});

	it("should respect preferAegis parameter", () => {
		const profile: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 4,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
			aegisSave: 6,
			regenerationSave: 4,
		};
		// Prefer Aegis even though Regen is better
		expect(determineSpecialSave(profile, true)).toBe(6);
		// Prefer Regen (default better choice)
		expect(determineSpecialSave(profile, false)).toBe(4);
	});
});

describe("profileToSimulationParams", () => {
	it("should convert basic profiles correctly", () => {
		const attacker: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 4,
			resilience: 3,
			armorPenetration: 1,
			attacks: 10,
			wounds: 1,
			armor: 3,
		};

		const defender: UnitProfile = {
			offensiveSkill: 3,
			defensiveSkill: 3,
			strength: 3,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
		};

		const params = profileToSimulationParams(attacker, defender);

		// Off 4 vs Def 3: difference = 1 → 3+
		expect(params.toHit).toBe(3);
		// Str 4 vs Res 3: difference = 1 → 3+
		expect(params.toWound).toBe(3);
		// Arm 3, AP 1: effective 2 → 7 - 2 = 5+
		expect(params.armorSave).toBe(5);
		// No special saves
		expect(params.specialSave).toBe("none");
		// 10 attacks
		expect(params.numAttacks).toBe(10);
	});

	it("should handle dice expression attacks", () => {
		const attacker: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 4,
			resilience: 3,
			armorPenetration: 0,
			attacks: "2d6",
			wounds: 1,
			armor: 3,
		};

		const defender: UnitProfile = {
			offensiveSkill: 3,
			defensiveSkill: 3,
			strength: 3,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
		};

		const params = profileToSimulationParams(attacker, defender);
		expect(params.numAttacks).toBe("2d6");
	});

	it("should map special rule: poison", () => {
		const attacker: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 3,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
			poison: true,
		};

		const defender: UnitProfile = {
			offensiveSkill: 3,
			defensiveSkill: 3,
			strength: 3,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
		};

		const params = profileToSimulationParams(attacker, defender);
		expect(params.poison).toBe(true);
	});

	it("should map special rule: lethalStrike", () => {
		const attacker: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 4,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
			lethalStrike: true,
		};

		const defender: UnitProfile = {
			offensiveSkill: 3,
			defensiveSkill: 3,
			strength: 3,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
		};

		const params = profileToSimulationParams(attacker, defender);
		expect(params.lethalStrike).toBe(true);
	});

	it("should map special rule: hatred (reroll failed hits)", () => {
		const attacker: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 4,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
			hatred: true,
		};

		const defender: UnitProfile = {
			offensiveSkill: 3,
			defensiveSkill: 3,
			strength: 3,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
		};

		const params = profileToSimulationParams(attacker, defender);
		expect(params.rerollHitFailures).toBe("all");
	});

	it("should map special rule: fury", () => {
		const attacker: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 4,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
			fury: true,
		};

		const defender: UnitProfile = {
			offensiveSkill: 3,
			defensiveSkill: 3,
			strength: 3,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
		};

		const params = profileToSimulationParams(attacker, defender);
		expect(params.fury).toBe(true);
	});

	it("should handle multiple wounds and target max wounds", () => {
		const attacker: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 5,
			resilience: 3,
			armorPenetration: 0,
			attacks: 5,
			wounds: 1,
			armor: 3,
			multipleWounds: "d3",
		};

		const defender: UnitProfile = {
			offensiveSkill: 3,
			defensiveSkill: 3,
			strength: 3,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 3, // Target has 3 wounds max
			armor: 4,
		};

		const params = profileToSimulationParams(attacker, defender);
		expect(params.multipleWounds).toBe("d3");
		expect(params.targetMaxWounds).toBe(3);
	});

	it("should handle special saves", () => {
		const attacker: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 4,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
		};

		const defender: UnitProfile = {
			offensiveSkill: 3,
			defensiveSkill: 3,
			strength: 3,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
			aegisSave: 5,
			regenerationSave: 6,
		};

		const params = profileToSimulationParams(attacker, defender);
		// Should pick better save (5+ Aegis)
		expect(params.specialSave).toBe(5);
	});

	it("should handle high AP removing armor completely", () => {
		const attacker: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 4,
			resilience: 3,
			armorPenetration: 5,
			attacks: 10,
			wounds: 1,
			armor: 3,
		};

		const defender: UnitProfile = {
			offensiveSkill: 3,
			defensiveSkill: 3,
			strength: 3,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3, // Arm 3 - AP 5 = no save
		};

		const params = profileToSimulationParams(attacker, defender);
		expect(params.armorSave).toBe("none");
	});

	it("should handle complex scenario with multiple special rules", () => {
		const attacker: UnitProfile = {
			offensiveSkill: 5,
			defensiveSkill: 3,
			strength: 5,
			resilience: 4,
			armorPenetration: 2,
			attacks: "2d6+3",
			wounds: 2,
			armor: 4,
			poison: true,
			fury: true,
			hatred: true,
		};

		const defender: UnitProfile = {
			offensiveSkill: 3,
			defensiveSkill: 4,
			strength: 4,
			resilience: 5,
			armorPenetration: 1,
			attacks: 15,
			wounds: 3,
			armor: 5,
			aegisSave: 5,
		};

		const params = profileToSimulationParams(attacker, defender);

		// Off 5 vs Def 4: difference = 1 → 3+
		expect(params.toHit).toBe(3);
		// Str 5 vs Res 5: equal → 4+
		expect(params.toWound).toBe(4);
		// Arm 5, AP 2: effective 3 → 7 - 3 = 4+
		expect(params.armorSave).toBe(4);
		// Aegis 5+
		expect(params.specialSave).toBe(5);
		// Variable attacks
		expect(params.numAttacks).toBe("2d6+3");
		// Special rules
		expect(params.poison).toBe(true);
		expect(params.fury).toBe(true);
		expect(params.rerollHitFailures).toBe("all"); // Hatred
		expect(params.targetMaxWounds).toBe(3);
	});

	it("should map special rule: autoHit", () => {
		const attacker: UnitProfile = {
			offensiveSkill: 1,
			defensiveSkill: 3,
			strength: 4,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
			autoHit: true,
		};

		const defender: UnitProfile = {
			offensiveSkill: 10,
			defensiveSkill: 10,
			strength: 3,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
		};

		const params = profileToSimulationParams(attacker, defender);
		// Should be "auto" despite terrible odds (Off 1 vs Def 10)
		expect(params.toHit).toBe("auto");
		// Normal wound roll
		expect(params.toWound).toBe(3); // Str 4 vs Res 3
	});

	it("should map special rule: autoWound", () => {
		const attacker: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 1,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
			autoWound: true,
		};

		const defender: UnitProfile = {
			offensiveSkill: 3,
			defensiveSkill: 3,
			strength: 3,
			resilience: 10,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
		};

		const params = profileToSimulationParams(attacker, defender);
		// Normal hit roll
		expect(params.toHit).toBe(3); // Off 4 vs Def 3
		// Should be "auto" despite terrible odds (Str 1 vs Res 10)
		expect(params.toWound).toBe("auto");
	});

	it("should handle both autoHit and autoWound together", () => {
		const attacker: UnitProfile = {
			offensiveSkill: 1,
			defensiveSkill: 3,
			strength: 1,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
			autoHit: true,
			autoWound: true,
		};

		const defender: UnitProfile = {
			offensiveSkill: 10,
			defensiveSkill: 10,
			strength: 10,
			resilience: 10,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
		};

		const params = profileToSimulationParams(attacker, defender);
		// Both should be "auto" despite impossible odds
		expect(params.toHit).toBe("auto");
		expect(params.toWound).toBe("auto");
	});

	it("should combine autoHit with other special rules", () => {
		const attacker: UnitProfile = {
			offensiveSkill: 4,
			defensiveSkill: 3,
			strength: 4,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
			autoHit: true,
			poison: true,
			fury: true,
		};

		const defender: UnitProfile = {
			offensiveSkill: 3,
			defensiveSkill: 3,
			strength: 3,
			resilience: 3,
			armorPenetration: 0,
			attacks: 10,
			wounds: 1,
			armor: 3,
		};

		const params = profileToSimulationParams(attacker, defender);
		expect(params.toHit).toBe("auto");
		expect(params.poison).toBe(true);
		expect(params.fury).toBe(true);
	});
});
