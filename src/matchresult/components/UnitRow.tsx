import { cn } from "@/lib/utils";
import type { ParsedUnit, UnitStatus } from "../types";

interface UnitRowProps {
	unit: ParsedUnit;
	onStatusChange: (id: string, status: UnitStatus) => void;
}

const STATUS_BUTTONS: { status: UnitStatus; label: string; active: string; inactive: string }[] = [
	{
		status: "alive",
		label: "ALIVE",
		active: "bg-green-600 text-white border-green-600",
		inactive: "border-green-700 text-green-700 hover:bg-green-700/10",
	},
	{
		status: "half",
		label: "HALF",
		active: "bg-orange-500 text-white border-orange-500",
		inactive: "border-orange-600 text-orange-600 hover:bg-orange-600/10",
	},
	{
		status: "dead",
		label: "DEAD",
		active: "bg-red-600 text-white border-red-600",
		inactive: "border-red-700 text-red-700 hover:bg-red-700/10",
	},
];

export function UnitRow({ unit, onStatusChange }: Readonly<UnitRowProps>) {
	const vpContrib = unit.status === "dead" ? unit.points : unit.status === "half" ? unit.points * 0.5 : 0;

	return (
		<div className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
			{/* Left: info */}
			<div className="flex-1 min-w-0">
				<div className="flex items-baseline gap-2">
					<span
						className={cn(
							"text-sm font-mono font-semibold shrink-0",
							unit.status === "dead" && "text-red-400",
							unit.status === "half" && "text-orange-400",
							unit.status === "alive" && "text-muted-foreground",
						)}
					>
						{unit.status !== "alive" ? (
							<>
								<span className="line-through opacity-50">{unit.points}</span>
								<span className="ml-1">→ {vpContrib % 1 === 0 ? vpContrib : vpContrib.toFixed(1)}</span>
							</>
						) : (
							unit.points
						)}
					</span>
					<span className="text-sm font-medium">{unit.countName}</span>
				</div>
				{unit.options && <p className="text-xs text-muted-foreground/70 mt-0.5">{unit.options}</p>}
			</div>

			{/* Right: status buttons */}
			<div className="flex gap-1 shrink-0">
				{STATUS_BUTTONS.map(({ status, label, active, inactive }) => (
					<button
						key={status}
						type="button"
						onClick={() => onStatusChange(unit.id, status)}
						className={cn(
							"px-2 py-0.5 text-xs font-bold border rounded transition-colors",
							unit.status === status ? active : inactive,
						)}
					>
						{label}
					</button>
				))}
			</div>
		</div>
	);
}
