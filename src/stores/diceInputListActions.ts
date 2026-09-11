import type { DiceInputState } from "@/components/DiceInput";
import { createDefaultInput } from "@/utils/simulation-helpers";

type ZustandSet<S> = (partial: Partial<S> | ((state: S) => Partial<S>)) => void;

/**
 * Builds the add/remove/update/set actions for one `DiceInputState[]` slice
 * of a zustand store, keyed by `key`. Lets stores that hold more than one
 * independent list of dice inputs (e.g. the versus store's `inputs1`/`inputs2`)
 * share the same CRUD logic instead of redefining it per list.
 */
export function createDiceInputListActions<S extends Record<K, DiceInputState[]>, K extends string>(
	set: ZustandSet<S>,
	key: K,
) {
	return {
		add: () => set((state) => ({ [key]: [...state[key], createDefaultInput()] }) as Partial<S>),
		remove: (id: string) => set((state) => ({ [key]: state[key].filter((i) => i.id !== id) }) as Partial<S>),
		update: (id: string, updates: Partial<DiceInputState>) =>
			set((state) => ({ [key]: state[key].map((i) => (i.id === id ? { ...i, ...updates } : i)) }) as Partial<S>),
		set: (inputs: DiceInputState[]) => set(() => ({ [key]: inputs }) as Partial<S>),
	};
}
