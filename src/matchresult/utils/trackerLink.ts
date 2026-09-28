import { encodeSharePayload } from "@/utils/share";
import type { BpResult, MatchState } from "../types";

const TRACKER_URL = "https://tracker.unluigi.app";

/**
 * Set by the tracker on `.unluigi.app` while the browser is signed in there (only allowlisted players can sign in).
 * Just a hint for showing the link; the tracker does the real access check.
 */
const MEMBER_COOKIE = "tracker_member";

export function isTrackerMember(cookie: string = document.cookie): boolean {
	return cookie.split(";").some((part) => part.trim().startsWith(`${MEMBER_COOKIE}=`));
}

/**
 * Link to the tracker's report form, prefilled with both lists and the result.
 * Payload shape is decoded by `src/lib/prefill.ts` in the tracker; keep the two in sync.
 */
export function trackerReportUrl(state: MatchState, result: BpResult): string {
	const hasUnits = [state.player1, state.player2].map((p) => p.units.length > 0);
	const prefill = encodeSharePayload({
		v: 1,
		sides: [
			{
				list: state.player1.rawText,
				battlePoints: hasUnits[0] ? result.player1Bp : null,
				secondaryAchieved: state.player1.secondaryDone,
			},
			{
				list: state.player2.rawText,
				battlePoints: hasUnits[1] ? result.player2Bp : null,
				secondaryAchieved: state.player2.secondaryDone,
			},
		],
		primaryWinner: state.primary === "player1" ? 1 : state.primary === "player2" ? 2 : null,
	});
	return `${TRACKER_URL}/games/new?prefill=${prefill}`;
}
