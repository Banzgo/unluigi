import { useState } from "react";
import { DiceInput, type DiceInputState } from "@/components/DiceInput";
import { ProbabilityChart } from "@/components/ProbabilityChart";
import { Button } from "@/components/ui/button";
import {
	calculateStatistics,
	parseDiceExpression,
	runSimulation,
	type SimulationParameters,
	type SimulationResults,
} from "@/engine";

export function CombatView() {
	const [inputs, setInputs] = useState<DiceInputState[]>([
		{
			id: crypto.randomUUID(),
			numAttacks: "10",
			hit: 4,
			wound: 4,
			armorSave: 5,
			specialSave: "none",
			rerollHitFailures: "none",
			rerollHitSuccesses: "none",
			rerollWoundFailures: "none",
			rerollWoundSuccesses: "none",
			rerollArmorSaveFailures: "none",
			rerollArmorSaveSuccesses: "none",
			rerollSpecialSaveFailures: "none",
			rerollSpecialSaveSuccesses: "none",
			poison: false,
			lethalStrike: false,
			fury: false,
			multipleWounds: "1",
			targetMaxWounds: "1",
		},
	]);
	const [simResults, setSimResults] = useState<SimulationResults | null>(null);

	const addInput = () => {
		setInputs([
			...inputs,
			{
				id: crypto.randomUUID(),
				numAttacks: "10",
				hit: 4,
				wound: 4,
				armorSave: 5,
				specialSave: "none",
				rerollHitFailures: "none",
				rerollHitSuccesses: "none",
				rerollWoundFailures: "none",
				rerollWoundSuccesses: "none",
				rerollArmorSaveFailures: "none",
				rerollArmorSaveSuccesses: "none",
				rerollSpecialSaveFailures: "none",
				rerollSpecialSaveSuccesses: "none",
				poison: false,
				lethalStrike: false,
				fury: false,
				multipleWounds: "1",
				targetMaxWounds: "1",
			},
		]);
	};

	const removeInput = (id: string) => {
		setInputs(inputs.filter((input) => input.id !== id));
	};

	const updateInput = (id: string, updates: Partial<DiceInputState>) => {
		setInputs(inputs.map((input) => (input.id === id ? { ...input, ...updates } : input)));
	};

	const validateInput = (input: DiceInputState): boolean => {
		if (!input.numAttacks || input.numAttacks.trim() === "") {
			return false;
		}
		try {
			parseDiceExpression(input.numAttacks);
			return true;
		} catch {
			return false;
		}
	};

	const runCombinedSimulation = () => {
		// Validate all inputs
		const allValid = inputs.every(validateInput);
		if (!allValid) {
			return;
		}

		const startTime = performance.now();
		const iterations = 10000;

		// Run simulations for each input and collect distributions
		const distributions: number[][] = inputs.map((input) => {
			const params: SimulationParameters = {
				numAttacks: input.numAttacks,
				toHit: input.hit === "auto" ? "auto" : input.hit,
				rerollHitFailures: input.rerollHitFailures,
				rerollHitSuccesses: input.rerollHitSuccesses,
				toWound: input.wound === "auto" ? "auto" : input.wound,
				rerollWoundFailures: input.rerollWoundFailures,
				rerollWoundSuccesses: input.rerollWoundSuccesses,
				armorSave: input.armorSave === "none" ? "none" : input.armorSave,
				armorPiercing: 0,
				rerollArmorSaveFailures: input.rerollArmorSaveFailures,
				rerollArmorSaveSuccesses: input.rerollArmorSaveSuccesses,
				specialSave: input.specialSave === "none" ? "none" : input.specialSave,
				rerollSpecialSaveFailures: input.rerollSpecialSaveFailures,
				rerollSpecialSaveSuccesses: input.rerollSpecialSaveSuccesses,
				poison: input.poison,
				lethalStrike: input.lethalStrike,
				fury: input.fury,
				multipleWounds: input.multipleWounds || "1",
				targetMaxWounds: Number.parseInt(input.targetMaxWounds, 10) || 1,
				iterations,
			};

			return runSimulation(params);
		});

		// Combine distributions by summing wounds for each iteration
		const combinedDistribution: number[] = [];
		for (let i = 0; i < iterations; i++) {
			let totalWounds = 0;
			for (const dist of distributions) {
				totalWounds += dist[i];
			}
			combinedDistribution.push(totalWounds);
		}

		const endTime = performance.now();
		const executionTimeMs = endTime - startTime;

		// Calculate statistics on combined distribution
		const simulationResults = calculateStatistics(combinedDistribution, iterations, executionTimeMs);

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
					onClick={runCombinedSimulation}
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
