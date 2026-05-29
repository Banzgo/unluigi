export type UnitStatus = "alive" | "half" | "dead";

export interface ParsedUnit {
	id: string;
	points: number;
	countName: string;
	options: string;
	status: UnitStatus;
}

export interface PlayerState {
	header: string;
	units: ParsedUnit[];
	secondaryDone: boolean;
	declaredTotal: number | null;
}

export type PrimaryObjective = "player1" | "neither" | "player2";

export interface MatchState {
	player1: PlayerState;
	player2: PlayerState;
	primary: PrimaryObjective;
}

export interface BpResult {
	player1Bp: number;
	player2Bp: number;
	player1Vp: number;
	player2Vp: number;
	vpDiff: number;
}
