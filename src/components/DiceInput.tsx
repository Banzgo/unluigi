import { useState } from "react";
import { type FailureRerollType, parseDiceExpression, type SuccessRerollType } from "../engine";
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
	rerollHitFailures: FailureRerollType;
	rerollHitSuccesses: SuccessRerollType;
	rerollWoundFailures: FailureRerollType;
	rerollWoundSuccesses: SuccessRerollType;
	rerollArmorSaveFailures: FailureRerollType;
	rerollArmorSaveSuccesses: SuccessRerollType;
	rerollSpecialSaveFailures: FailureRerollType;
	rerollSpecialSaveSuccesses: SuccessRerollType;
	poison: boolean;
	lethalStrike: boolean;
	fury: boolean;
	multipleWounds: string;
	targetMaxWounds: string;
}

interface DiceInputProps {
	input: DiceInputState;
	onUpdate: (id: string, updates: Partial<DiceInputState>) => void;
	onRemove: (id: string) => void;
	showRemove: boolean;
}

export function DiceInput({ input, onUpdate, onRemove, showRemove }: DiceInputProps) {
	const [isNumAttacksValid, setIsNumAttacksValid] = useState<boolean>(true);
	const [showMultipleWounds, setShowMultipleWounds] = useState<boolean>(false);

	const hitOptions: ToggleValue[] = [2, 3, 4, 5, 6, "auto"];
	const woundOptions: ToggleValue[] = [2, 3, 4, 5, 6, "auto"];
	const saveOptions: ToggleValue[] = [2, 3, 4, 5, 6, "none"];
	const failureRerollOptions: FailureRerollType[] = ["none", "1s", "all"];
	const successRerollOptions: SuccessRerollType[] = ["none", "6s", "all"];

	const cycleValue = (current: ToggleValue, options: ToggleValue[]) => {
		const currentIndex = options.indexOf(current);
		return options[(currentIndex + 1) % options.length];
	};

	const cycleFailureReroll = (current: FailureRerollType): FailureRerollType => {
		const currentIndex = failureRerollOptions.indexOf(current);
		return failureRerollOptions[(currentIndex + 1) % failureRerollOptions.length];
	};

	const cycleSuccessReroll = (current: SuccessRerollType): SuccessRerollType => {
		const currentIndex = successRerollOptions.indexOf(current);
		return successRerollOptions[(currentIndex + 1) % successRerollOptions.length];
	};

	const getFailureRerollLabel = (reroll: FailureRerollType) => {
		switch (reroll) {
			case "none":
				return "No fail rerolls";
			case "1s":
				return "Reroll 1s";
			case "all":
				return "Reroll fails";
		}
	};

	const getSuccessRerollLabel = (reroll: SuccessRerollType) => {
		switch (reroll) {
			case "none":
				return "No success rerolls";
			case "6s":
				return "Reroll 6s";
			case "all":
				return "Reroll successes";
		}
	};

	const validateNumAttacks = (value: string): boolean => {
		if (!value || value.trim() === "") {
			return false;
		}
		try {
			parseDiceExpression(value);
			return true;
		} catch {
			return false;
		}
	};

	const handleNumAttacksChange = (value: string) => {
		onUpdate(input.id, { numAttacks: value });
		setIsNumAttacksValid(validateNumAttacks(value));
	};

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
					onChange={(e) => handleNumAttacksChange(e.target.value)}
					className={`bg-input text-foreground placeholder:text-gray-400 ${
						isNumAttacksValid ? "border-border" : "border-red-500 border-2"
					}`}
					placeholder="10, 2d6, 2d3+1"
				/>
			</div>

			{/* Dice Values and Special Rules Grid */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				{/* Hit Column */}
				<div className="flex flex-col space-y-1.5">
					<Label className="text-sm text-muted-foreground text-center">To Hit</Label>
					<Button
						onClick={() => onUpdate(input.id, { hit: cycleValue(input.hit, hitOptions) })}
						className="w-full h-20 sm:h-24 text-3xl sm:text-4xl font-bold bg-primary border-2 border-brand-green/50 hover:bg-secondary/80 text-foreground"
						variant="outline"
					>
						{input.hit === "auto" ? "AUTO" : `${input.hit}+`}
					</Button>
					<div className="flex flex-col sm:flex-row gap-1">
						<Button
							onClick={() =>
								onUpdate(input.id, {
									rerollHitFailures: cycleFailureReroll(input.rerollHitFailures),
								})
							}
							className={`flex-1 h-7 sm:h-7 text-[9px] sm:text-[10px] leading-tight px-1 ${
								input.rerollHitFailures !== "none"
									? "bg-blue-600 hover:bg-blue-700 text-white"
									: "bg-secondary hover:bg-secondary/80"
							}`}
							variant="outline"
						>
							{getFailureRerollLabel(input.rerollHitFailures)}
						</Button>
						<Button
							onClick={() =>
								onUpdate(input.id, {
									rerollHitSuccesses: cycleSuccessReroll(input.rerollHitSuccesses),
								})
							}
							className={`flex-1 h-7 sm:h-7 text-[9px] sm:text-[10px] leading-tight px-1 ${
								input.rerollHitSuccesses !== "none"
									? "bg-blue-600 hover:bg-blue-700 text-white"
									: "bg-secondary hover:bg-secondary/80"
							}`}
							variant="outline"
						>
							{getSuccessRerollLabel(input.rerollHitSuccesses)}
						</Button>
					</div>
					<Button
						onClick={() => onUpdate(input.id, { poison: !input.poison })}
						className={`w-full h-7 sm:h-7 text-[10px] sm:text-xs leading-tight ${
							input.poison ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-secondary hover:bg-secondary/80"
						}`}
						variant="outline"
					>
						Poison
					</Button>
					<Button
						onClick={() => onUpdate(input.id, { fury: !input.fury })}
						className={`w-full h-7 sm:h-7 text-[10px] sm:text-xs leading-tight ${
							input.fury ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-secondary hover:bg-secondary/80"
						}`}
						variant="outline"
					>
						Fury
					</Button>
				</div>

				{/* Wound Column */}
				<div className="flex flex-col space-y-1.5">
					<Label className="text-sm text-muted-foreground text-center">To Wound</Label>
					<Button
						onClick={() =>
							onUpdate(input.id, {
								wound: cycleValue(input.wound, woundOptions),
							})
						}
						className="w-full h-20 sm:h-24 text-3xl sm:text-4xl font-bold bg-primary border-2 border-brand-green/50 hover:bg-secondary/80 text-foreground"
						variant="outline"
					>
						{input.wound === "auto" ? "AUTO" : `${input.wound}+`}
					</Button>
					<div className="flex flex-col sm:flex-row gap-1">
						<Button
							onClick={() =>
								onUpdate(input.id, {
									rerollWoundFailures: cycleFailureReroll(input.rerollWoundFailures),
								})
							}
							className={`flex-1 h-7 sm:h-7 text-[9px] sm:text-[10px] leading-tight px-1 ${
								input.rerollWoundFailures !== "none"
									? "bg-blue-600 hover:bg-blue-700 text-white"
									: "bg-secondary hover:bg-secondary/80"
							}`}
							variant="outline"
						>
							{getFailureRerollLabel(input.rerollWoundFailures)}
						</Button>
						<Button
							onClick={() =>
								onUpdate(input.id, {
									rerollWoundSuccesses: cycleSuccessReroll(input.rerollWoundSuccesses),
								})
							}
							className={`flex-1 h-7 sm:h-7 text-[9px] sm:text-[10px] leading-tight px-1 ${
								input.rerollWoundSuccesses !== "none"
									? "bg-blue-600 hover:bg-blue-700 text-white"
									: "bg-secondary hover:bg-secondary/80"
							}`}
							variant="outline"
						>
							{getSuccessRerollLabel(input.rerollWoundSuccesses)}
						</Button>
					</div>
					<Button
						onClick={() => onUpdate(input.id, { lethalStrike: !input.lethalStrike })}
						className={`w-full h-7 sm:h-7 text-[10px] sm:text-xs leading-tight ${
							input.lethalStrike ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-secondary hover:bg-secondary/80"
						}`}
						variant="outline"
					>
						Lethal Strike
					</Button>
				</div>

				{/* Armor Save Column */}
				<div className="flex flex-col space-y-1.5">
					<Label className="text-sm text-muted-foreground text-center">Armor Save</Label>
					<Button
						onClick={() =>
							onUpdate(input.id, {
								armorSave: cycleValue(input.armorSave, saveOptions),
							})
						}
						className="w-full h-20 sm:h-24 text-3xl sm:text-4xl font-bold bg-primary border-2 border-brand-green/50 hover:bg-secondary/80 text-foreground"
						variant="outline"
					>
						{input.armorSave === "none" ? "NONE" : `${input.armorSave}+`}
					</Button>
					<div className="flex flex-col sm:flex-row gap-1">
						<Button
							onClick={() =>
								onUpdate(input.id, {
									rerollArmorSaveFailures: cycleFailureReroll(input.rerollArmorSaveFailures),
								})
							}
							className={`flex-1 h-7 sm:h-7 text-[9px] sm:text-[10px] leading-tight px-1 ${
								input.rerollArmorSaveFailures !== "none"
									? "bg-blue-600 hover:bg-blue-700 text-white"
									: "bg-secondary hover:bg-secondary/80"
							}`}
							variant="outline"
						>
							{getFailureRerollLabel(input.rerollArmorSaveFailures)}
						</Button>
						<Button
							onClick={() =>
								onUpdate(input.id, {
									rerollArmorSaveSuccesses: cycleSuccessReroll(input.rerollArmorSaveSuccesses),
								})
							}
							className={`flex-1 h-7 sm:h-7 text-[9px] sm:text-[10px] leading-tight px-1 ${
								input.rerollArmorSaveSuccesses !== "none"
									? "bg-blue-600 hover:bg-blue-700 text-white"
									: "bg-secondary hover:bg-secondary/80"
							}`}
							variant="outline"
						>
							{getSuccessRerollLabel(input.rerollArmorSaveSuccesses)}
						</Button>
					</div>
				</div>

				{/* Special Save Column */}
				<div className="flex flex-col space-y-1.5">
					<Label className="text-sm text-muted-foreground text-center">Special Save</Label>
					<Button
						onClick={() =>
							onUpdate(input.id, {
								specialSave: cycleValue(input.specialSave, saveOptions),
							})
						}
						className="w-full h-20 sm:h-24 text-3xl sm:text-4xl font-bold bg-primary border-2 border-brand-green/50 hover:bg-secondary/80 text-foreground"
						variant="outline"
					>
						{input.specialSave === "none" ? "NONE" : `${input.specialSave}+`}
					</Button>
					<div className="flex flex-col sm:flex-row gap-1">
						<Button
							onClick={() =>
								onUpdate(input.id, {
									rerollSpecialSaveFailures: cycleFailureReroll(input.rerollSpecialSaveFailures),
								})
							}
							className={`flex-1 h-7 sm:h-7 text-[9px] sm:text-[10px] leading-tight px-1 ${
								input.rerollSpecialSaveFailures !== "none"
									? "bg-blue-600 hover:bg-blue-700 text-white"
									: "bg-secondary hover:bg-secondary/80"
							}`}
							variant="outline"
						>
							{getFailureRerollLabel(input.rerollSpecialSaveFailures)}
						</Button>
						<Button
							onClick={() =>
								onUpdate(input.id, {
									rerollSpecialSaveSuccesses: cycleSuccessReroll(input.rerollSpecialSaveSuccesses),
								})
							}
							className={`flex-1 h-7 sm:h-7 text-[9px] sm:text-[10px] leading-tight px-1 ${
								input.rerollSpecialSaveSuccesses !== "none"
									? "bg-blue-600 hover:bg-blue-700 text-white"
									: "bg-secondary hover:bg-secondary/80"
							}`}
							variant="outline"
						>
							{getSuccessRerollLabel(input.rerollSpecialSaveSuccesses)}
						</Button>
					</div>
				</div>
			</div>

			{/* Multiple Wounds Accordion */}
			<div className="border-t border-border pt-3">
				<button
					type="button"
					onClick={() => setShowMultipleWounds(!showMultipleWounds)}
					className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors pb-2"
				>
					{showMultipleWounds ? (
						<>
							<div className="flex items-center justify-between sm:hidden">
								<span>Multiple Wounds</span>
								<span className="text-xs">▼</span>
							</div>
							<div className="hidden sm:grid sm:grid-cols-2 gap-3 sm:gap-4 items-center">
								<div className="flex items-center justify-between">
									<span>Multiple Wounds</span>
								</div>
								<div className="flex items-center justify-between">
									<span>Target Max Wounds</span>
									<span className="text-xs">▼</span>
								</div>
							</div>
						</>
					) : (
						<div className="flex items-center justify-between">
							<span>Multiple Wounds</span>
							<span className="text-xs">▶</span>
						</div>
					)}
				</button>

				{showMultipleWounds && (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
						<div className="space-y-2">
							<Input
								id={`mw-${input.id}`}
								type="text"
								value={input.multipleWounds}
								onChange={(e) => onUpdate(input.id, { multipleWounds: e.target.value })}
								className="bg-input text-foreground placeholder:text-gray-500"
								placeholder="1, d3, d6+1"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`max-${input.id}`} className="text-sm text-foreground sm:hidden">
								Target Max Wounds
							</Label>
							<Input
								id={`max-${input.id}`}
								type="text"
								value={input.targetMaxWounds}
								onChange={(e) =>
									onUpdate(input.id, {
										targetMaxWounds: e.target.value,
									})
								}
								className="bg-input text-foreground placeholder:text-gray-400"
								placeholder="e.g. 3"
							/>
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}
