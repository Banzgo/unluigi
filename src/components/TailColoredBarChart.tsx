import type { ReactElement } from "react";
import { Bar, BarChart, CartesianGrid, Rectangle, XAxis, YAxis } from "recharts";
import type { ChartMode } from "./ChartModeToggle";
import { ChartContainer, ChartTooltip } from "./ui/chart";

interface BarShapeProps {
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	payload?: Record<string, unknown>;
}

interface TailColoredBarChartProps {
	data: readonly unknown[];
	xKey: string;
	dataKey: string;
	xAxisLabel: string;
	seriesLabel: string;
	seriesColor: string;
	chartMode: ChartMode;
	isMobile: boolean;
	tickFormatter: (value: number) => string;
	getBarColor: (xValue: number) => string;
	tooltipContent: ReactElement;
}

export function TailColoredBarChart({
	data,
	xKey,
	dataKey,
	xAxisLabel,
	seriesLabel,
	seriesColor,
	chartMode,
	isMobile,
	tickFormatter,
	getBarColor,
	tooltipContent,
}: TailColoredBarChartProps) {
	return (
		<ChartContainer config={{ [dataKey]: { label: seriesLabel, color: seriesColor } }} className="h-64 sm:h-80 w-full">
			<BarChart data={data as Record<string, unknown>[]}>
				<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
				<XAxis
					dataKey={xKey}
					label={{ value: xAxisLabel, position: "insideBottom", offset: -5 }}
					stroke="var(--muted-foreground)"
					tick={{ fill: "var(--muted-foreground)" }}
					tickFormatter={tickFormatter}
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
				<ChartTooltip content={tooltipContent} cursor={{ fill: "var(--muted)" }} />
				<Bar
					dataKey={dataKey}
					radius={[4, 4, 0, 0]}
					shape={(props: BarShapeProps) => {
						const xValue = props.payload?.[xKey] as number;
						return <Rectangle {...props} radius={[4, 4, 0, 0]} fill={getBarColor(xValue)} />;
					}}
				/>
			</BarChart>
		</ChartContainer>
	);
}
