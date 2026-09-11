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
}

/**
 * A labeled value stepper: a big center button that cycles through `options`
 * (wrapping), flanked by +/- controls that clamp at the ends of the option
 * list. Renders a compact +/- row on mobile and embeds the +/- controls
 * inside the main button on larger screens.
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

			{/* Mobile: +/- buttons in separate row */}
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

			{/* Desktop: +/- buttons inside main button */}
			<div className={`relative w-full h-20 sm:h-24 bg-primary ${boxBorder} rounded-md overflow-hidden`}>
				<button
					type="button"
					onClick={decrease}
					className="hidden sm:block absolute left-0 top-0 h-full px-3 sm:px-4 text-2xl sm:text-3xl font-bold hover:bg-secondary/80 text-foreground transition-colors z-10"
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
					className="hidden sm:block absolute right-0 top-0 h-full px-3 sm:px-4 text-2xl sm:text-3xl font-bold hover:bg-secondary/80 text-foreground transition-colors z-10"
				>
					+
				</button>
			</div>

			{children}
		</div>
	);
}
