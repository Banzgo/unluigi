import { useState } from "react";
import { DiceInput, type DiceInputState } from "@/components/DiceInput";
import { ProbabilityChart } from "@/components/ProbabilityChart";
import { Button } from "@/components/ui/button";
import type { SimulationResults } from "@/engine";
import { createDefaultInput, runCombinedSimulation, validateInput } from "@/utils/simulation-helpers";

export function CombatView() {
	const [inputs, setInputs] = useState<DiceInputState[]>([createDefaultInput()]);
	const [simResults, setSimResults] = useState<SimulationResults | null>(null);

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
				<div className="space-y-6">
					{/* Chart with Score */}
					<ProbabilityChart results={simResults} />
				</div>
			)}
		</>
	);
}
