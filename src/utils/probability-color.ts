export function getProbabilityColor(prob: number): string {
	if (prob >= 90) return "bg-emerald-500/30 text-emerald-300";
	if (prob >= 75) return "bg-green-500/25 text-green-300";
	if (prob >= 60) return "bg-lime-500/20 text-lime-300";
	if (prob >= 45) return "bg-yellow-500/20 text-yellow-300";
	if (prob >= 30) return "bg-orange-500/20 text-orange-300";
	if (prob >= 15) return "bg-red-500/20 text-red-300";
	return "bg-red-900/30 text-red-400";
}
