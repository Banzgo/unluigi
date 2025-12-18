import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/magic")({
	component: MagicPage,
});

function MagicPage() {
	return (
		<div className="p-4 sm:p-6 lg:p-8">
			<div className="max-w-4xl mx-auto space-y-6">
				{/* Title */}
				<h1
					className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center"
					style={{ fontFamily: "var(--font-display)" }}
				>
					<span className="text-purple-400">MAGIC</span> <span className="text-orange-500">PHASE</span>
				</h1>

				{/* Placeholder Content */}
				<Card className="p-8 sm:p-12 bg-card border-border">
					<div className="flex flex-col items-center justify-center text-center space-y-4">
						<div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
							<Sparkles className="w-10 h-10 text-purple-400" />
						</div>
						<h2 className="text-xl sm:text-2xl font-semibold text-foreground">Coming Soon</h2>
						<p className="text-muted-foreground max-w-md">
							The magic phase simulator is under development. Calculate spell casting probabilities, dispel chances, and
							magical effects.
						</p>
					</div>
				</Card>
			</div>
		</div>
	);
}
