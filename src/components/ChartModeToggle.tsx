import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export type ChartMode = "probability" | "cumulative";

export function useChartState() {
	const [chartMode, setChartMode] = useState<ChartMode>("probability");
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 640);
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);

	return { chartMode, setChartMode, isMobile };
}

interface PercentileLegendProps {
	lowLabel: string;
	highLabel: string;
}

export function PercentileLegend({ lowLabel, highLabel }: PercentileLegendProps) {
	return (
		<div className="mt-2 mb-2 flex justify-center gap-6 text-sm text-muted-foreground">
			<div className="flex items-center gap-2">
				<div className="w-3 h-3 bg-orange-500 rounded-sm" />
				<span>{lowLabel}</span>
			</div>
			<div className="flex items-center gap-2">
				<div className="w-3 h-3 bg-brand-green rounded-sm" />
				<span>{highLabel}</span>
			</div>
		</div>
	);
}

interface ChartModeToggleProps {
	chartMode: ChartMode;
	onChange: (mode: ChartMode) => void;
}

export function ChartModeToggle({ chartMode, onChange }: ChartModeToggleProps) {
	return (
		<div className="flex flex-col sm:flex-row justify-center gap-2">
			<Button
				onClick={() => onChange("probability")}
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
				onClick={() => onChange("cumulative")}
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
	);
}
