import { useState } from "react";
import type { ParsedUnit, PrimaryObjective, UnitStatus } from "../types";
import { extractPlayerName } from "../utils/parseList";
import { calculateResult, detectGameSize } from "../utils/scoring";
import { ArmyPanel } from "./ArmyPanel";
import { ScorePanel } from "./ScorePanel";

function makePlayer() {
	return { header: "", units: [] as ParsedUnit[], secondaryDone: false, declaredTotal: null as number | null };
}

export function MatchResultPage() {
	const [p1, setP1] = useState(makePlayer());
	const [p2, setP2] = useState(makePlayer());
	const [primary, setPrimary] = useState<PrimaryObjective>("neither");

	const handleP1Parsed = (header: string, units: ParsedUnit[], declaredTotal: number | null) =>
		setP1((prev) => ({ ...prev, header, units, declaredTotal }));
	const handleP2Parsed = (header: string, units: ParsedUnit[], declaredTotal: number | null) =>
		setP2((prev) => ({ ...prev, header, units, declaredTotal }));

	const handleP1Status = (id: string, status: UnitStatus) =>
		setP1((prev) => ({
			...prev,
			units: prev.units.map((u) => (u.id === id ? { ...u, status } : u)),
		}));
	const handleP2Status = (id: string, status: UnitStatus) =>
		setP2((prev) => ({
			...prev,
			units: prev.units.map((u) => (u.id === id ? { ...u, status } : u)),
		}));

	const rawTotal = Math.max(p1.declaredTotal ?? 0, p2.declaredTotal ?? 0);
	const gameSize = detectGameSize(rawTotal);
	// warn only when a list was pasted with a total that's far from any clean 500-increment
	const suspiciousTotal = rawTotal > 0 && Math.abs(rawTotal - gameSize) / gameSize > 0.025;

	const result = calculateResult({ player1: p1, player2: p2, primary }, gameSize);
	const p1Name = extractPlayerName(p1.header, "Player 1");
	const p2Name = extractPlayerName(p2.header, "Player 2");

	return (
		<div className="p-4 sm:p-6 lg:p-8">
			<div className="max-w-6xl mx-auto space-y-6">
				<h1 className="text-3xl sm:text-4xl font-bold text-center" style={{ fontFamily: "var(--font-display)" }}>
					<span className="text-brand-green">MATCH</span> <span className="text-orange-500">RESULT</span>
				</h1>

				<ScorePanel
					result={result}
					primary={primary}
					gameSize={gameSize}
					p1Name={p1Name}
					p2Name={p2Name}
					p1SecondaryDone={p1.secondaryDone}
					p2SecondaryDone={p2.secondaryDone}
					onPrimaryChange={setPrimary}
					onP1SecondaryChange={(v) => setP1((prev) => ({ ...prev, secondaryDone: v }))}
					onP2SecondaryChange={(v) => setP2((prev) => ({ ...prev, secondaryDone: v }))}
				/>

				{suspiciousTotal && (
					<div className="border-2 border-yellow-500/60 bg-yellow-500/10 rounded-xl p-4 text-center space-y-1">
						<p className="text-yellow-400 font-bold text-base">Unusual game size detected</p>
						<p className="text-yellow-400/80 text-sm">
							List total is {rawTotal} pts — rounded to {gameSize} pts for score thresholds. Check that the list total
							line is correct.
						</p>
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<ArmyPanel
						playerLabel="Player 1"
						units={p1.units}
						header={p1.header}
						declaredTotal={p1.declaredTotal}
						onListParsed={handleP1Parsed}
						onStatusChange={handleP1Status}
					/>
					<ArmyPanel
						playerLabel="Player 2"
						units={p2.units}
						header={p2.header}
						declaredTotal={p2.declaredTotal}
						onListParsed={handleP2Parsed}
						onStatusChange={handleP2Status}
					/>
				</div>

				<p className="text-xs text-muted-foreground/40 text-center pb-2">
					Game size: {gameSize} pts{rawTotal === 0 && " (default)"}
				</p>
			</div>
		</div>
	);
}
