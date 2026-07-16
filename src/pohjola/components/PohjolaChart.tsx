import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { type ChartMode, ChartModeToggle, PercentileLegend } from "@/components/ChartModeToggle";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { PohjolaSimulationResults } from "../engine/types";

interface PohjolaChartProps {
	results: PohjolaSimulationResults;
}

const TAIL_THRESHOLD = 10;

// Colors a bucket unlucky/lucky only if the majority of its own probability mass
// falls within the bottom/top 10% tail — avoids mislabeling buckets that straddle
// the tail boundary but mostly sit outside it.
function computeBarColor(point: { probability: number; cumulative: number }): string {
	const bucketMass = point.probability;
	if (bucketMass <= 0) return "hsl(0, 0%, 60%)";

	const before = point.cumulative - point.probability;
	const lowOverlap = Math.min(Math.max(TAIL_THRESHOLD - before, 0), bucketMass);
	if (lowOverlap / bucketMass > 0.5) return "rgb(249, 115, 22)";

	const after = 100 - point.cumulative;
	const highOverlap = Math.min(Math.max(TAIL_THRESHOLD - after, 0), bucketMass);
	if (highOverlap / bucketMass > 0.5) return "hsl(142, 76%, 36%)";

	return "hsl(0, 0%, 60%)";
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

	const barColors = new Map(results.damage.probabilityDistribution.map((p) => [p.wounds, computeBarColor(p)]));
	const getBarColor = (damage: number) => barColors.get(damage) ?? "hsl(0, 0%, 60%)";

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

			<PercentileLegend lowLabel="Low" highLabel="High" />
			<ChartModeToggle chartMode={chartMode} onChange={setChartMode} />
		</Card>
	);
}
