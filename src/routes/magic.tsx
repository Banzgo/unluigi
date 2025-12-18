import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Flame } from "lucide-react";
import { useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/magic")({
	component: MagicPage,
});

/**
 * Calculate the probability distribution for summing n dice each with d sides
 * Returns a Map where key is sum and value is count of ways to achieve that sum
 */
function calculateSumDistribution(numDice: number, sides: number): Map<number, number> {
	let distribution = new Map<number, number>();
	for (let face = 1; face <= sides; face++) {
		distribution.set(face, 1);
	}

	for (let die = 1; die < numDice; die++) {
		const newDistribution = new Map<number, number>();
		for (const [sum, count] of distribution) {
			for (let face = 1; face <= sides; face++) {
				const newSum = sum + face;
				newDistribution.set(newSum, (newDistribution.get(newSum) || 0) + count);
			}
		}
		distribution = newDistribution;
	}

	return distribution;
}

/**
 * Calculate probability of getting at least targetSum from a sum distribution
 */
function probabilityAtLeast(distribution: Map<number, number>, targetSum: number, totalOutcomes: number): number {
	let successCount = 0;
	for (const [sum, count] of distribution) {
		if (sum >= targetSum) {
			successCount += count;
		}
	}
	return (successCount / totalOutcomes) * 100;
}

/**
 * Calculate probability distribution for bound spell: 1d6 + (n-1)d3
 */
function calculateBoundSpellDistribution(numDice: number): Map<number, number> {
	let distribution = new Map<number, number>();
	for (let face = 1; face <= 6; face++) {
		distribution.set(face, 1);
	}

	for (let die = 1; die < numDice; die++) {
		const newDistribution = new Map<number, number>();
		for (const [sum, count] of distribution) {
			for (let face = 1; face <= 3; face++) {
				const newSum = sum + face;
				newDistribution.set(newSum, (newDistribution.get(newSum) || 0) + count);
			}
		}
		distribution = newDistribution;
	}

	return distribution;
}

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

interface CompactTableProps {
	castingValues: number[];
	diceRange: number[];
	calculateProbability: (numDice: number, castingValue: number) => number;
}

function CompactTable({ castingValues, diceRange, calculateProbability }: CompactTableProps) {
	return (
		<table className="w-full border-collapse text-sm">
			<thead>
				<tr>
					<th className="p-1.5 text-left text-xs font-medium text-muted-foreground border-b border-border">CV</th>
					{diceRange.map((dice) => (
						<th
							key={dice}
							className="p-1.5 text-center text-xs font-medium text-muted-foreground border-b border-border"
						>
							{dice}d
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{castingValues.map((cv) => (
					<tr key={cv} className="hover:bg-white/5 transition-colors">
						<td className="p-1.5 text-sm font-mono font-semibold text-foreground border-b border-border/50">{cv}+</td>
						{diceRange.map((dice) => {
							const prob = calculateProbability(dice, cv);
							return (
								<td key={dice} className="p-1 text-center border-b border-border/50">
									<span
										className={`inline-block px-1.5 py-0.5 rounded text-xs font-mono font-medium ${getProbabilityColor(prob)}`}
									>
										{prob.toFixed(0)}%
									</span>
								</td>
							);
						})}
					</tr>
				))}
			</tbody>
		</table>
	);
}

function MagicPage() {
	// Memoize probability calculations for learned spells (nd6)
	const learnedSpellProbabilities = useMemo(() => {
		const probs = new Map<string, number>();
		for (let dice = 2; dice <= 5; dice++) {
			const distribution = calculateSumDistribution(dice, 6);
			const totalOutcomes = 6 ** dice;
			for (let cv = 5; cv <= 11; cv++) {
				const prob = probabilityAtLeast(distribution, cv, totalOutcomes);
				probs.set(`${dice}-${cv}`, prob);
			}
		}
		return probs;
	}, []);

	// Memoize probability calculations for bound spells (1d6 + (n-1)d3)
	const boundSpellProbabilities = useMemo(() => {
		const probs = new Map<string, number>();
		for (let dice = 2; dice <= 5; dice++) {
			const distribution = calculateBoundSpellDistribution(dice);
			const totalOutcomes = 6 * 3 ** (dice - 1);
			for (let cv = 3; cv <= 7; cv++) {
				const prob = probabilityAtLeast(distribution, cv, totalOutcomes);
				probs.set(`${dice}-${cv}`, prob);
			}
		}
		return probs;
	}, []);

	const getlearnedSpellProbability = (numDice: number, castingValue: number): number => {
		return learnedSpellProbabilities.get(`${numDice}-${castingValue}`) || 0;
	};

	const getBoundSpellProbability = (numDice: number, castingValue: number): number => {
		return boundSpellProbabilities.get(`${numDice}-${castingValue}`) || 0;
	};

	return (
		<div className="p-4 sm:p-6 lg:p-8">
			<div className="max-w-4xl mx-auto space-y-6">
				{/* Title */}
				<h1
					className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center"
					style={{ fontFamily: "var(--font-display)" }}
				>
					<span className="text-purple-400">MAGIC</span> <span className="text-orange-500">PHASE</span>
				</h1>

				{/* Spell Casting Tables Accordion */}
				<Accordion type="single" collapsible defaultValue="casting-tables" className="w-full">
					<AccordionItem value="casting-tables" className="border border-border rounded-lg bg-card overflow-hidden">
						<AccordionTrigger className="px-4 hover:no-underline hover:bg-white/5">
							<span className="text-base font-semibold">Spell Casting Probabilities</span>
						</AccordionTrigger>
						<AccordionContent className="px-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* learned Spells */}
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center">
											<BookOpen className="w-3.5 h-3.5 text-blue-400" />
										</div>
										<div>
											<h3 className="text-sm font-semibold text-foreground">Learned Spells</h3>
										</div>
									</div>
									<CompactTable
										castingValues={[5, 6, 7, 8, 9, 10, 11]}
										diceRange={[2, 3, 4, 5]}
										calculateProbability={getlearnedSpellProbability}
									/>
								</div>

								{/* Bound Spells */}
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center">
											<Flame className="w-3.5 h-3.5 text-amber-400" />
										</div>
										<div>
											<h3 className="text-sm font-semibold text-foreground">Bound Spells</h3>
										</div>
									</div>
									<CompactTable
										castingValues={[3, 4, 5, 6, 7]}
										diceRange={[2, 3, 4, 5]}
										calculateProbability={getBoundSpellProbability}
									/>
								</div>
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</div>
	);
}
