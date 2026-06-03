export { parseDiceExpression } from "./dice";
export type {
	CastingRerollType,
	DispelRerollType,
	MagicSimulationResults,
} from "./magic-simulator";
export { runMagicSimulation } from "./magic-simulator";
export { calculateStatistics } from "./probability";
export type { UnitProfile } from "./profile";
export {
	calculateArmorSave,
	calculateToHit,
	calculateToWound,
	profileToSimulationParams,
} from "./profile";
export { runSimulation, runSimulationWithStats } from "./simulator";
export type {
	FailureRerollType,
	SimulationParameters,
	SimulationResults,
	SpecialSaveType,
	SuccessRerollType,
} from "./types";
