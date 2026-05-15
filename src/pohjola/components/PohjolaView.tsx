import { useState } from "react";
import type { PohjolaSimulationResults } from "../engine/types";
import { PohjolaChart } from "./PohjolaChart";
import { PohjolaInput, type PohjolaInputState } from "./PohjolaInput";

interface PohjolaViewProps {
	initialState?: Partial<PohjolaInputState>;
	autoRun?: boolean;
}

export function PohjolaView({ initialState, autoRun }: PohjolaViewProps) {
	const [results, setResults] = useState<PohjolaSimulationResults | null>(null);

	return (
		<div className="space-y-4">
			<PohjolaInput initialState={initialState} autoRun={autoRun} onResults={setResults} />
			{results && <PohjolaChart results={results} />}
		</div>
	);
}
