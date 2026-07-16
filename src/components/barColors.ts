export const UNLUCKY_COLOR = "rgb(249, 115, 22)";
export const LUCKY_COLOR = "hsl(142, 76%, 36%)";
export const NEUTRAL_COLOR = "hsl(0, 0%, 60%)";

const TAIL_THRESHOLD = 10;

interface DistributionPoint {
	wounds: number;
	probability: number;
	cumulative: number;
}

// Colors a bucket unlucky/lucky only if the majority of its own probability mass
// falls within the bottom/top 10% tail — avoids mislabeling buckets that straddle
// the tail boundary but mostly sit outside it.
function computeBarColor(point: DistributionPoint): string {
	const bucketMass = point.probability;
	if (bucketMass <= 0) return NEUTRAL_COLOR;

	const before = point.cumulative - point.probability;
	const lowOverlap = Math.min(Math.max(TAIL_THRESHOLD - before, 0), bucketMass);
	if (lowOverlap / bucketMass > 0.5) return UNLUCKY_COLOR;

	const after = 100 - point.cumulative;
	const highOverlap = Math.min(Math.max(TAIL_THRESHOLD - after, 0), bucketMass);
	if (highOverlap / bucketMass > 0.5) return LUCKY_COLOR;

	return NEUTRAL_COLOR;
}

export function buildBarColorMap(distribution: DistributionPoint[]): Map<number, string> {
	return new Map(distribution.map((p) => [p.wounds, computeBarColor(p)]));
}
