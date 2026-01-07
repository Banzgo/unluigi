import { Copy } from "lucide-react";
import { useState } from "react";
import { DiceInput, type DiceInputState } from "@/components/DiceInput";
import { ProbabilityChart } from "@/components/ProbabilityChart";
import { Button } from "@/components/ui/button";
import type { SimulationResults } from "@/engine";
import { createDefaultInput, runCombinedSimulation, validateInput } from "@/utils/simulation-helpers";

export function VersusView() {
	const [inputs1, setInputs1] = useState<DiceInputState[]>([createDefaultInput()]);
	const [inputs2, setInputs2] = useState<DiceInputState[]>([createDefaultInput()]);
	const [results1, setResults1] = useState<SimulationResults | null>(null);
	const [results2, setResults2] = useState<SimulationResults | null>(null);

	const addInput1 = () => {
		setInputs1([...inputs1, createDefaultInput()]);
	};

	const addInput2 = () => {
		setInputs2([...inputs2, createDefaultInput()]);
	};

	const removeInput1 = (id: string) => {
		setInputs1(inputs1.filter((input) => input.id !== id));
	};

	const removeInput2 = (id: string) => {
		setInputs2(inputs2.filter((input) => input.id !== id));
	};

	const updateInput1 = (id: string, updates: Partial<DiceInputState>) => {
		setInputs1(inputs1.map((input) => (input.id === id ? { ...input, ...updates } : input)));
	};

	const updateInput2 = (id: string, updates: Partial<DiceInputState>) => {
		setInputs2(inputs2.map((input) => (input.id === id ? { ...input, ...updates } : input)));
	};

	const copyInputs1To2 = () => {
		// Deep clone inputs1 with new IDs
		const copiedInputs = inputs1.map((input) => ({
			...input,
			id: crypto.randomUUID(),
		}));
		setInputs2(copiedInputs);
	};

	const handleVersusSimulation = () => {
		// Validate all inputs
		const allValid = [...inputs1, ...inputs2].every(validateInput);
		if (!allValid) {
			return;
		}

		const result1 = runCombinedSimulation(inputs1);
		const result2 = runCombinedSimulation(inputs2);

		setResults1(result1);
		setResults2(result2);
	};

	const allInputsValid = [...inputs1, ...inputs2].every(validateInput);

	return (
		<>
			{/* Title */}
			<h1
				className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center"
				style={{ fontFamily: "var(--font-display)" }}
			>
				<span className="text-brand-green">VERSUS</span> <span className="text-orange-500">MODE</span>
			</h1>

			<div className="space-y-6">
				{/* Input Set 1 */}
				<div className="space-y-4">
					<h2 className="text-xl sm:text-2xl font-bold text-brand-green">Profile 1</h2>

					{inputs1.map((input) => (
						<DiceInput
							key={input.id}
							input={input}
							onUpdate={updateInput1}
							onRemove={removeInput1}
							showRemove={inputs1.length > 1}
						/>
					))}

					<Button
						onClick={addInput1}
						className="w-full bg-secondary hover:bg-secondary/80 text-foreground border-border"
						variant="outline"
					>
						+ Add Attacker to Profile 1
					</Button>
				</div>

				{/* Input Set 2 */}
				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h2 className="text-xl sm:text-2xl font-bold text-orange-500">Profile 2</h2>
						<Button onClick={copyInputs1To2} variant="outline" size="sm" className="gap-2">
							<Copy className="h-4 w-4" />
							Copy from Profile 1
						</Button>
					</div>

					{inputs2.map((input) => (
						<DiceInput
							key={input.id}
							input={input}
							onUpdate={updateInput2}
							onRemove={removeInput2}
							showRemove={inputs2.length > 1}
						/>
					))}

					<Button
						onClick={addInput2}
						className="w-full bg-secondary hover:bg-secondary/80 text-foreground border-border"
						variant="outline"
					>
						+ Add Attacker to Profile 2
					</Button>
				</div>
			</div>

			{/* Simulate Button */}
			<Button
				onClick={handleVersusSimulation}
				disabled={!allInputsValid}
				className="w-full h-12 sm:h-14 text-lg sm:text-xl bg-brand-green hover:bg-brand-green-dark text-white disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Simulate
			</Button>

			{/* Results */}
			{results1 && results2 && (
				<div className="space-y-6">
					{/* Chart with Both Results */}
					<ProbabilityChart results={results1} results2={results2} />
				</div>
			)}
		</>
	);
}
