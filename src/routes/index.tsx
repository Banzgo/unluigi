import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CombatView } from "@/components/CombatView";
import { ProfileView } from "@/components/ProfileView";
import { VersusView } from "@/components/VersusView";
import type { DiceInputState } from "@/components/DiceInput";
import { decodeCombatShareState } from "@/utils/share";
import { createDefaultInput } from "@/utils/simulation-helpers";

const indexSearchSchema = z.object({
	mode: z.enum(["versus", "profile"]).optional(),
	sim: z.string().optional(),
});

export const Route = createFileRoute("/")({
	validateSearch: indexSearchSchema,
	component: CombatPage,
});

function CombatPage() {
	const { mode, sim } = Route.useSearch();

	let initialInputs: DiceInputState[] | null = null;
	let autoRun = false;

	// Only consider combat share links when not in versus/profile modes
	if (!mode && sim) {
		const decoded = decodeCombatShareState<Partial<Omit<DiceInputState, "id">>[]>(sim);
		if (decoded && decoded.v === 1 && Array.isArray(decoded.inputs) && decoded.inputs.length > 0) {
			initialInputs = decoded.inputs.map((partial) => {
				const base = createDefaultInput();
				// Rebuild full state from defaults + diff and generate a fresh id
				return {
					...base,
					...partial,
					id: crypto.randomUUID(),
				};
			});
			autoRun = true;
		}
	}

	return (
		<div className="p-4 sm:p-6 lg:p-8">
			<div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
				{mode === "versus" ? (
					<VersusView />
				) : mode === "profile" ? (
					<ProfileView />
				) : (
					<CombatView initialInputs={initialInputs ?? undefined} autoRun={autoRun} />
				)}
			</div>
		</div>
	);
}
