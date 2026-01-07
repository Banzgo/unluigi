import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CombatView } from "@/components/CombatView";
import { VersusView } from "@/components/VersusView";

const indexSearchSchema = z.object({
	mode: z.enum(["versus"]).optional(),
});

export const Route = createFileRoute("/")({
	validateSearch: indexSearchSchema,
	component: CombatPage,
});

function CombatPage() {
	const { mode } = Route.useSearch();

	return (
		<div className="p-4 sm:p-6 lg:p-8">
			<div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
				{mode === "versus" ? <VersusView /> : <CombatView />}
			</div>
		</div>
	);
}
