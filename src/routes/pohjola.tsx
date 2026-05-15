import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { PohjolaInputState } from "@/pohjola/components/PohjolaInput";
import { PohjolaView } from "@/pohjola/components/PohjolaView";
import { decodePohjolaShareState } from "@/pohjola/utils/share";

const pohjolaSearchSchema = z.object({
	sim: z.string().optional(),
});

export const Route = createFileRoute("/pohjola")({
	validateSearch: pohjolaSearchSchema,
	component: PohjolaPage,
});

function PohjolaPage() {
	const { sim } = Route.useSearch();

	let initialState: Partial<PohjolaInputState> | undefined;
	let autoRun = false;

	if (sim) {
		const decoded = decodePohjolaShareState(sim);
		if (decoded?.v === 1) {
			initialState = decoded.inputs;
			autoRun = true;
		}
	}

	return (
		<div className="p-4 sm:p-6 lg:p-8">
			<div className="max-w-4xl mx-auto space-y-4">
				<h1
					className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center"
					style={{ fontFamily: "var(--font-display)" }}
				>
					<span className="text-amber-400">POHJOLA</span> <span className="text-red-500">COMBAT</span>
				</h1>

				<PohjolaView initialState={initialState} autoRun={autoRun} />
			</div>
		</div>
	);
}
