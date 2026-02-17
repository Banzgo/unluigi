import { useMemo, useState } from "react";
import { ProbabilityChart } from "@/components/ProbabilityChart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SimulationResults, UnitProfile } from "@/engine";
import {
	calculateArmorSave,
	calculateToHit,
	calculateToWound,
	profileToSimulationParams,
	runSimulationWithStats,
} from "@/engine";

export function ProfileView() {
	const [attacker, setAttacker] = useState<UnitProfile>({
		offensiveSkill: 4,
		defensiveSkill: 3,
		strength: 4,
		resilience: 3,
		armorPenetration: 1,
		attacks: "10",
		wounds: 1,
		armor: 3,
	});

	const [defender, setDefender] = useState<UnitProfile>({
		offensiveSkill: 3,
		defensiveSkill: 3,
		strength: 3,
		resilience: 3,
		armorPenetration: 0,
		attacks: "10",
		wounds: 1,
		armor: 3,
	});

	const [simResults, setSimResults] = useState<SimulationResults | null>(null);

	// Calculate dice values in real-time
	const calculatedValues = useMemo(() => {
		const toHit = calculateToHit(attacker.offensiveSkill, defender.defensiveSkill);
		const toWound = calculateToWound(attacker.strength, defender.resilience);
		const armorSave = calculateArmorSave(defender.armor, attacker.armorPenetration);

		return { toHit, toWound, armorSave };
	}, [
		attacker.offensiveSkill,
		defender.defensiveSkill,
		attacker.strength,
		defender.resilience,
		defender.armor,
		attacker.armorPenetration,
	]);

	const handleSimulate = () => {
		try {
			const params = profileToSimulationParams(attacker, defender);
			const results = runSimulationWithStats(params);
			setSimResults(results);
		} catch (error) {
			console.error("Simulation error:", error);
		}
	};

	const updateAttacker = (field: keyof UnitProfile, value: number | string) => {
		setAttacker({ ...attacker, [field]: value });
	};

	const updateDefender = (field: keyof UnitProfile, value: number | string) => {
		setDefender({ ...defender, [field]: value });
	};

	return (
		<>
			{/* Title */}
			<h1
				className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center"
				style={{ fontFamily: "var(--font-display)" }}
			>
				<span className="text-brand-green">PROFILE</span> <span className="text-orange-500">SIMULATOR</span>
			</h1>

			<div className="grid md:grid-cols-2 gap-4">
				{/* Attacker Profile */}
				<Card className="p-6">
					<h2 className="text-2xl font-bold mb-4 text-brand-green">Attacker</h2>
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="att-off" className="text-sm">
									Offensive Skill (Off)
								</Label>
								<Input
									id="att-off"
									type="number"
									min="0"
									max="10"
									value={attacker.offensiveSkill}
									onChange={(e) => updateAttacker("offensiveSkill", Number(e.target.value))}
									className="mt-1"
								/>
							</div>
							<div>
								<Label htmlFor="att-str" className="text-sm">
									Strength (Str)
								</Label>
								<Input
									id="att-str"
									type="number"
									min="0"
									max="10"
									value={attacker.strength}
									onChange={(e) => updateAttacker("strength", Number(e.target.value))}
									className="mt-1"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="att-ap" className="text-sm">
									Armor Penetration (AP)
								</Label>
								<Input
									id="att-ap"
									type="number"
									min="0"
									max="10"
									value={attacker.armorPenetration}
									onChange={(e) => updateAttacker("armorPenetration", Number(e.target.value))}
									className="mt-1"
								/>
							</div>
							<div>
								<Label htmlFor="att-attacks" className="text-sm">
									Attacks (Att)
								</Label>
								<Input
									id="att-attacks"
									type="text"
									value={attacker.attacks || "10"}
									onChange={(e) => updateAttacker("attacks", e.target.value || "10")}
									className="mt-1"
									placeholder="10 or 2d6"
								/>
							</div>
						</div>
					</div>
				</Card>

				{/* Defender Profile */}
				<Card className="p-6">
					<h2 className="text-2xl font-bold mb-4 text-orange-500">Defender</h2>
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="def-def" className="text-sm">
									Defensive Skill (Def)
								</Label>
								<Input
									id="def-def"
									type="number"
									min="0"
									max="10"
									value={defender.defensiveSkill}
									onChange={(e) => updateDefender("defensiveSkill", Number(e.target.value))}
									className="mt-1"
								/>
							</div>
							<div>
								<Label htmlFor="def-res" className="text-sm">
									Resilience (Res)
								</Label>
								<Input
									id="def-res"
									type="number"
									min="0"
									max="10"
									value={defender.resilience}
									onChange={(e) => updateDefender("resilience", Number(e.target.value))}
									className="mt-1"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="def-arm" className="text-sm">
									Armor (Arm)
								</Label>
								<Input
									id="def-arm"
									type="number"
									min="0"
									max="10"
									value={defender.armor}
									onChange={(e) => updateDefender("armor", Number(e.target.value))}
									className="mt-1"
								/>
							</div>
							<div>
								<Label htmlFor="def-wounds" className="text-sm">
									Wounds (HP)
								</Label>
								<Input
									id="def-wounds"
									type="number"
									min="1"
									max="10"
									value={defender.wounds}
									onChange={(e) => updateDefender("wounds", Number(e.target.value))}
									className="mt-1"
								/>
							</div>
						</div>
					</div>
				</Card>
			</div>

			{/* Calculated Values Display */}
			<Card className="p-6">
				<h3 className="text-xl font-bold mb-4">Calculated Combat Values</h3>
				<div className="grid grid-cols-3 gap-6 text-center">
					<div>
						<div className="text-sm text-muted-foreground mb-1">To Hit</div>
						<div className="text-3xl font-bold text-brand-green">
							{calculatedValues.toHit === "auto"
								? "Auto"
								: calculatedValues.toHit === "none"
									? "None"
									: `${calculatedValues.toHit}+`}
						</div>
					</div>
					<div>
						<div className="text-sm text-muted-foreground mb-1">To Wound</div>
						<div className="text-3xl font-bold text-orange-500">
							{calculatedValues.toWound === "auto"
								? "Auto"
								: calculatedValues.toWound === "none"
									? "None"
									: `${calculatedValues.toWound}+`}
						</div>
					</div>
					<div>
						<div className="text-sm text-muted-foreground mb-1">Armor Save</div>
						<div className="text-3xl font-bold text-blue-500">
							{calculatedValues.armorSave === "auto"
								? "Auto"
								: calculatedValues.armorSave === "none"
									? "None"
									: `${calculatedValues.armorSave}+`}
						</div>
					</div>
				</div>
			</Card>

			{/* Simulate Button */}
			<Button
				onClick={handleSimulate}
				className="w-full h-12 sm:h-14 text-lg sm:text-xl bg-brand-green hover:bg-brand-green-dark text-white"
			>
				Simulate
			</Button>

			{/* Results */}
			{simResults && (
				<div className="space-y-6">
					<ProbabilityChart results={simResults} />
				</div>
			)}
		</>
	);
}
