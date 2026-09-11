import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SteppedCycleControlProps<T> {
	label: string;
	value: T;
	options: readonly T[];
	onChange: (value: T) => void;
	/** Border/accent color classes applied to the stepper box, e.g. "border-purple-500/50" */
	accentClassName: string;
	/** Formats the value shown on the main button. Defaults to String(value). */
	formatValue?: (value: T) => string;
	/** Extra classes on the outer wrapper, e.g. grid ordering/column-span utilities. */
	className?: string;
	/** Rendered below the stepper box (e.g. modifier/reroll toggle buttons). */
	children?: ReactNode;
	/** Show the standalone +/- row on mobile (no hover there to reveal the in-button ones). Defaults to true. */
	showMobileButtons?: boolean;
}

/**
 * A labeled value stepper: a big center button that cycles through `options`
 * (wrapping), flanked by +/- controls that clamp at the ends of the option
 * list. On larger screens the +/- controls are embedded inside the main
 * button and only reveal themselves on hover/focus; on mobile (no hover) a
 * compact +/- row renders separately, unless `showMobileButtons` is false.
 */
export function SteppedCycleControl<T>({
	label,
	value,
	options,
	onChange,
	accentClassName,
	formatValue = (v) => String(v),
	className,
	children,
	showMobileButtons = true,
}: SteppedCycleControlProps<T>) {
	const index = options.indexOf(value);
	const canDecrease = index > 0;
	const canIncrease = index >= 0 && index < options.length - 1;

	const decrease = () => {
		if (canDecrease) onChange(options[index - 1]);
	};
	const increase = () => {
		if (canIncrease) onChange(options[index + 1]);
	};
	const cycle = () => onChange(options[(index + 1) % options.length]);

	const boxBorder = `border-2 ${accentClassName}`;

	return (
		<div className={cn("flex flex-col space-y-1.5", className)}>
			<Label className="text-sm text-muted-foreground text-center">{label}</Label>

			{/* Mobile: +/- buttons in separate row (no hover there to reveal the in-button ones) */}
			{showMobileButtons && (
				<div className="flex sm:hidden gap-1">
					<button
						type="button"
						onClick={decrease}
						className={`flex-1 h-10 text-2xl font-bold bg-primary ${boxBorder} rounded-md hover:bg-secondary/80 text-foreground transition-colors`}
					>
						−
					</button>
					<button
						type="button"
						onClick={increase}
						className={`flex-1 h-10 text-2xl font-bold bg-primary ${boxBorder} rounded-md hover:bg-secondary/80 text-foreground transition-colors`}
					>
						+
					</button>
				</div>
			)}

			{/* Desktop: +/- buttons inside main button, each revealed by hovering/focusing itself */}
			<div className={`relative w-full h-20 sm:h-24 bg-primary ${boxBorder} rounded-md overflow-hidden`}>
				<button
					type="button"
					onClick={decrease}
					className="hidden sm:block absolute left-0 top-0 h-full px-3 sm:px-4 text-2xl sm:text-3xl font-bold opacity-0 hover:opacity-100 focus-visible:opacity-100 hover:bg-secondary/80 text-foreground transition-opacity z-10"
				>
					−
				</button>
				<button
					type="button"
					onClick={cycle}
					className="w-full h-full text-3xl sm:text-4xl font-bold hover:bg-secondary/80 text-foreground transition-colors"
				>
					{formatValue(value)}
				</button>
				<button
					type="button"
					onClick={increase}
					className="hidden sm:block absolute right-0 top-0 h-full px-3 sm:px-4 text-2xl sm:text-3xl font-bold opacity-0 hover:opacity-100 focus-visible:opacity-100 hover:bg-secondary/80 text-foreground transition-opacity z-10"
				>
					+
				</button>
			</div>

			{children}
		</div>
	);
}
