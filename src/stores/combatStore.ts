import { create } from "zustand";
import type { DiceInputState } from "@/components/DiceInput";
import type { SimulationResults } from "@/engine";
import { createDefaultInput } from "@/utils/simulation-helpers";
import { createDiceInputListActions } from "./diceInputListActions";

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

export const useCombatStore = create<CombatState>((set) => {
	const inputsActions = createDiceInputListActions<CombatState, "inputs">(set, "inputs");

	return {
		inputs: [createDefaultInput()],
		simResults: null,
		addInput: inputsActions.add,
		removeInput: inputsActions.remove,
		updateInput: inputsActions.update,
		setInputs: inputsActions.set,
		setSimResults: (results) => set({ simResults: results }),
		reset: () => set({ inputs: [createDefaultInput()], simResults: null }),
	};
});
