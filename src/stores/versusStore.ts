import { create } from "zustand";
import type { DiceInputState } from "@/components/DiceInput";
import type { SimulationResults } from "@/engine";
import { createDefaultInput } from "@/utils/simulation-helpers";
import { createDiceInputListActions } from "./diceInputListActions";

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

export const useVersusStore = create<VersusState>((set) => {
	const list1 = createDiceInputListActions<VersusState, "inputs1">(set, "inputs1");
	const list2 = createDiceInputListActions<VersusState, "inputs2">(set, "inputs2");

	return {
		inputs1: [createDefaultInput()],
		inputs2: [createDefaultInput()],
		results1: null,
		results2: null,
		addInput1: list1.add,
		addInput2: list2.add,
		removeInput1: list1.remove,
		removeInput2: list2.remove,
		updateInput1: list1.update,
		updateInput2: list2.update,
		copyInputs1To2: () =>
			set((state) => ({
				inputs2: state.inputs1.map((input) => ({ ...input, id: crypto.randomUUID() })),
			})),
		setResults1: (results) => set({ results1: results }),
		setResults2: (results) => set({ results2: results }),
		reset: () =>
			set({ inputs1: [createDefaultInput()], inputs2: [createDefaultInput()], results1: null, results2: null }),
	};
});
