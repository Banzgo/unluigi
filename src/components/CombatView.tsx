import { useEffect, useRef, useState } from "react";
import { DiceInput, type DiceInputState } from "@/components/DiceInput";
import { ProbabilityChart } from "@/components/ProbabilityChart";
import { Button } from "@/components/ui/button";
import { useCombatStore } from "@/stores/combatStore";
import { type CombatSharePayloadV1, copySimUrl, encodeCombatShareState } from "@/utils/share";
import { createDefaultInput, runCombinedSimulation, validateInput } from "@/utils/simulation-helpers";

interface CombatViewProps {
	initialInputs?: DiceInputState[] | null;
	autoRun?: boolean;
}

export function CombatView({ initialInputs, autoRun }: CombatViewProps = {}) {
	const { inputs, simResults, addInput, removeInput, updateInput, setInputs, setSimResults } = useCombatStore();
	const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");
	const hasAutoRun = useRef(false);
	const hasInitialized = useRef(false);

	// Override store with shared URL inputs on first mount
	useEffect(() => {
		if (hasInitialized.current) return;
		hasInitialized.current = true;
		if (initialInputs && initialInputs.length > 0) {
			setInputs(initialInputs);
		}
	}, [initialInputs, setInputs]);

	const handleRunSimulation = () => {
		const allValid = inputs.every(validateInput);
		if (!allValid) {
			return;
		}

		const simulationResults = runCombinedSimulation(inputs);
		setSimResults(simulationResults);
	};

	useEffect(() => {
		if (!autoRun || hasAutoRun.current) return;
		hasAutoRun.current = true;

		const allValid = inputs.every(validateInput);
		if (!allValid) return;

		const simulationResults = runCombinedSimulation(inputs);
		setSimResults(simulationResults);
	}, [autoRun, inputs, setSimResults]);

	const handleShareClick = async () => {
		const base = createDefaultInput();

		const compactInputs = inputs.map((input) => {
			const { id: _id, ...rest } = input;
			const { id: _baseId, ...baseRest } = base;
			const diff: Partial<Omit<DiceInputState, "id">> = {};

			(Object.keys(rest) as (keyof typeof rest)[]).forEach((key) => {
				if (rest[key] !== baseRest[key]) {
					// @ts-expect-error - dynamic key assignment is safe here
					diff[key] = rest[key];
				}
			});

			return diff;
		});

		const payload: CombatSharePayloadV1<DiceInputState[]> = {
			v: 1,
			inputs: compactInputs as unknown as DiceInputState[],
		};
		await copySimUrl(encodeCombatShareState(payload), setShareStatus);
	};

	return (
		<>
			{/* Title */}
			<h1
				className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center"
				style={{ fontFamily: "var(--font-display)" }}
			>
				<span className="text-brand-green">COMBAT</span> <span className="text-orange-500">SIMULATOR</span>
			</h1>

			{/* Input Cards */}
			<div className="space-y-4">
				{inputs.map((input) => (
					<DiceInput
						key={input.id}
						input={input}
						onUpdate={updateInput}
						onRemove={removeInput}
						showRemove={inputs.length > 1}
					/>
				))}
			</div>

			{/* Action Buttons */}
			<div className="flex flex-col sm:flex-row gap-3">
				<Button
					onClick={addInput}
					className="w-full sm:flex-none sm:w-48 h-12 sm:h-14 text-base sm:text-lg bg-secondary hover:bg-secondary/80 text-foreground border-border"
					variant="outline"
				>
					+ Add Attacker
				</Button>

				<Button
					onClick={handleRunSimulation}
					disabled={!inputs.every(validateInput)}
					className="w-full sm:flex-1 h-12 sm:h-14 text-lg sm:text-xl bg-brand-green hover:bg-brand-green-dark text-white disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Simulate
				</Button>
			</div>

			{/* Results */}
			{simResults && (
				<div className="space-y-2">
					{/* Chart with Score */}
					<ProbabilityChart results={simResults} />
					<div className="flex items-center justify-end">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleShareClick}
							className="text-xs sm:text-[11px] h-8 px-3"
						>
							{shareStatus === "copied" ? "Link copied" : shareStatus === "error" ? "Copy failed" : "Share link"}
						</Button>
					</div>
				</div>
			)}
		</>
	);
}
