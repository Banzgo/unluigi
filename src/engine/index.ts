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
} from "./dice";
export {
  calculateStatistics,
  getProbabilityAtLeast,
  getProbabilityExact,
} from "./probability";
export { runSimulation, runSimulationWithStats } from "./simulator";
export type {
  HitTracker,
  HitValue,
  ProbabilityPoint,
  RerollType,
  SimulationParameters,
  SimulationResults,
} from "./types";
