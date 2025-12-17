import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { SimulationResults } from "../engine";
import { Card } from "./ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";

interface ProbabilityChartProps {
  results: SimulationResults;
}

export function ProbabilityChart({ results }: ProbabilityChartProps) {
  const chartData = results.probabilityDistribution.sort(
    (a, b) => a.wounds - b.wounds
  );

  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Probability Distribution
      </h2>
      <ChartContainer
        config={{
          probability: {
            label: "Probability",
            color: "hsl(142, 76%, 36%)",
          },
        }}
        className="h-80 w-full"
      >
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="wounds"
            label={{ value: "Wounds", position: "insideBottom", offset: -5 }}
            stroke="var(--muted-foreground)"
            tick={{ fill: "var(--muted-foreground)" }}
          />
          <YAxis
            label={{
              value: "Probability (%)",
              angle: -90,
              position: "insideLeft",
            }}
            stroke="var(--muted-foreground)"
            tick={{ fill: "var(--muted-foreground)" }}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            cursor={{ fill: "var(--muted)" }}
          />
          <Bar
            dataKey="probability"
            fill="var(--brand-green)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </Card>
  );
}
