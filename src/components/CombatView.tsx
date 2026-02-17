import { useEffect, useRef, useState } from "react";
import { DiceInput, type DiceInputState } from "@/components/DiceInput";
import { ProbabilityChart } from "@/components/ProbabilityChart";
import { Button } from "@/components/ui/button";
import type { SimulationResults } from "@/engine";
import { type CombatSharePayloadV1, encodeCombatShareState } from "@/utils/share";
import { createDefaultInput, runCombinedSimulation, validateInput } from "@/utils/simulation-helpers";

interface CombatViewProps {
	initialInputs?: DiceInputState[] | null;
	autoRun?: boolean;
}

export function CombatView({ initialInputs, autoRun }: CombatViewProps = {}) {
	const [inputs, setInputs] = useState<DiceInputState[]>(
		initialInputs && initialInputs.length > 0 ? initialInputs : [createDefaultInput()],
	);
	const [simResults, setSimResults] = useState<SimulationResults | null>(null);
	const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");
	const hasAutoRun = useRef(false);

	const addInput = () => {
		setInputs([...inputs, createDefaultInput()]);
	};

	const removeInput = (id: string) => {
		setInputs(inputs.filter((input) => input.id !== id));
	};

	const updateInput = (id: string, updates: Partial<DiceInputState>) => {
		setInputs(inputs.map((input) => (input.id === id ? { ...input, ...updates } : input)));
	};

	const handleRunSimulation = () => {
		// Validate all inputs
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
	}, [autoRun, inputs]);

	const handleShareClick = async () => {
		try {
			// Build a compact representation: drop ids and omit fields that match defaults
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
				// Only send the per-attacker diffs
				inputs: compactInputs as unknown as DiceInputState[],
			};
			const encoded = encodeCombatShareState(payload);

			const url = new URL(window.location.href);
			url.searchParams.set("sim", encoded);

			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(url.toString());
				setShareStatus("copied");
				setTimeout(() => setShareStatus("idle"), 2000);
			} else {
				window.prompt("Copy this link:", url.toString());
			}
		} catch {
			setShareStatus("error");
			setTimeout(() => setShareStatus("idle"), 2000);
		}
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
