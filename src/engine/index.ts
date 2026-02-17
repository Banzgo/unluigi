/**
 * Main entry point for the dice simulation engine
 * Export all public APIs
 */

export {
	isSuccess,
	parseDiceExpression,
	rollD3,
	rollD6,
	shouldReroll,
	shouldRerollSplit,
} from "./dice";
export type {
	CastingRerollType,
	DispelRerollType,
	MagicSimulationParameters,
	MagicSimulationResults,
} from "./magic-simulator";
export { runMagicSimulation } from "./magic-simulator";
export {
	calculateStatistics,
	getProbabilityAtLeast,
	getProbabilityExact,
} from "./probability";
export type {
	ModifierConfig,
	ModifierType,
	RerollType as ProfileRerollType,
	RollPhase,
	SpecialRule,
	UnitProfile,
} from "./profile";
export {
	calculateArmorSave,
	calculateToHit,
	calculateToWound,
	determineSpecialSave,
	profileToSimulationParams,
} from "./profile";
export { runSimulation, runSimulationWithStats } from "./simulator";
export type {
	FailureRerollType,
	HitTracker,
	HitValue,
	ProbabilityPoint,
	RerollType,
	SimulationParameters,
	SimulationResults,
	SuccessRerollType,
} from "./types";
