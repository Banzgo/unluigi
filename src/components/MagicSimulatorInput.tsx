import { useEffect, useRef, useState } from "react";
import { SteppedCycleControl } from "@/components/SteppedCycleControl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	type CastingRerollType,
	type DispelRerollType,
	type MagicSimulationResults,
	runMagicSimulation,
} from "@/engine";
import { getProbabilityColor } from "@/utils/probability-color";
import { copySimUrl, encodeMagicShareState, type MagicSharePayloadV1 } from "@/utils/share";

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

export type SpellType = "learned" | "bound";
type CastingDiceValue = 2 | 3 | 4 | 5;
type DispelDiceValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type CastingValueOption = 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

function getInvertedProbabilityColor(prob: number): string {
	return getProbabilityColor(100 - prob);
}

interface MagicSimulatorInputProps {
	initialState?: Partial<MagicSimulatorInputState>;
	initialSpellType?: SpellType;
	autoRun?: boolean;
}

const MAGIC_DEFAULT_STATE: MagicSimulatorInputState = {
	castingDice: 3,
	dispelDice: 3,
	castingValue: 7,
	castingModifier: 0,
	dispelModifier: 0,
	magicResistance: 0,
	rerollCasting: "none",
	rerollDispel: "none",
	isBoundSpell: false,
};

export function MagicSimulatorInput({ initialState, initialSpellType, autoRun }: MagicSimulatorInputProps = {}) {
	const castingDiceOptions: CastingDiceValue[] = [2, 3, 4, 5];
	const dispelDiceOptions: DispelDiceValue[] = [0, 1, 2, 3, 4, 5, 6, 7];
	const castingValueOptions: CastingValueOption[] = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
	const modifierOptions = [-2, -1, 0, 1, 2];
	const magicResistanceOptions = [0, 1, 2, 3];
	const castingRerollOptions: CastingRerollType[] = ["none", "1s", "all"];
	const dispelRerollOptions: DispelRerollType[] = ["none", "all"];

	const [spellType, setSpellType] = useState<SpellType>(initialSpellType ?? "learned");
	const [inputs, setInputs] = useState<MagicSimulatorInputState>(() => ({
		...MAGIC_DEFAULT_STATE,
		...(initialState ?? {}),
		isBoundSpell: initialState?.isBoundSpell ?? initialSpellType === "bound",
	}));

	const [results, setResults] = useState<MagicSimulationResults | null>(null);
	const [isSimulating, setIsSimulating] = useState(false);
	const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");
	const hasAutoRun = useRef(false);
	const initialInputsRef = useRef<MagicSimulatorInputState | null>(null);

	const updateInput = <K extends keyof MagicSimulatorInputState>(key: K, value: MagicSimulatorInputState[K]) => {
		setInputs((prev) => ({ ...prev, [key]: value }));
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

	useEffect(() => {
		// Capture the very first inputs we see so auto-run uses a stable snapshot
		if (initialInputsRef.current === null) {
			initialInputsRef.current = { ...inputs };
		}
	}, [inputs]);

	useEffect(() => {
		if (!autoRun || hasAutoRun.current) return;
		hasAutoRun.current = true;
		const snapshot = initialInputsRef.current ?? inputs;

		setIsSimulating(true);
		const simResults = runMagicSimulation({
			...snapshot,
			iterations: 50000,
		});
		setResults(simResults);
		setIsSimulating(false);
	}, [autoRun, inputs]);

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

	const handleShareClick = async () => {
		const diffEntries = (Object.keys(MAGIC_DEFAULT_STATE) as (keyof MagicSimulatorInputState)[])
			.filter((key) => inputs[key] !== MAGIC_DEFAULT_STATE[key])
			.map((key) => [key, inputs[key]]);

		const payload: MagicSharePayloadV1<Partial<MagicSimulatorInputState>> = {
			v: 1,
			inputs: Object.fromEntries(diffEntries) as Partial<MagicSimulatorInputState>,
			spellType,
		};
		await copySimUrl(encodeMagicShareState(payload), setShareStatus);
	};

	return (
		<div className="space-y-4">
			<Card className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-card border-border">
				{/* Dice Values Grid - Main Parameters */}
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
					{/* Casting Dice Column */}
					<SteppedCycleControl
						label="Casting Dice"
						className="order-1"
						value={inputs.castingDice}
						options={castingDiceOptions}
						onChange={(v) => updateInput("castingDice", v)}
						formatValue={(v) => `${v} dice`}
						accentClassName="border-purple-500/50"
					>
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
					</SteppedCycleControl>

					{/* Casting Value Column */}
					<SteppedCycleControl
						label="Casting Value"
						className="order-3 sm:order-2 col-span-2 sm:col-span-1 justify-self-center w-full max-w-[calc(50%-0.375rem)] sm:max-w-none"
						value={inputs.castingValue}
						options={castingValueOptions}
						onChange={(v) => updateInput("castingValue", v)}
						formatValue={(v) => `${v}+`}
						accentClassName="border-purple-500/50"
					>
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
					</SteppedCycleControl>

					{/* Dispel Dice Column */}
					<SteppedCycleControl
						label="Dispel Dice"
						className="order-2 sm:order-3"
						value={inputs.dispelDice}
						options={dispelDiceOptions}
						onChange={(v) => updateInput("dispelDice", v)}
						formatValue={(v) => (v === 0 ? "NONE" : `${v} dice`)}
						accentClassName="border-purple-500/50"
					>
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
					</SteppedCycleControl>
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
				<>
					<Card className="p-6 bg-card border-border">
						<div className="space-y-4">
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
				</>
			)}
		</div>
	);
}
