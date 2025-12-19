import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	type CastingRerollType,
	type DispelRerollType,
	type MagicSimulationResults,
	runMagicSimulation,
} from "@/engine";

export interface MagicSimulatorInputState {
	castingDice: number;
	dispelDice: number;
	castingValue: number;
	castingModifier: number;
	dispelModifier: number;
	magicResistance: number;
	rerollCasting: CastingRerollType;
	rerollDispel: DispelRerollType;
	isBoundSpell: boolean;
}

type SpellType = "learned" | "bound";
type CastingDiceValue = 2 | 3 | 4 | 5;
type DispelDiceValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type CastingValueOption = 5 | 6 | 7 | 8 | 9 | 10 | 11;

/**
 * Get color class based on probability value
 */
function getProbabilityColor(prob: number): string {
	if (prob >= 90) return "bg-emerald-500/30 text-emerald-300";
	if (prob >= 75) return "bg-green-500/25 text-green-300";
	if (prob >= 60) return "bg-lime-500/20 text-lime-300";
	if (prob >= 45) return "bg-yellow-500/20 text-yellow-300";
	if (prob >= 30) return "bg-orange-500/20 text-orange-300";
	if (prob >= 15) return "bg-red-500/20 text-red-300";
	return "bg-red-900/30 text-red-400";
}

/**
 * Get inverted color (for failure rates where lower is better)
 */
function getInvertedProbabilityColor(prob: number): string {
	return getProbabilityColor(100 - prob);
}

export function MagicSimulatorInput() {
	const castingDiceOptions: CastingDiceValue[] = [2, 3, 4, 5];
	const dispelDiceOptions: DispelDiceValue[] = [0, 1, 2, 3, 4, 5, 6, 7];
	const castingValueOptions: CastingValueOption[] = [5, 6, 7, 8, 9, 10, 11];
	const modifierOptions = [-1, 0, 1, 2];
	const magicResistanceOptions = [0, 1, 2, 3];
	const castingRerollOptions: CastingRerollType[] = ["none", "1s", "all"];
	const dispelRerollOptions: DispelRerollType[] = ["none", "all"];

	const [spellType, setSpellType] = useState<SpellType>("learned");
	const [inputs, setInputs] = useState<MagicSimulatorInputState>({
		castingDice: 3,
		dispelDice: 3,
		castingValue: 7,
		castingModifier: 0,
		dispelModifier: 0,
		magicResistance: 0,
		rerollCasting: "none",
		rerollDispel: "none",
		isBoundSpell: false,
	});

	const [results, setResults] = useState<MagicSimulationResults | null>(null);
	const [isSimulating, setIsSimulating] = useState(false);

	const updateInput = <K extends keyof MagicSimulatorInputState>(key: K, value: MagicSimulatorInputState[K]) => {
		setInputs((prev) => ({ ...prev, [key]: value }));
	};

	const cycleCastingDice = () => {
		const currentIndex = castingDiceOptions.indexOf(inputs.castingDice as CastingDiceValue);
		const nextValue = castingDiceOptions[(currentIndex + 1) % castingDiceOptions.length];
		updateInput("castingDice", nextValue);
	};

	const decreaseCastingDice = () => {
		const currentIndex = castingDiceOptions.indexOf(inputs.castingDice as CastingDiceValue);
		if (currentIndex > 0) {
			const prevValue = castingDiceOptions[currentIndex - 1];
			updateInput("castingDice", prevValue);
		}
	};

	const increaseCastingDice = () => {
		const currentIndex = castingDiceOptions.indexOf(inputs.castingDice as CastingDiceValue);
		if (currentIndex < castingDiceOptions.length - 1) {
			const nextValue = castingDiceOptions[currentIndex + 1];
			updateInput("castingDice", nextValue);
		}
	};

	const cycleDispelDice = () => {
		const currentIndex = dispelDiceOptions.indexOf(inputs.dispelDice as DispelDiceValue);
		const nextValue = dispelDiceOptions[(currentIndex + 1) % dispelDiceOptions.length];
		updateInput("dispelDice", nextValue);
	};

	const decreaseDispelDice = () => {
		const currentIndex = dispelDiceOptions.indexOf(inputs.dispelDice as DispelDiceValue);
		if (currentIndex > 0) {
			const prevValue = dispelDiceOptions[currentIndex - 1];
			updateInput("dispelDice", prevValue);
		}
	};

	const increaseDispelDice = () => {
		const currentIndex = dispelDiceOptions.indexOf(inputs.dispelDice as DispelDiceValue);
		if (currentIndex < dispelDiceOptions.length - 1) {
			const nextValue = dispelDiceOptions[currentIndex + 1];
			updateInput("dispelDice", nextValue);
		}
	};

	const cycleCastingValue = () => {
		const currentIndex = castingValueOptions.indexOf(inputs.castingValue as CastingValueOption);
		const nextValue = castingValueOptions[(currentIndex + 1) % castingValueOptions.length];
		updateInput("castingValue", nextValue);
	};

	const decreaseCastingValue = () => {
		const currentIndex = castingValueOptions.indexOf(inputs.castingValue as CastingValueOption);
		if (currentIndex > 0) {
			const prevValue = castingValueOptions[currentIndex - 1];
			updateInput("castingValue", prevValue);
		}
	};

	const increaseCastingValue = () => {
		const currentIndex = castingValueOptions.indexOf(inputs.castingValue as CastingValueOption);
		if (currentIndex < castingValueOptions.length - 1) {
			const nextValue = castingValueOptions[currentIndex + 1];
			updateInput("castingValue", nextValue);
		}
	};

	const cycleCastingModifier = () => {
		const currentIndex = modifierOptions.indexOf(inputs.castingModifier);
		const nextValue = modifierOptions[(currentIndex + 1) % modifierOptions.length];
		updateInput("castingModifier", nextValue);
	};

	const cycleDispelModifier = () => {
		const currentIndex = modifierOptions.indexOf(inputs.dispelModifier);
		const nextValue = modifierOptions[(currentIndex + 1) % modifierOptions.length];
		updateInput("dispelModifier", nextValue);
	};

	const cycleMagicResistance = () => {
		const currentIndex = magicResistanceOptions.indexOf(inputs.magicResistance);
		const nextValue = magicResistanceOptions[(currentIndex + 1) % magicResistanceOptions.length];
		updateInput("magicResistance", nextValue);
	};

	const cycleRerollCasting = () => {
		const currentIndex = castingRerollOptions.indexOf(inputs.rerollCasting);
		const nextValue = castingRerollOptions[(currentIndex + 1) % castingRerollOptions.length];
		updateInput("rerollCasting", nextValue);
	};

	const cycleRerollDispel = () => {
		const currentIndex = dispelRerollOptions.indexOf(inputs.rerollDispel);
		const nextValue = dispelRerollOptions[(currentIndex + 1) % dispelRerollOptions.length];
		updateInput("rerollDispel", nextValue);
	};

	const getModifierLabel = (value: number): string => {
		if (value === 0) return "No Modifier";
		return value > 0 ? `+${value}` : `${value}`;
	};

	const getMagicResistanceLabel = (value: number): string => {
		return value === 0 ? "No MR" : `MR ${value}`;
	};

	const getRerollCastingLabel = (reroll: CastingRerollType): string => {
		switch (reroll) {
			case "none":
				return "No Reroll";
			case "1s":
				return "Reroll 1s";
			case "all":
				return "Reroll Fails";
		}
	};

	const getRerollDispelLabel = (reroll: DispelRerollType): string => {
		switch (reroll) {
			case "none":
				return "No Reroll";
			case "all":
				return "Reroll Fails";
		}
	};

	const runSimulation = () => {
		setIsSimulating(true);
		// Use setTimeout to allow UI to update before blocking simulation
		setTimeout(() => {
			const simResults = runMagicSimulation({
				...inputs,
				iterations: 50000,
			});
			setResults(simResults);
			setIsSimulating(false);
		}, 10);
	};

	return (
		<div className="space-y-4">
			<Card className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-card border-border">
				{/* Dice Values Grid - Main Parameters */}
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
					{/* Casting Dice Column */}
					<div className="flex flex-col space-y-1.5 order-1 sm:order-1">
						<Label className="text-sm text-muted-foreground text-center">Casting Dice</Label>
						{/* Mobile: +/- buttons in separate row */}
						<div className="flex sm:hidden gap-1">
							<button
								type="button"
								onClick={decreaseCastingDice}
								className="flex-1 h-10 text-2xl font-bold bg-primary border-2 border-purple-500/50 rounded-md hover:bg-secondary/80 text-foreground transition-colors"
							>
								−
							</button>
							<button
								type="button"
								onClick={increaseCastingDice}
								className="flex-1 h-10 text-2xl font-bold bg-primary border-2 border-purple-500/50 rounded-md hover:bg-secondary/80 text-foreground transition-colors"
							>
								+
							</button>
						</div>
						{/* Desktop: +/- buttons inside main button */}
						<div className="relative w-full h-20 sm:h-24 bg-primary border-2 border-purple-500/50 rounded-md overflow-hidden">
							<button
								type="button"
								onClick={decreaseCastingDice}
								className="hidden sm:block absolute left-0 top-0 h-full px-3 sm:px-4 text-2xl sm:text-3xl font-bold hover:bg-secondary/80 text-foreground transition-colors z-10"
							>
								−
							</button>
							<button
								type="button"
								onClick={cycleCastingDice}
								className="w-full h-full text-3xl sm:text-4xl font-bold hover:bg-secondary/80 text-foreground transition-colors"
							>
								{inputs.castingDice} dice
							</button>
							<button
								type="button"
								onClick={increaseCastingDice}
								className="hidden sm:block absolute right-0 top-0 h-full px-3 sm:px-4 text-2xl sm:text-3xl font-bold hover:bg-secondary/80 text-foreground transition-colors z-10"
							>
								+
							</button>
						</div>
						<div className="grid grid-cols-2 gap-1">
							<Button
								onClick={cycleCastingModifier}
								className={`w-full h-7 text-[9px] sm:text-xs leading-tight ${
									inputs.castingModifier !== 0
										? "bg-blue-600 hover:bg-blue-700 text-white"
										: "bg-secondary hover:bg-secondary/80"
								}`}
								variant="outline"
							>
								{getModifierLabel(inputs.castingModifier)}
							</Button>
							<Button
								onClick={cycleRerollCasting}
								className={`w-full h-7 text-[9px] sm:text-xs leading-tight ${
									inputs.rerollCasting !== "none"
										? "bg-blue-600 hover:bg-blue-700 text-white"
										: "bg-secondary hover:bg-secondary/80"
								}`}
								variant="outline"
							>
								{getRerollCastingLabel(inputs.rerollCasting)}
							</Button>
						</div>
						<Button
							onClick={() => {
								const newSpellType = spellType === "learned" ? "bound" : "learned";
								setSpellType(newSpellType);
								updateInput("isBoundSpell", newSpellType === "bound");
							}}
							className={`w-full h-7 text-[9px] sm:text-xs leading-tight ${
								spellType === "bound"
									? "bg-blue-600 hover:bg-blue-700 text-white"
									: "bg-secondary hover:bg-secondary/80"
							}`}
							variant="outline"
						>
							{spellType === "learned" ? "Learned Spell" : "Bound Spell"}
						</Button>
					</div>

					{/* Casting Value Column */}
					<div className="flex flex-col space-y-1.5 order-3 sm:order-2 col-span-2 sm:col-span-1 justify-self-center w-full max-w-[calc(50%-0.375rem)] sm:max-w-none">
						<Label className="text-sm text-muted-foreground text-center">Casting Value</Label>
						{/* Mobile: +/- buttons in separate row */}
						<div className="flex sm:hidden gap-1">
							<button
								type="button"
								onClick={decreaseCastingValue}
								className="flex-1 h-10 text-2xl font-bold bg-primary border-2 border-purple-500/50 rounded-md hover:bg-secondary/80 text-foreground transition-colors"
							>
								−
							</button>
							<button
								type="button"
								onClick={increaseCastingValue}
								className="flex-1 h-10 text-2xl font-bold bg-primary border-2 border-purple-500/50 rounded-md hover:bg-secondary/80 text-foreground transition-colors"
							>
								+
							</button>
						</div>
						{/* Desktop: +/- buttons inside main button */}
						<div className="relative w-full h-20 sm:h-24 bg-primary border-2 border-purple-500/50 rounded-md overflow-hidden">
							<button
								type="button"
								onClick={decreaseCastingValue}
								className="hidden sm:block absolute left-0 top-0 h-full px-3 sm:px-4 text-2xl sm:text-3xl font-bold hover:bg-secondary/80 text-foreground transition-colors z-10"
							>
								−
							</button>
							<button
								type="button"
								onClick={cycleCastingValue}
								className="w-full h-full text-3xl sm:text-4xl font-bold hover:bg-secondary/80 text-foreground transition-colors"
							>
								{inputs.castingValue}+
							</button>
							<button
								type="button"
								onClick={increaseCastingValue}
								className="hidden sm:block absolute right-0 top-0 h-full px-3 sm:px-4 text-2xl sm:text-3xl font-bold hover:bg-secondary/80 text-foreground transition-colors z-10"
							>
								+
							</button>
						</div>
						<Button
							onClick={cycleMagicResistance}
							className={`w-full h-7 sm:h-7 text-[10px] sm:text-xs leading-tight ${
								inputs.magicResistance !== 0
									? "bg-blue-600 hover:bg-blue-700 text-white"
									: "bg-secondary hover:bg-secondary/80"
							}`}
							variant="outline"
						>
							{getMagicResistanceLabel(inputs.magicResistance)}
						</Button>
					</div>

					{/* Dispel Dice Column */}
					<div className="flex flex-col space-y-1.5 order-2 sm:order-3">
						<Label className="text-sm text-muted-foreground text-center">Dispel Dice</Label>
						{/* Mobile: +/- buttons in separate row */}
						<div className="flex sm:hidden gap-1">
							<button
								type="button"
								onClick={decreaseDispelDice}
								className="flex-1 h-10 text-2xl font-bold bg-primary border-2 border-purple-500/50 rounded-md hover:bg-secondary/80 text-foreground transition-colors"
							>
								−
							</button>
							<button
								type="button"
								onClick={increaseDispelDice}
								className="flex-1 h-10 text-2xl font-bold bg-primary border-2 border-purple-500/50 rounded-md hover:bg-secondary/80 text-foreground transition-colors"
							>
								+
							</button>
						</div>
						{/* Desktop: +/- buttons inside main button */}
						<div className="relative w-full h-20 sm:h-24 bg-primary border-2 border-purple-500/50 rounded-md overflow-hidden">
							<button
								type="button"
								onClick={decreaseDispelDice}
								className="hidden sm:block absolute left-0 top-0 h-full px-3 sm:px-4 text-2xl sm:text-3xl font-bold hover:bg-secondary/80 text-foreground transition-colors z-10"
							>
								−
							</button>
							<button
								type="button"
								onClick={cycleDispelDice}
								className="w-full h-full text-3xl sm:text-4xl font-bold hover:bg-secondary/80 text-foreground transition-colors"
							>
								{inputs.dispelDice === 0 ? "NONE" : `${inputs.dispelDice} dice`}
							</button>
							<button
								type="button"
								onClick={increaseDispelDice}
								className="hidden sm:block absolute right-0 top-0 h-full px-3 sm:px-4 text-2xl sm:text-3xl font-bold hover:bg-secondary/80 text-foreground transition-colors z-10"
							>
								+
							</button>
						</div>
						<div className="grid grid-cols-2 gap-1">
							<Button
								onClick={cycleDispelModifier}
								className={`w-full h-7 text-[9px] sm:text-xs leading-tight ${
									inputs.dispelModifier !== 0
										? "bg-blue-600 hover:bg-blue-700 text-white"
										: "bg-secondary hover:bg-secondary/80"
								}`}
								variant="outline"
							>
								{getModifierLabel(inputs.dispelModifier)}
							</Button>
							<Button
								onClick={cycleRerollDispel}
								className={`w-full h-7 text-[9px] sm:text-xs leading-tight ${
									inputs.rerollDispel !== "none"
										? "bg-blue-600 hover:bg-blue-700 text-white"
										: "bg-secondary hover:bg-secondary/80"
								}`}
								variant="outline"
							>
								{getRerollDispelLabel(inputs.rerollDispel)}
							</Button>
						</div>
					</div>
				</div>
			</Card>

			{/* Simulate Button */}
			<Button
				onClick={runSimulation}
				disabled={isSimulating}
				className="w-full h-12 sm:h-14 text-lg sm:text-xl bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
			>
				Simulate
			</Button>

			{/* Results */}
			{results && (
				<Card className="p-6 bg-card border-border">
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-center text-foreground">Results</h3>
						<div className="flex flex-col sm:grid sm:grid-cols-3 gap-4">
							<div className="space-y-2 text-center order-3 sm:order-1">
								<div className="text-xs text-muted-foreground uppercase tracking-wide">Cast Failure</div>
								<div
									className={`text-3xl font-mono font-bold px-3 py-2 rounded ${getInvertedProbabilityColor(
										results.castingFailPercent,
									)}`}
								>
									{results.castingFailPercent.toFixed(1)}%
								</div>
							</div>

							<div className="space-y-2 text-center order-2 sm:order-2">
								<div className="text-xs text-muted-foreground uppercase tracking-wide">Dispelled</div>
								<div
									className={`text-3xl font-mono font-bold px-3 py-2 rounded ${getInvertedProbabilityColor(
										results.dispelSuccessPercent,
									)}`}
								>
									{results.dispelSuccessPercent.toFixed(1)}%
								</div>
							</div>

							<div className="space-y-2 text-center order-1 sm:order-3">
								<div className="text-xs text-muted-foreground uppercase tracking-wide">Spell Success</div>
								<div
									className={`text-3xl font-mono font-bold px-3 py-2 rounded ${getProbabilityColor(
										results.spellSuccessPercent,
									)}`}
								>
									{results.spellSuccessPercent.toFixed(1)}%
								</div>
							</div>
						</div>
					</div>
				</Card>
			)}
		</div>
	);
}
