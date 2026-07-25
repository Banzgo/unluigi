import type { BpResult, MatchState, ParsedUnit } from "../types";

const BASE_GAME_SIZE = 4000;
const BASE_THRESHOLDS = [200, 400, 800, 1200, 1600, 2000];

export function detectGameSize(totalPoints: number): number {
	if (totalPoints <= 0) return BASE_GAME_SIZE;
	return Math.round(totalPoints / 500) * 500;
}

function scaledThresholds(gameSize: number): number[] {
	const scale = gameSize / BASE_GAME_SIZE;
	return BASE_THRESHOLDS.map((t) => t * scale);
}

export interface ObjectiveState {
	primary: MatchState["primary"];
	player1SecondaryDone: boolean;
	player2SecondaryDone: boolean;
}

export interface NextBpInfo {
	vpNeeded: number;
	nextBp: number;
}

function applyObjectiveModifiers(
	p1Base: number,
	p2Base: number,
	objectives: ObjectiveState,
): { player1Bp: number; player2Bp: number } {
	let p1Bp = p1Base;
	let p2Bp = p2Base;

	if (objectives.primary === "player1") {
		p1Bp += 3;
		p2Bp -= 3;
	} else if (objectives.primary === "player2") {
		p2Bp += 3;
		p1Bp -= 3;
	}

	if (objectives.player1SecondaryDone) {
		p1Bp += 1;
		p2Bp -= 1;
	}
	if (objectives.player2SecondaryDone) {
		p2Bp += 1;
		p1Bp -= 1;
	}

	return { player1Bp: p1Bp, player2Bp: p2Bp };
}

function computeBpFromVp(
	player1Vp: number,
	player2Vp: number,
	objectives: ObjectiveState,
	gameSize: number,
): { player1Bp: number; player2Bp: number } {
	const vpDiff = Math.abs(player1Vp - player2Vp);
	const { winner, loser } = baseBp(vpDiff, gameSize);
	const p1Base = player1Vp >= player2Vp ? winner : loser;
	const p2Base = player2Vp >= player1Vp ? winner : loser;
	return applyObjectiveModifiers(p1Base, p2Base, objectives);
}

function collectVpDeltaCandidates(
	player: "player1" | "player2",
	player1Vp: number,
	player2Vp: number,
	gameSize: number,
): number[] {
	const thresholds = scaledThresholds(gameSize);
	const diff = Math.abs(player1Vp - player2Vp);
	const myVp = player === "player1" ? player1Vp : player2Vp;
	const theirVp = player === "player1" ? player2Vp : player1Vp;
	const iAmWinner = myVp >= theirVp;
	const candidates = new Set<number>();

	if (iAmWinner) {
		for (const t of thresholds) {
			if (diff <= t) {
				candidates.add(t - diff + 1);
				break;
			}
		}
	} else {
		for (let i = 0; i < thresholds.length; i++) {
			if (diff <= thresholds[i]) {
				if (i > 0) candidates.add(diff - thresholds[i - 1]);
				break;
			}
		}
		if (diff > thresholds[thresholds.length - 1]) {
			candidates.add(diff - thresholds[thresholds.length - 1]);
		}

		const gap = theirVp - myVp;
		for (const t of thresholds) {
			candidates.add(gap + t + 1);
		}
	}

	return [...candidates].filter((d) => d > 0).sort((a, b) => a - b);
}

/** VP needed to gain 1 BP. null when already at max (20) or no VP path exists. */
export function nextBpInfoForPlayer(
	player: "player1" | "player2",
	result: BpResult,
	objectives: ObjectiveState,
	gameSize: number,
): NextBpInfo | null {
	const currentBp = player === "player1" ? result.player1Bp : result.player2Bp;
	if (currentBp >= 20) return null;

	const targetBp = currentBp + 1;
	const { player1Vp, player2Vp } = result;
	const candidates = collectVpDeltaCandidates(player, player1Vp, player2Vp, gameSize);

	for (const delta of candidates) {
		const testP1Vp = player === "player1" ? player1Vp + delta : player1Vp;
		const testP2Vp = player === "player2" ? player2Vp + delta : player2Vp;
		const bp = computeBpFromVp(testP1Vp, testP2Vp, objectives, gameSize);
		const newBp = player === "player1" ? bp.player1Bp : bp.player2Bp;
		if (newBp >= targetBp) {
			return { vpNeeded: delta, nextBp: targetBp };
		}
	}

	const thresholds = scaledThresholds(gameSize);
	const gap = player === "player1" ? player2Vp - player1Vp : player1Vp - player2Vp;
	const maxDelta = Math.max(0, gap) + thresholds[thresholds.length - 1] + 100;

	for (let delta = 0.5; delta <= maxDelta; delta += 0.5) {
		const testP1Vp = player === "player1" ? player1Vp + delta : player1Vp;
		const testP2Vp = player === "player2" ? player2Vp + delta : player2Vp;
		const bp = computeBpFromVp(testP1Vp, testP2Vp, objectives, gameSize);
		const newBp = player === "player1" ? bp.player1Bp : bp.player2Bp;
		if (newBp >= targetBp) {
			return { vpNeeded: delta, nextBp: targetBp };
		}
	}

	return null;
}

function unitVp(unit: ParsedUnit): number {
	if (unit.status === "dead") return unit.points;
	if (unit.status === "half") return unit.points * 0.5;
	return 0;
}

function baseBp(vpDiff: number, gameSize: number): { winner: number; loser: number } {
	const [t1, t2, t3, t4, t5, t6] = scaledThresholds(gameSize);
	if (vpDiff <= t1) return { winner: 10, loser: 10 };
	if (vpDiff <= t2) return { winner: 11, loser: 9 };
	if (vpDiff <= t3) return { winner: 12, loser: 8 };
	if (vpDiff <= t4) return { winner: 13, loser: 7 };
	if (vpDiff <= t5) return { winner: 14, loser: 6 };
	if (vpDiff <= t6) return { winner: 15, loser: 5 };
	return { winner: 16, loser: 4 };
}

export function calculateResult(state: MatchState, gameSize: number): BpResult {
	const player1Vp = state.player2.units.reduce((sum, u) => sum + unitVp(u), 0);
	const player2Vp = state.player1.units.reduce((sum, u) => sum + unitVp(u), 0);
	const vpDiff = Math.abs(player1Vp - player2Vp);
	const objectives: ObjectiveState = {
		primary: state.primary,
		player1SecondaryDone: state.player1.secondaryDone,
		player2SecondaryDone: state.player2.secondaryDone,
	};
	const { player1Bp, player2Bp } = computeBpFromVp(player1Vp, player2Vp, objectives, gameSize);

	return { player1Bp, player2Bp, player1Vp, player2Vp, vpDiff };
}
