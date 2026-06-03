import { useState } from "react";
import { type FailureRerollType, parseDiceExpression, type SpecialSaveType, type SuccessRerollType } from "../engine";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type ToggleValue = 2 | 3 | 4 | 5 | 6 | "auto" | "none";

export interface DiceInputState {
	id: string;
	numAttacks: string;
	hit: ToggleValue;
	wound: ToggleValue;
	armorSave: ToggleValue;
	specialSave: ToggleValue;
	specialSaveType: SpecialSaveType;
	rerollHitFailures: FailureRerollType;
	rerollHitSuccesses: SuccessRerollType;
	rerollWoundFailures: FailureRerollType;
	rerollWoundSuccesses: SuccessRerollType;
	rerollArmorSaveFailures: FailureRerollType;
	rerollArmorSaveSuccesses: SuccessRerollType;
	rerollSpecialSaveFailures: FailureRerollType;
	rerollSpecialSaveSuccesses: SuccessRerollType;
	poison: boolean;
	poisonOn5Plus: boolean;
	lethalStrike: boolean;
	fury: boolean;
	redFury: boolean;
	multipleWounds: string;
	targetMaxWounds: string;
}

interface DiceInputProps {
	input: DiceInputState;
	onUpdate: (id: string, updates: Partial<DiceInputState>) => void;
	onRemove: (id: string) => void;
	showRemove: boolean;
}

interface DiceColumnProps {
	label: string;
	displayValue: string;
	onCycleValue: () => void;
	failureReroll: FailureRerollType;
	successReroll: SuccessRerollType;
	onCycleFailureReroll: () => void;
	onCycleSuccessReroll: () => void;
	failureRerollLabel: string;
	successRerollLabel: string;
	children?: React.ReactNode;
}

function DiceColumn({
	label,
	displayValue,
	onCycleValue,
	failureReroll,
	successReroll,
	onCycleFailureReroll,
	onCycleSuccessReroll,
	failureRerollLabel,
	successRerollLabel,
	children,
}: DiceColumnProps) {
	return (
		<div className="flex flex-col space-y-1.5">
			<Label className="text-sm text-muted-foreground text-center">{label}</Label>
			<Button
				onClick={onCycleValue}
				className="w-full h-20 sm:h-24 text-3xl sm:text-4xl font-bold bg-primary border-2 border-brand-green/50 hover:bg-secondary/80 text-foreground"
				variant="outline"
			>
				{displayValue}
			</Button>
			<div className="flex flex-col sm:flex-row gap-1">
				<Button
					onClick={onCycleFailureReroll}
					className={`flex-1 h-7 sm:h-7 text-[9px] sm:text-[10px] leading-tight px-1 ${
						failureReroll !== "none" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-secondary hover:bg-secondary/80"
					}`}
					variant="outline"
				>
					{failureRerollLabel}
				</Button>
				<Button
					onClick={onCycleSuccessReroll}
					className={`flex-1 h-7 sm:h-7 text-[9px] sm:text-[10px] leading-tight px-1 ${
						successReroll !== "none" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-secondary hover:bg-secondary/80"
					}`}
					variant="outline"
				>
					{successRerollLabel}
				</Button>
			</div>
			{children}
		</div>
	);
}

const HIT_OPTIONS: ToggleValue[] = [2, 3, 4, 5, 6, "auto"];
const WOUND_OPTIONS: ToggleValue[] = [2, 3, 4, 5, 6, "auto"];
const SAVE_OPTIONS: ToggleValue[] = [2, 3, 4, 5, 6, "none"];
const FAILURE_REROLL_OPTIONS: FailureRerollType[] = ["none", "1s", "all"];
const SUCCESS_REROLL_OPTIONS: SuccessRerollType[] = ["none", "6s", "all"];

function cycleNext<T>(options: T[], current: T): T {
	return options[(options.indexOf(current) + 1) % options.length] as T;
}

function failureRerollLabel(reroll: FailureRerollType): string {
	if (reroll === "1s") return "Reroll 1s";
	if (reroll === "all") return "Reroll fails";
	return "No fail rerolls";
}

function successRerollLabel(reroll: SuccessRerollType): string {
	if (reroll === "6s") return "Reroll 6s";
	if (reroll === "all") return "Reroll successes";
	return "No success rerolls";
}

function toggleClass(active: boolean): string {
	return active ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-secondary hover:bg-secondary/80";
}

export function DiceInput({ input, onUpdate, onRemove, showRemove }: DiceInputProps) {
	const [isNumAttacksValid, setIsNumAttacksValid] = useState<boolean>(true);
	const [showSpecialRules, setShowSpecialRules] = useState<boolean>(false);

	const up = (updates: Partial<DiceInputState>) => onUpdate(input.id, updates);

	return (
		<Card className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-card border-border relative">
			{showRemove && (
				<Button
					onClick={() => onRemove(input.id)}
					className="absolute top-1 right-1 sm:top-2 sm:right-2 h-6 w-6 sm:h-8 sm:w-8 p-0 text-base sm:text-lg bg-red-500 hover:bg-red-600 text-white"
					variant="outline"
				>
					×
				</Button>
			)}

			{/* Number of Attacks Input */}
			<div className="space-y-2">
				<Label htmlFor={`attacks-${input.id}`} className="text-sm text-foreground">
					Number of Attacks
				</Label>
				<Input
					id={`attacks-${input.id}`}
					type="text"
					value={input.numAttacks}
					onChange={(e) => {
						up({ numAttacks: e.target.value });
						try {
							parseDiceExpression(e.target.value);
							setIsNumAttacksValid(true);
						} catch {
							setIsNumAttacksValid(false);
						}
					}}
					className={`bg-input text-foreground placeholder:text-gray-400 ${
						isNumAttacksValid ? "border-border" : "border-red-500 border-2"
					}`}
					placeholder="10, 2d6, 2d3+1"
				/>
			</div>

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				<DiceColumn
					label="To Hit"
					displayValue={input.hit === "auto" ? "AUTO" : `${input.hit}+`}
					onCycleValue={() => up({ hit: cycleNext(HIT_OPTIONS, input.hit) })}
					failureReroll={input.rerollHitFailures}
					successReroll={input.rerollHitSuccesses}
					onCycleFailureReroll={() =>
						up({ rerollHitFailures: cycleNext(FAILURE_REROLL_OPTIONS, input.rerollHitFailures) })
					}
					onCycleSuccessReroll={() =>
						up({ rerollHitSuccesses: cycleNext(SUCCESS_REROLL_OPTIONS, input.rerollHitSuccesses) })
					}
					failureRerollLabel={failureRerollLabel(input.rerollHitFailures)}
					successRerollLabel={successRerollLabel(input.rerollHitSuccesses)}
				>
					<Button
						onClick={() => up({ poison: !input.poison })}
						className={`w-full h-7 sm:h-7 text-[10px] sm:text-xs leading-tight ${toggleClass(input.poison)}`}
						variant="outline"
					>
						Poison
					</Button>
					<Button
						onClick={() => up({ fury: !input.fury })}
						className={`w-full h-7 sm:h-7 text-[10px] sm:text-xs leading-tight ${toggleClass(input.fury)}`}
						variant="outline"
					>
						Fury
					</Button>
				</DiceColumn>

				<DiceColumn
					label="To Wound"
					displayValue={input.wound === "auto" ? "AUTO" : `${input.wound}+`}
					onCycleValue={() => up({ wound: cycleNext(WOUND_OPTIONS, input.wound) })}
					failureReroll={input.rerollWoundFailures}
					successReroll={input.rerollWoundSuccesses}
					onCycleFailureReroll={() =>
						up({ rerollWoundFailures: cycleNext(FAILURE_REROLL_OPTIONS, input.rerollWoundFailures) })
					}
					onCycleSuccessReroll={() =>
						up({ rerollWoundSuccesses: cycleNext(SUCCESS_REROLL_OPTIONS, input.rerollWoundSuccesses) })
					}
					failureRerollLabel={failureRerollLabel(input.rerollWoundFailures)}
					successRerollLabel={successRerollLabel(input.rerollWoundSuccesses)}
				>
					<Button
						onClick={() => up({ lethalStrike: !input.lethalStrike })}
						className={`w-full h-7 sm:h-7 text-[10px] sm:text-xs leading-tight ${toggleClass(input.lethalStrike)}`}
						variant="outline"
					>
						Lethal Strike
					</Button>
				</DiceColumn>

				<DiceColumn
					label="Armor Save"
					displayValue={input.armorSave === "none" ? "NONE" : `${input.armorSave}+`}
					onCycleValue={() => up({ armorSave: cycleNext(SAVE_OPTIONS, input.armorSave) })}
					failureReroll={input.rerollArmorSaveFailures}
					successReroll={input.rerollArmorSaveSuccesses}
					onCycleFailureReroll={() =>
						up({ rerollArmorSaveFailures: cycleNext(FAILURE_REROLL_OPTIONS, input.rerollArmorSaveFailures) })
					}
					onCycleSuccessReroll={() =>
						up({ rerollArmorSaveSuccesses: cycleNext(SUCCESS_REROLL_OPTIONS, input.rerollArmorSaveSuccesses) })
					}
					failureRerollLabel={failureRerollLabel(input.rerollArmorSaveFailures)}
					successRerollLabel={successRerollLabel(input.rerollArmorSaveSuccesses)}
				/>

				<DiceColumn
					label="Special Save"
					displayValue={input.specialSave === "none" ? "NONE" : `${input.specialSave}+`}
					onCycleValue={() => up({ specialSave: cycleNext(SAVE_OPTIONS, input.specialSave) })}
					failureReroll={input.rerollSpecialSaveFailures}
					successReroll={input.rerollSpecialSaveSuccesses}
					onCycleFailureReroll={() =>
						up({ rerollSpecialSaveFailures: cycleNext(FAILURE_REROLL_OPTIONS, input.rerollSpecialSaveFailures) })
					}
					onCycleSuccessReroll={() =>
						up({ rerollSpecialSaveSuccesses: cycleNext(SUCCESS_REROLL_OPTIONS, input.rerollSpecialSaveSuccesses) })
					}
					failureRerollLabel={failureRerollLabel(input.rerollSpecialSaveFailures)}
					successRerollLabel={successRerollLabel(input.rerollSpecialSaveSuccesses)}
				>
					{input.lethalStrike && (
						<div className="flex flex-col sm:flex-row gap-1 w-full">
							<Button
								onClick={() => up({ specialSaveType: "aegis" })}
								className={`flex-1 h-7 sm:h-7 text-[10px] sm:text-xs leading-tight ${toggleClass(input.specialSaveType === "aegis")}`}
								variant="outline"
							>
								Aegis
							</Button>
							<Button
								onClick={() => up({ specialSaveType: "regeneration" })}
								className={`flex-1 h-7 sm:h-7 text-[10px] sm:text-xs leading-tight ${toggleClass(input.specialSaveType === "regeneration")}`}
								variant="outline"
							>
								Regen
							</Button>
						</div>
					)}
				</DiceColumn>
			</div>

			{/* Special Rules Accordion */}
			<div className="border-t border-border pt-3">
				<button
					type="button"
					onClick={() => setShowSpecialRules(!showSpecialRules)}
					className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors pb-2"
				>
					<div className="flex items-center justify-between">
						<span>Special rules</span>
						<span className="text-xs">{showSpecialRules ? "▼" : "▶"}</span>
					</div>
				</button>

				{showSpecialRules && (
					<div className="space-y-3 sm:space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
							<div className="space-y-2">
								<Label htmlFor={`mw-${input.id}`} className="text-sm text-foreground">
									Multiple Wounds
								</Label>
								<Input
									id={`mw-${input.id}`}
									type="text"
									value={input.multipleWounds}
									onChange={(e) => up({ multipleWounds: e.target.value })}
									className="bg-input text-foreground placeholder:text-gray-500"
									placeholder="1, d3, d6+1"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`max-${input.id}`} className="text-sm text-foreground">
									Target Max Wounds
								</Label>
								<Input
									id={`max-${input.id}`}
									type="text"
									value={input.targetMaxWounds}
									onChange={(e) => up({ targetMaxWounds: e.target.value })}
									className="bg-input text-foreground placeholder:text-gray-400"
									placeholder="e.g. 3"
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
							<Button
								onClick={() => up({ poisonOn5Plus: !input.poisonOn5Plus })}
								className={`w-full h-7 sm:h-8 text-[10px] sm:text-xs leading-tight ${toggleClass(input.poisonOn5Plus)}`}
								variant="outline"
							>
								Poison (5+)
							</Button>
							<Button
								onClick={() => up({ redFury: !input.redFury })}
								className={`w-full h-7 sm:h-8 text-[10px] sm:text-xs leading-tight ${toggleClass(input.redFury)}`}
								variant="outline"
							>
								Red Fury
							</Button>
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}
