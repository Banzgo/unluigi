import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Shield, Sparkles } from "lucide-react";
import { MagicCastingTables } from "@/components/MagicCastingTables";
import { MagicSimulatorInput, type MagicSimulatorInputState, type SpellType } from "@/components/MagicSimulatorInput";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { decodeMagicShareState } from "@/utils/share";

const magicSearchSchema = z.object({
	sim: z.string().optional(),
});

export const Route = createFileRoute("/magic")({
	validateSearch: magicSearchSchema,
	component: MagicPage,
});

function MagicPage() {
	const { sim } = Route.useSearch();

	let initialState: Partial<MagicSimulatorInputState> | undefined;
	let initialSpellType: SpellType | undefined;
	let autoRun = false;

	if (sim) {
		const decoded = decodeMagicShareState<Partial<MagicSimulatorInputState>>(sim);
		if (decoded && decoded.v === 1) {
			initialState = decoded.inputs;
			initialSpellType = decoded.spellType === "bound" ? "bound" : "learned";
			autoRun = true;
		}
	}

	return (
		<div className="p-4 sm:p-6 lg:p-8">
			<div className="max-w-4xl mx-auto space-y-4">
				{/* Title */}
				<h1
					className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center"
					style={{ fontFamily: "var(--font-display)" }}
				>
					<span className="text-purple-400">MAGIC</span> <span className="text-orange-500">PHASE</span>
				</h1>

				<Accordion type="multiple" defaultValue={["dispel-simulator"]} className="w-full space-y-4">
					{/* Spell Casting Tables Accordion */}
					<AccordionItem value="casting-tables" className="border border-border rounded-lg bg-card overflow-hidden">
						<AccordionTrigger className="px-4 hover:no-underline hover:bg-white/5">
							<div className="flex items-center gap-2">
								<Sparkles className="w-4 h-4 text-purple-400" />
								<span className="text-base font-semibold">Spell Casting Probabilities</span>
							</div>
						</AccordionTrigger>
						<AccordionContent className="px-4 py-2">
							<MagicCastingTables />
						</AccordionContent>
					</AccordionItem>

					{/* Dispel Simulator Accordion */}
					<AccordionItem value="dispel-simulator" className="border border-border rounded-lg bg-card overflow-hidden">
						<AccordionTrigger className="px-4 hover:no-underline hover:bg-white/5">
							<div className="flex items-center gap-2">
								<Shield className="w-4 h-4 text-cyan-400" />
								<span className="text-base font-semibold">Dispel Simulator</span>
							</div>
						</AccordionTrigger>
						<AccordionContent className="px-4 py-2">
							<MagicSimulatorInput initialState={initialState} initialSpellType={initialSpellType} autoRun={autoRun} />
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</div>
	);
}
