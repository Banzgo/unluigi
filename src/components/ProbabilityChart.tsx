import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import type { SimulationResults } from "../engine";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ChartContainer, ChartTooltip } from "./ui/chart";

interface ProbabilityChartProps {
  results: SimulationResults;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      wounds: number;
      probability: number;
      cumulative?: number;
    };
  }>;
}

type ChartMode = "probability" | "cumulative";

export function ProbabilityChart({ results }: ProbabilityChartProps) {
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

  const maxWounds =
    chartData.length > 0 ? chartData[chartData.length - 1].wounds : 0;
  const hasMoreData = results.probabilityDistribution.some(
    (d) => d.wounds > maxWounds && d.probability < 0.1
  );

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
      const value =
        chartMode === "cumulative" ? data.cumulative : data.probability;
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
        <h2 className="text-sm sm:text-lg font-semibold text-muted-foreground">
          EXPECTED SCORE
        </h2>
        <div className="text-4xl sm:text-5xl font-bold text-brand-green">
          {results.mean.toFixed(2)}
        </div>
        <div className="text-sm text-muted-foreground">
          Variance: {results.variance.toFixed(2)}
        </div>
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
                    value:
                      chartMode === "cumulative"
                        ? "Cumulative (%)"
                        : "Probability (%)",
                    angle: -90,
                    position: "insideLeft",
                  }
            }
            width={isMobile ? 0 : 60}
            stroke="var(--muted-foreground)"
            tick={{ fill: "var(--muted-foreground)" }}
          />
          <ChartTooltip
            content={<CustomTooltip />}
            cursor={{ fill: "var(--muted)" }}
          />
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={`cell-${entry.wounds}`}
                fill={getBarColor(entry.wounds)}
              />
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
