import { create } from "zustand";
import type { DiceInputState } from "@/components/DiceInput";
import type { SimulationResults } from "@/engine";
import { createDefaultInput } from "@/utils/simulation-helpers";

interface VersusState {
	inputs1: DiceInputState[];
	inputs2: DiceInputState[];
	results1: SimulationResults | null;
	results2: SimulationResults | null;
	addInput1: () => void;
	addInput2: () => void;
	removeInput1: (id: string) => void;
	removeInput2: (id: string) => void;
	updateInput1: (id: string, updates: Partial<DiceInputState>) => void;
	updateInput2: (id: string, updates: Partial<DiceInputState>) => void;
	copyInputs1To2: () => void;
	setResults1: (results: SimulationResults | null) => void;
	setResults2: (results: SimulationResults | null) => void;
	reset: () => void;
}

export const useVersusStore = create<VersusState>((set) => ({
	inputs1: [createDefaultInput()],
	inputs2: [createDefaultInput()],
	results1: null,
	results2: null,
	addInput1: () => set((state) => ({ inputs1: [...state.inputs1, createDefaultInput()] })),
	addInput2: () => set((state) => ({ inputs2: [...state.inputs2, createDefaultInput()] })),
	removeInput1: (id) => set((state) => ({ inputs1: state.inputs1.filter((i) => i.id !== id) })),
	removeInput2: (id) => set((state) => ({ inputs2: state.inputs2.filter((i) => i.id !== id) })),
	updateInput1: (id, updates) =>
		set((state) => ({
			inputs1: state.inputs1.map((i) => (i.id === id ? { ...i, ...updates } : i)),
		})),
	updateInput2: (id, updates) =>
		set((state) => ({
			inputs2: state.inputs2.map((i) => (i.id === id ? { ...i, ...updates } : i)),
		})),
	copyInputs1To2: () =>
		set((state) => ({
			inputs2: state.inputs1.map((input) => ({ ...input, id: crypto.randomUUID() })),
		})),
	setResults1: (results) => set({ results1: results }),
	setResults2: (results) => set({ results2: results }),
	reset: () =>
		set({ inputs1: [createDefaultInput()], inputs2: [createDefaultInput()], results1: null, results2: null }),
}));
