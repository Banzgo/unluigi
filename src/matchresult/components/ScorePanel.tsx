import { cn } from "@/lib/utils";
import type { BpResult, PrimaryObjective } from "../types";
import { vpToNextLoserTier, vpToNextWinnerTier } from "../utils/scoring";

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
	const p1Wins = result.player1Vp > result.player2Vp;
	const p2Wins = result.player2Vp > result.player1Vp;

	const p1NextVp = p1Wins
		? vpToNextWinnerTier(result.vpDiff, gameSize)
		: p2Wins
			? vpToNextLoserTier(result.vpDiff, gameSize)
			: vpToNextWinnerTier(result.vpDiff, gameSize);
	const p2NextVp = p2Wins
		? vpToNextWinnerTier(result.vpDiff, gameSize)
		: p1Wins
			? vpToNextLoserTier(result.vpDiff, gameSize)
			: vpToNextWinnerTier(result.vpDiff, gameSize);

	const formatVp = (vp: number) => (vp % 1 === 0 ? vp.toString() : vp.toFixed(1));

	return (
		<div className="bg-card border border-border rounded-xl p-4 space-y-4">
			{/* VP + BP scores */}
			<div className="grid grid-cols-3 gap-2 text-center">
				{/* Player 1 */}
				<div className="space-y-1">
					<p className="text-xs text-muted-foreground uppercase tracking-wide">{p1Name} VP</p>
					<p className="text-2xl font-bold font-mono">{formatVp(result.player1Vp)}</p>
					<p
						className={cn(
							"text-3xl font-bold",
							p1Wins ? "text-green-400" : p2Wins ? "text-red-400" : "text-yellow-400",
						)}
					>
						{result.player1Bp} <span className="text-sm font-normal text-muted-foreground">BP</span>
					</p>
					{p1NextVp !== null && <p className="text-xs text-muted-foreground/60">{p1NextVp} VP (+1)</p>}
				</div>

				{/* Center: diff */}
				<div className="flex flex-col items-center justify-center space-y-1">
					<p className="text-xs text-muted-foreground uppercase tracking-wide">VP diff</p>
					<p className="text-xl font-bold font-mono text-muted-foreground">{formatVp(result.vpDiff)}</p>
				</div>

				{/* Player 2 */}
				<div className="space-y-1">
					<p className="text-xs text-muted-foreground uppercase tracking-wide">{p2Name} VP</p>
					<p className="text-2xl font-bold font-mono">{formatVp(result.player2Vp)}</p>
					<p
						className={cn(
							"text-3xl font-bold",
							p2Wins ? "text-green-400" : p1Wins ? "text-red-400" : "text-yellow-400",
						)}
					>
						{result.player2Bp} <span className="text-sm font-normal text-muted-foreground">BP</span>
					</p>
					{p2NextVp !== null && <p className="text-xs text-muted-foreground/60">{p2NextVp} VP (+1)</p>}
				</div>
			</div>

			<div className="border-t border-border/50 pt-3 space-y-3">
				{/* Primary objective */}
				<div className="flex items-center justify-center gap-3">
					<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
						Primary (+3)
					</span>
					<div className="flex gap-1">
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
				<div className="flex items-center justify-center gap-3">
					<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
						Secondary (+1)
					</span>
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
	);
}
