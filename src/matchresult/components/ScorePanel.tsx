import { cn } from "@/lib/utils";
import type { BpResult, PrimaryObjective } from "../types";
import { nextBpInfoForPlayer } from "../utils/scoring";

interface ScorePanelProps {
	result: BpResult;
	primary: PrimaryObjective;
	gameSize: number;
	p1Name: string;
	p2Name: string;
	p1SecondaryDone: boolean;
	p2SecondaryDone: boolean;
	onPrimaryChange: (v: PrimaryObjective) => void;
	onP1SecondaryChange: (v: boolean) => void;
	onP2SecondaryChange: (v: boolean) => void;
}

export function ScorePanel({
	result,
	primary,
	gameSize,
	p1Name,
	p2Name,
	p1SecondaryDone,
	p2SecondaryDone,
	onPrimaryChange,
	onP1SecondaryChange,
	onP2SecondaryChange,
}: Readonly<ScorePanelProps>) {
	const objectives = { primary, player1SecondaryDone: p1SecondaryDone, player2SecondaryDone: p2SecondaryDone };
	const p1Next = nextBpInfoForPlayer("player1", result, objectives, gameSize);
	const p2Next = nextBpInfoForPlayer("player2", result, objectives, gameSize);

	const p1BpAhead = result.player1Bp > result.player2Bp;
	const p2BpAhead = result.player2Bp > result.player1Bp;

	const formatVp = (vp: number) => (vp % 1 === 0 ? vp.toString() : vp.toFixed(1));

	return (
		<div className="bg-card border border-border rounded-xl p-4 space-y-4">
			{/* VP + BP scores */}
			<div className="grid grid-cols-3 gap-x-2 gap-y-1 text-center items-center">
				{/* Names row */}
				<p className="text-xs text-muted-foreground uppercase tracking-wide break-words">{p1Name}</p>
				<p className="text-xs text-muted-foreground uppercase tracking-wide">VP diff</p>
				<p className="text-xs text-muted-foreground uppercase tracking-wide break-words">{p2Name}</p>

				{/* VP row */}
				<p className="text-2xl font-bold font-mono">{formatVp(result.player1Vp)}</p>
				<p className="text-xl font-bold font-mono text-muted-foreground">{formatVp(result.vpDiff)}</p>
				<p className="text-2xl font-bold font-mono">{formatVp(result.player2Vp)}</p>

				{/* BP row */}
				<p className={cn("text-3xl font-bold", p1BpAhead ? "text-green-400" : p2BpAhead ? "text-red-400" : "text-yellow-400")}>
					{result.player1Bp} <span className="text-sm font-normal text-muted-foreground">BP</span>
				</p>
				<div />
				<p className={cn("text-3xl font-bold", p2BpAhead ? "text-green-400" : p1BpAhead ? "text-red-400" : "text-yellow-400")}>
					{result.player2Bp} <span className="text-sm font-normal text-muted-foreground">BP</span>
				</p>

				{/* Next BP row */}
				{(p1Next !== null || p2Next !== null) && (
					<>
						<p className="text-xs text-muted-foreground/60">
							{p1Next !== null ? `+${formatVp(p1Next.vpNeeded)} -> ${p1Next.nextBp}` : ""}
						</p>
						<div />
						<p className="text-xs text-muted-foreground/60">
							{p2Next !== null ? `+${formatVp(p2Next.vpNeeded)} -> ${p2Next.nextBp}` : ""}
						</p>
					</>
				)}
			</div>

			<div className="border-t border-border/50 pt-3 space-y-3">
				{/* Primary objective */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
					<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground shrink-0">Primary (+3)</p>
					<div className="flex justify-center gap-1">
						{(
							[
								["player1", p1Name],
								["neither", "Neither"],
								["player2", p2Name],
							] as const
						).map(([value, label]) => (
							<button
								key={value}
								type="button"
								onClick={() => onPrimaryChange(value)}
								className={cn(
									"px-3 py-1 text-xs font-semibold rounded border transition-colors",
									primary === value
										? "bg-amber-500 text-black border-amber-500"
										: "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50",
								)}
							>
								{label}
							</button>
						))}
					</div>
				</div>

				{/* Secondary objectives */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
					<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground shrink-0">Secondary (+1)</p>
					<div className="flex justify-center gap-4">
						<label className="flex items-center gap-1.5 cursor-pointer">
							<input
								type="checkbox"
								checked={p1SecondaryDone}
								onChange={(e) => onP1SecondaryChange(e.target.checked)}
								className="w-4 h-4 accent-green-500"
							/>
							<span className="text-xs text-muted-foreground">{p1Name}</span>
						</label>
						<label className="flex items-center gap-1.5 cursor-pointer">
							<input
								type="checkbox"
								checked={p2SecondaryDone}
								onChange={(e) => onP2SecondaryChange(e.target.checked)}
								className="w-4 h-4 accent-green-500"
							/>
							<span className="text-xs text-muted-foreground">{p2Name}</span>
						</label>
					</div>
				</div>
			</div>
		</div>
	);
}
