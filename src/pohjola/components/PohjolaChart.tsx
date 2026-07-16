import { buildBarColorMap } from "@/components/barColors";
import { ChartModeToggle, PercentileLegend, useChartState } from "@/components/ChartModeToggle";
import { TailColoredBarChart } from "@/components/TailColoredBarChart";
import { Card } from "@/components/ui/card";
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

export function PohjolaChart({ results }: PohjolaChartProps) {
	const { chartMode, setChartMode, isMobile } = useChartState();

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

	const barColors = buildBarColorMap(results.damage.probabilityDistribution);
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

			<TailColoredBarChart
				data={chartData}
				xKey="damage"
				dataKey={dataKey}
				xAxisLabel="Damage"
				seriesLabel="Probability"
				seriesColor="hsl(142, 76%, 36%)"
				chartMode={chartMode}
				isMobile={isMobile}
				tickFormatter={formatXTick}
				getBarColor={getBarColor}
				tooltipContent={<CustomTooltip />}
			/>

			<PercentileLegend lowLabel="Low" highLabel="High" />
			<ChartModeToggle chartMode={chartMode} onChange={setChartMode} />
		</Card>
	);
}
