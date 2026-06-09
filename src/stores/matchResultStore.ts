import { create } from "zustand";
import type { ParsedUnit, PrimaryObjective, UnitStatus } from "@/matchresult/types";

interface PlayerState {
	header: string;
	units: ParsedUnit[];
	secondaryDone: boolean;
	declaredTotal: number | null;
}

function makePlayer(): PlayerState {
	return { header: "", units: [], secondaryDone: false, declaredTotal: null };
}

interface MatchResultState {
	p1: PlayerState;
	p2: PlayerState;
	primary: PrimaryObjective;
	setP1Parsed: (header: string, units: ParsedUnit[], declaredTotal: number | null) => void;
	setP2Parsed: (header: string, units: ParsedUnit[], declaredTotal: number | null) => void;
	setP1Status: (id: string, status: UnitStatus) => void;
	setP2Status: (id: string, status: UnitStatus) => void;
	setPrimary: (primary: PrimaryObjective) => void;
	setP1SecondaryDone: (done: boolean) => void;
	setP2SecondaryDone: (done: boolean) => void;
	reset: () => void;
}

export const useMatchResultStore = create<MatchResultState>((set) => ({
	p1: makePlayer(),
	p2: makePlayer(),
	primary: "neither",
	setP1Parsed: (header, units, declaredTotal) =>
		set((state) => ({ p1: { ...state.p1, header, units, declaredTotal } })),
	setP2Parsed: (header, units, declaredTotal) =>
		set((state) => ({ p2: { ...state.p2, header, units, declaredTotal } })),
	setP1Status: (id, status) =>
		set((state) => ({
			p1: { ...state.p1, units: state.p1.units.map((u) => (u.id === id ? { ...u, status } : u)) },
		})),
	setP2Status: (id, status) =>
		set((state) => ({
			p2: { ...state.p2, units: state.p2.units.map((u) => (u.id === id ? { ...u, status } : u)) },
		})),
	setPrimary: (primary) => set({ primary }),
	setP1SecondaryDone: (done) => set((state) => ({ p1: { ...state.p1, secondaryDone: done } })),
	setP2SecondaryDone: (done) => set((state) => ({ p2: { ...state.p2, secondaryDone: done } })),
	reset: () => set({ p1: makePlayer(), p2: makePlayer(), primary: "neither" }),
}));
