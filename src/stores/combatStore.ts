import { create } from "zustand";
import type { DiceInputState } from "@/components/DiceInput";
import type { SimulationResults } from "@/engine";
import { createDefaultInput } from "@/utils/simulation-helpers";

interface CombatState {
	inputs: DiceInputState[];
	simResults: SimulationResults | null;
	addInput: () => void;
	removeInput: (id: string) => void;
	updateInput: (id: string, updates: Partial<DiceInputState>) => void;
	setInputs: (inputs: DiceInputState[]) => void;
	setSimResults: (results: SimulationResults | null) => void;
	reset: () => void;
}

export const useCombatStore = create<CombatState>((set) => ({
	inputs: [createDefaultInput()],
	simResults: null,
	addInput: () => set((state) => ({ inputs: [...state.inputs, createDefaultInput()] })),
	removeInput: (id) => set((state) => ({ inputs: state.inputs.filter((i) => i.id !== id) })),
	updateInput: (id, updates) =>
		set((state) => ({
			inputs: state.inputs.map((i) => (i.id === id ? { ...i, ...updates } : i)),
		})),
	setInputs: (inputs) => set({ inputs }),
	setSimResults: (results) => set({ simResults: results }),
	reset: () => set({ inputs: [createDefaultInput()], simResults: null }),
}));
