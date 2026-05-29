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

/** VP the winner needs to widen gap into the next BP tier. null = already at max. */
export function vpToNextWinnerTier(vpDiff: number, gameSize: number): number | null {
	for (const t of scaledThresholds(gameSize)) {
		if (vpDiff <= t) return t - vpDiff + 1;
	}
	return null;
}

/** VP the loser needs to narrow gap into the previous BP tier. null = already at best (draw). */
export function vpToNextLoserTier(vpDiff: number, gameSize: number): number | null {
	const thresholds = scaledThresholds(gameSize);
	for (let i = 0; i < thresholds.length; i++) {
		if (vpDiff <= thresholds[i]) {
			if (i === 0) return null;
			return vpDiff - thresholds[i - 1];
		}
	}
	return vpDiff - thresholds[thresholds.length - 1];
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
	const { winner, loser } = baseBp(vpDiff, gameSize);

	let p1Bp = player1Vp >= player2Vp ? winner : loser;
	let p2Bp = player2Vp >= player1Vp ? winner : loser;

	if (state.primary === "player1") {
		p1Bp += 3;
		p2Bp -= 3;
	} else if (state.primary === "player2") {
		p2Bp += 3;
		p1Bp -= 3;
	}

	if (state.player1.secondaryDone) {
		p1Bp += 1;
		p2Bp -= 1;
	}
	if (state.player2.secondaryDone) {
		p2Bp += 1;
		p1Bp -= 1;
	}

	return { player1Bp: p1Bp, player2Bp: p2Bp, player1Vp, player2Vp, vpDiff };
}
