import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { SimulationResults } from "../engine";
import { buildBarColorMap } from "./barColors";
import { ChartModeToggle, PercentileLegend, useChartState } from "./ChartModeToggle";
import { TailColoredBarChart } from "./TailColoredBarChart";
import { Card } from "./ui/card";
import { ChartContainer, ChartTooltip } from "./ui/chart";

interface ProbabilityChartProps {
	results: SimulationResults;
	results2?: SimulationResults;
}

interface TooltipProps {
	active?: boolean;
	payload?: Array<{
		payload: {
			wounds: number;
			probability?: number;
			probability2?: number;
			cumulative?: number;
			cumulative2?: number;
		};
		dataKey?: string;
	}>;
}

function computeCumulative(distribution: { wounds: number; probability: number }[], wound: number): number {
	return distribution.filter((d) => d.wounds >= wound).reduce((sum, d) => sum + d.probability, 0);
}

function SingleResultChart({ results }: { results: SimulationResults }) {
	const { chartMode, setChartMode, isMobile } = useChartState();

	const baseChartData = results.probabilityDistribution
		.filter((d) => d.probability >= 0.1)
		.sort((a, b) => a.wounds - b.wounds);

	const cumulativeData = baseChartData.map((point) => ({
		...point,
		cumulative: computeCumulative(results.probabilityDistribution, point.wounds),
	}));

	const chartData = chartMode === "cumulative" ? cumulativeData : baseChartData;
	const dataKey = chartMode === "cumulative" ? "cumulative" : "probability";

	const maxWounds = chartData.length > 0 ? chartData[chartData.length - 1].wounds : 0;
	const hasMoreData = results.probabilityDistribution.some((d) => d.wounds > maxWounds && d.probability < 0.1);

	const barColors = buildBarColorMap(results.probabilityDistribution);
	const getBarColor = (wounds: number) => barColors.get(wounds) ?? "hsl(0, 0%, 60%)";

	const formatXAxisTick = (value: number) => (hasMoreData && value === maxWounds ? `${value}+` : String(value));

	const CustomTooltip = ({ active, payload }: TooltipProps) => {
		if (!active || !payload?.length) return null;
		const data = payload[0].payload;
		const value = chartMode === "cumulative" ? data.cumulative : data.probability;
		const label =
			chartMode === "cumulative"
				? `${data.wounds}+ wounds: ${value?.toFixed(2)}%`
				: `${data.wounds} wounds: ${value?.toFixed(2)}%`;
		return (
			<div className="bg-card border border-border rounded-md p-2 shadow-md">
				<p className="text-sm text-foreground">{label}</p>
			</div>
		);
	};

	return (
		<Card className="p-4 sm:p-6 bg-card border-border">
			<div className="text-center space-y-2 mb-4 sm:mb-6">
				<h2 className="text-sm sm:text-lg font-semibold text-muted-foreground">EXPECTED SCORE</h2>
				<div className="text-4xl sm:text-5xl font-bold text-brand-green">{results.mean.toFixed(2)}</div>
				<div className="text-sm text-muted-foreground">Variance: {results.variance.toFixed(2)}</div>
			</div>

			<TailColoredBarChart
				data={chartData}
				xKey="wounds"
				dataKey={dataKey}
				xAxisLabel="Wounds"
				seriesLabel="Probability"
				seriesColor="hsl(142, 76%, 36%)"
				chartMode={chartMode}
				isMobile={isMobile}
				tickFormatter={formatXAxisTick}
				getBarColor={getBarColor}
				tooltipContent={<CustomTooltip />}
			/>
			<PercentileLegend lowLabel="Unluigi" highLabel="Luigi" />
			<ChartModeToggle chartMode={chartMode} onChange={setChartMode} />
		</Card>
	);
}

function VersusResultChart({ results, results2 }: { results: SimulationResults; results2: SimulationResults }) {
	const { chartMode, setChartMode, isMobile } = useChartState();

	const allWounds = new Set<number>();
	results.probabilityDistribution.forEach((d) => void allWounds.add(d.wounds));
	results2.probabilityDistribution.forEach((d) => void allWounds.add(d.wounds));

	const probMap1 = new Map(results.probabilityDistribution.map((d) => [d.wounds, d.probability]));
	const probMap2 = new Map(results2.probabilityDistribution.map((d) => [d.wounds, d.probability]));

	const baseChartData = Array.from(allWounds)
		.sort((a, b) => a - b)
		.map((wounds) => ({
			wounds,
			probability: probMap1.get(wounds) || 0,
			probability2: probMap2.get(wounds) || 0,
		}))
		.filter((d) => d.probability >= 0.1 || d.probability2 >= 0.1);

	const cumulativeData = baseChartData.map((point) => ({
		...point,
		cumulative: computeCumulative(results.probabilityDistribution, point.wounds),
		cumulative2: computeCumulative(results2.probabilityDistribution, point.wounds),
	}));

	const chartData = chartMode === "cumulative" ? cumulativeData : baseChartData;

	const CustomTooltip = ({ active, payload }: TooltipProps) => {
		if (!active || !payload?.length) return null;
		const data = payload[0].payload;
		const isProb = chartMode === "probability";
		const value1 = isProb ? data.probability : data.cumulative;
		const value2 = isProb ? data.probability2 : data.cumulative2;
		const suffix = chartMode === "cumulative" ? "+" : "";
		return (
			<div className="bg-card border border-border rounded-md p-2 shadow-md">
				<p className="text-sm text-foreground font-semibold mb-1">
					{data.wounds}
					{suffix} wounds
				</p>
				<p className="text-sm text-brand-green">Profile 1: {value1?.toFixed(2)}%</p>
				<p className="text-sm text-orange-500">Profile 2: {value2?.toFixed(2)}%</p>
			</div>
		);
	};

	return (
		<Card className="p-4 sm:p-6 bg-card border-border">
			<div className="grid grid-cols-2 gap-4 mb-4 sm:mb-6">
				<div className="text-center space-y-2">
					<h2 className="text-sm sm:text-lg font-semibold text-brand-green">PROFILE 1</h2>
					<div className="text-3xl sm:text-4xl font-bold text-brand-green">{results.mean.toFixed(2)}</div>
					<div className="text-xs sm:text-sm text-muted-foreground">Variance: {results.variance.toFixed(2)}</div>
				</div>
				<div className="text-center space-y-2">
					<h2 className="text-sm sm:text-lg font-semibold text-orange-500">PROFILE 2</h2>
					<div className="text-3xl sm:text-4xl font-bold text-orange-500">{results2.mean.toFixed(2)}</div>
					<div className="text-xs sm:text-sm text-muted-foreground">Variance: {results2.variance.toFixed(2)}</div>
				</div>
			</div>

			<ChartContainer
				config={{
					probability: { label: "Profile 1", color: "hsl(142, 76%, 36%)" },
					probability2: { label: "Profile 2", color: "rgb(249, 115, 22)" },
				}}
				className="h-64 sm:h-80 w-full"
			>
				<BarChart data={chartData} barGap={-10}>
					<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
					<XAxis
						dataKey="wounds"
						label={{ value: "Wounds", position: "insideBottom", offset: -5 }}
						stroke="var(--muted-foreground)"
						tick={{ fill: "var(--muted-foreground)" }}
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
					<Bar
						dataKey={chartMode === "cumulative" ? "cumulative" : "probability"}
						fill="hsl(142, 76%, 36%)"
						radius={[4, 4, 0, 0]}
						barSize={20}
					/>
					<Bar
						dataKey={chartMode === "cumulative" ? "cumulative2" : "probability2"}
						fill="rgb(249, 115, 22)"
						radius={[4, 4, 0, 0]}
						barSize={20}
					/>
				</BarChart>
			</ChartContainer>

			<div className="mt-2 mb-2 flex justify-center gap-6 text-sm text-muted-foreground">
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 bg-brand-green rounded-sm" />
					<span>Profile 1</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 bg-orange-500 rounded-sm" />
					<span>Profile 2</span>
				</div>
			</div>
			<ChartModeToggle chartMode={chartMode} onChange={setChartMode} />
		</Card>
	);
}

export function ProbabilityChart({ results, results2 }: ProbabilityChartProps) {
	if (!results2) return <SingleResultChart results={results} />;
	return <VersusResultChart results={results} results2={results2} />;
}
