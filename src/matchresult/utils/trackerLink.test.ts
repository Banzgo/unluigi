import { describe, expect, it } from "vitest";
import type { MatchState, PlayerState } from "../types";
import { isTrackerMember, trackerReportUrl } from "./trackerLink";

function player(rawText: string, secondaryDone = false): PlayerState {
	return {
		header: "",
		units: rawText ? [{ id: "unit-0", points: 295, countName: "Prince", options: "", status: "alive" }] : [],
		secondaryDone,
		declaredTotal: null,
		rawText,
	};
}

function decode(url: string): unknown {
	const encoded = new URL(url).searchParams.get("prefill") ?? "";
	return JSON.parse(decodeURIComponent(atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))));
}

describe("isTrackerMember", () => {
	it("looks for the tracker's hint cookie", () => {
		expect(isTrackerMember("a=1; tracker_member=1")).toBe(true);
		expect(isTrackerMember("tracker_member_x=1")).toBe(false);
		expect(isTrackerMember("")).toBe(false);
	});
});

describe("trackerReportUrl", () => {
	it("encodes lists, battle points and objectives for the tracker's prefill", () => {
		const state: MatchState = {
			player1: player("Äijä - Sylvan Elves\n295 - Prince", true),
			player2: player(""),
			primary: "player2",
		};
		const url = trackerReportUrl(state, { player1Bp: 12, player2Bp: 8, player1Vp: 0, player2Vp: 0, vpDiff: 0 });
		expect(url.startsWith("https://tracker.unluigi.app/games/new?prefill=")).toBe(true);
		expect(decode(url)).toEqual({
			v: 1,
			sides: [
				{ list: "Äijä - Sylvan Elves\n295 - Prince", battlePoints: 12, secondaryAchieved: true },
				{ list: "", battlePoints: null, secondaryAchieved: false },
			],
			primaryWinner: 2,
		});
	});
});
