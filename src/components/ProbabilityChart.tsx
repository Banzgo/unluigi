import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import type { SimulationResults } from "../engine";
import { Button } from "./ui/button";
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

type ChartMode = "probability" | "cumulative";

export function ProbabilityChart({ results, results2 }: ProbabilityChartProps) {
	const [chartMode, setChartMode] = useState<ChartMode>("probability");
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 640); // sm breakpoint
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const isVersusMode = !!results2;

	// For single mode
	if (!isVersusMode) {
		// Filter and sort data, removing results with < 0.1% probability
		const baseChartData = results.probabilityDistribution
			.filter((d) => d.probability >= 0.1)
			.sort((a, b) => a.wounds - b.wounds);

		// Calculate cumulative probability (X or more wounds)
		const cumulativeData = baseChartData.map((point) => {
			const cumulative = results.probabilityDistribution
				.filter((d) => d.wounds >= point.wounds)
				.reduce((sum, d) => sum + d.probability, 0);
			return {
				...point,
				cumulative,
			};
		});

		const chartData = chartMode === "cumulative" ? cumulativeData : baseChartData;
		const dataKey = chartMode === "cumulative" ? "cumulative" : "probability";

		const maxWounds = chartData.length > 0 ? chartData[chartData.length - 1].wounds : 0;
		const hasMoreData = results.probabilityDistribution.some((d) => d.wounds > maxWounds && d.probability < 0.1);

		// Function to determine bar color based on percentile
		const getBarColor = (wounds: number) => {
			if (wounds < results.percentile10) {
				return "rgb(249, 115, 22)"; // Orange for bottom 10%
			}
			if (wounds > results.percentile90) {
				return "hsl(142, 76%, 36%)"; // Brand green for top 10%
			}
			return "hsl(0, 0%, 60%)"; // Neutral gray for middle 80%
		};

		// Custom tick formatter to add "+" to the last tick
		const formatXAxisTick = (value: number): string => {
			if (hasMoreData && value === maxWounds) {
				return `${value}+`;
			}
			return String(value);
		};

		// Custom tooltip formatter
		const CustomTooltip = ({ active, payload }: TooltipProps) => {
			if (active && payload && payload.length) {
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
			}
			return null;
		};

		return (
			<Card className="p-4 sm:p-6 bg-card border-border">
				{/* Score and Variance Header */}
				<div className="text-center space-y-2 mb-4 sm:mb-6">
					<h2 className="text-sm sm:text-lg font-semibold text-muted-foreground">EXPECTED SCORE</h2>
					<div className="text-4xl sm:text-5xl font-bold text-brand-green">{results.mean.toFixed(2)}</div>
					<div className="text-sm text-muted-foreground">Variance: {results.variance.toFixed(2)}</div>
				</div>

				<ChartContainer
					config={{
						probability: {
							label: "Probability",
							color: "hsl(142, 76%, 36%)",
						},
					}}
					className="h-64 sm:h-80 w-full"
				>
					<BarChart data={chartData}>
						<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
						<XAxis
							dataKey="wounds"
							label={{ value: "Wounds", position: "insideBottom", offset: -5 }}
							stroke="var(--muted-foreground)"
							tick={{ fill: "var(--muted-foreground)" }}
							tickFormatter={formatXAxisTick}
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
							tickFormatter={(value) => `${Math.round(value)}%`}
							width={isMobile ? 0 : 60}
							stroke="var(--muted-foreground)"
							tick={{ fill: "var(--muted-foreground)" }}
						/>
						<ChartTooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)" }} />
						<Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
							{chartData.map((entry) => (
								<Cell key={`cell-${entry.wounds}`} fill={getBarColor(entry.wounds)} />
							))}
						</Bar>
					</BarChart>
				</ChartContainer>
				{/* Percentile Legend */}
				<div className="mt-2 mb-2 flex justify-center gap-6 text-sm text-muted-foreground">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 bg-orange-500 rounded-sm" />
						<span>Unluigi</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 bg-brand-green rounded-sm" />
						<span>Luigi</span>
					</div>
				</div>
				{/* Chart Mode Toggle */}
				<div className="flex flex-col sm:flex-row justify-center gap-2">
					<Button
						onClick={() => setChartMode("probability")}
						variant={chartMode === "probability" ? "default" : "outline"}
						size="sm"
					>
						Distribution
					</Button>
					<Button
						onClick={() => setChartMode("cumulative")}
						variant={chartMode === "cumulative" ? "default" : "outline"}
						size="sm"
					>
						Cumulative
					</Button>
				</div>
			</Card>
		);
	}

	// Versus mode - combine both results
	const allWounds = new Set<number>();
	results.probabilityDistribution.forEach((d) => void allWounds.add(d.wounds));
	results2.probabilityDistribution.forEach((d) => void allWounds.add(d.wounds));

	const sortedWounds = Array.from(allWounds).sort((a, b) => a - b);

	// Create map for easy lookup
	const probMap1 = new Map(results.probabilityDistribution.map((d) => [d.wounds, d.probability]));
	const probMap2 = new Map(results2.probabilityDistribution.map((d) => [d.wounds, d.probability]));

	// Build chart data with both probabilities
	const baseChartData = sortedWounds
		.map((wounds) => ({
			wounds,
			probability: probMap1.get(wounds) || 0,
			probability2: probMap2.get(wounds) || 0,
		}))
		.filter((d) => d.probability >= 0.1 || d.probability2 >= 0.1);

	// Calculate cumulative probabilities
	const cumulativeData = baseChartData.map((point) => {
		const cumulative = results.probabilityDistribution
			.filter((d) => d.wounds >= point.wounds)
			.reduce((sum, d) => sum + d.probability, 0);
		const cumulative2 = results2.probabilityDistribution
			.filter((d) => d.wounds >= point.wounds)
			.reduce((sum, d) => sum + d.probability, 0);
		return {
			...point,
			cumulative,
			cumulative2,
		};
	});

	const chartData = chartMode === "cumulative" ? cumulativeData : baseChartData;

	// Custom tooltip formatter for versus mode
	const CustomTooltip = ({ active, payload }: TooltipProps) => {
		if (active && payload && payload.length) {
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
		}
		return null;
	};

	return (
		<Card className="p-4 sm:p-6 bg-card border-border">
			{/* Comparison Header */}
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
					probability: {
						label: "Profile 1",
						color: "hsl(142, 76%, 36%)",
					},
					probability2: {
						label: "Profile 2",
						color: "rgb(249, 115, 22)",
					},
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
						tickFormatter={(value) => `${Math.round(value)}%`}
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

			{/* Legend */}
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

			{/* Chart Mode Toggle */}
			<div className="flex flex-col sm:flex-row justify-center gap-2">
				<Button
					onClick={() => setChartMode("probability")}
					variant={chartMode === "probability" ? "default" : "outline"}
					size="sm"
				>
					Distribution
				</Button>
				<Button
					onClick={() => setChartMode("cumulative")}
					variant={chartMode === "cumulative" ? "default" : "outline"}
					size="sm"
				>
					Cumulative
				</Button>
			</div>
		</Card>
	);
}
