import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { PohjolaSimulationResults } from "../engine/types";

interface PohjolaChartProps {
	results: PohjolaSimulationResults;
}

interface TooltipProps {
	active?: boolean;
	payload?: Array<{
		payload: {
			damage: number;
			probability: number;
			cumulative: number;
			avgCrits: number;
			avgBlocks: number;
		};
	}>;
}

type ChartMode = "probability" | "cumulative";

export function PohjolaChart({ results }: PohjolaChartProps) {
	const [chartMode, setChartMode] = useState<ChartMode>("probability");
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 640);
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);

	const baseChartData = results.damage.probabilityDistribution
		.filter((d) => d.probability >= 0.1)
		.sort((a, b) => a.wounds - b.wounds)
		.map((d) => {
			const bucket = results.byDamage[d.wounds];
			return {
				damage: d.wounds,
				probability: d.probability,
				cumulative: results.damage.probabilityDistribution
					.filter((x) => x.wounds >= d.wounds)
					.reduce((s, x) => s + x.probability, 0),
				avgCrits: bucket?.avgCrits ?? 0,
				avgBlocks: bucket?.avgBlocks ?? 0,
			};
		});

	const chartData = baseChartData;
	const dataKey = chartMode === "cumulative" ? "cumulative" : "probability";

	const maxDamage = chartData.length > 0 ? chartData[chartData.length - 1].damage : 0;
	const hasMoreData = results.damage.probabilityDistribution.some((d) => d.wounds > maxDamage && d.probability < 0.1);

	const getBarColor = (damage: number) => {
		if (damage < results.damage.percentile10) return "rgb(249, 115, 22)";
		if (damage > results.damage.percentile90) return "hsl(142, 76%, 36%)";
		return "hsl(0, 0%, 60%)";
	};

	const formatXTick = (value: number) => (hasMoreData && value === maxDamage ? `${value}+` : String(value));

	const CustomTooltip = ({ active, payload }: TooltipProps) => {
		if (!active || !payload?.length) return null;
		const d = payload[0].payload;
		const val = chartMode === "cumulative" ? d.cumulative : d.probability;
		const label =
			chartMode === "cumulative" ? `${d.damage}+ damage: ${val.toFixed(2)}%` : `${d.damage} damage: ${val.toFixed(2)}%`;
		return (
			<div className="bg-card border border-border rounded-md p-2 shadow-md space-y-1">
				<p className="text-sm text-foreground">{label}</p>
				<p className="text-xs text-muted-foreground">
					Avg crits: {d.avgCrits.toFixed(2)}
					<br />
					Avg saves: {d.avgBlocks.toFixed(2)}
				</p>
			</div>
		);
	};

	return (
		<Card className="p-4 sm:p-6 bg-card border-border">
			{/* Header */}
			<div className="text-center space-y-1 mb-4 sm:mb-6">
				<h2 className="text-sm sm:text-lg font-semibold text-muted-foreground">EXPECTED DAMAGE</h2>
				<div className="text-4xl sm:text-5xl font-bold text-amber-400">{results.damage.mean.toFixed(2)}</div>
				<div className="text-sm text-muted-foreground">Variance: {results.damage.variance.toFixed(2)}</div>
				<div className="flex justify-center gap-6 text-sm text-muted-foreground pt-1">
					<span>
						Avg crits: <span className="text-foreground font-medium">{results.meanCrits.toFixed(2)}</span>
					</span>
					<span>
						Avg saves: <span className="text-foreground font-medium">{results.meanBlocks.toFixed(2)}</span>
					</span>
				</div>
			</div>

			<ChartContainer
				config={{
					probability: { label: "Probability", color: "hsl(142, 76%, 36%)" },
				}}
				className="h-64 sm:h-80 w-full"
			>
				<BarChart data={chartData}>
					<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
					<XAxis
						dataKey="damage"
						label={{ value: "Damage", position: "insideBottom", offset: -5 }}
						stroke="var(--muted-foreground)"
						tick={{ fill: "var(--muted-foreground)" }}
						tickFormatter={formatXTick}
					/>
					<YAxis
						label={
							isMobile
								? undefined
								: {
										value: chartMode === "cumulative" ? "Cumulative (%)" : "Probability (%)",
										angle: -90,
										position: "insideLeft",
									}
						}
						domain={chartMode === "cumulative" ? [0, 100] : undefined}
						tickFormatter={(v) => `${Math.round(v)}%`}
						width={isMobile ? 0 : 60}
						stroke="var(--muted-foreground)"
						tick={{ fill: "var(--muted-foreground)" }}
					/>
					<ChartTooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)" }} />
					<Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
						{chartData.map((entry) => (
							<Cell key={`cell-${entry.damage}`} fill={getBarColor(entry.damage)} />
						))}
					</Bar>
				</BarChart>
			</ChartContainer>

			<div className="mt-2 mb-2 flex justify-center gap-6 text-sm text-muted-foreground">
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 bg-orange-500 rounded-sm" />
					<span>Low</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 bg-brand-green rounded-sm" />
					<span>High</span>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row justify-center gap-2">
				<Button
					onClick={() => setChartMode("probability")}
					variant="outline"
					size="sm"
					className={
						chartMode === "probability"
							? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
							: "bg-secondary hover:bg-secondary/80 text-foreground"
					}
				>
					Distribution
				</Button>
				<Button
					onClick={() => setChartMode("cumulative")}
					variant="outline"
					size="sm"
					className={
						chartMode === "cumulative"
							? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
							: "bg-secondary hover:bg-secondary/80 text-foreground"
					}
				>
					Cumulative
				</Button>
			</div>
		</Card>
	);
}
