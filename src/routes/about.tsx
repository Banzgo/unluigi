import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
	component: AboutPage,
});

function AboutPage() {
	return (
		<div className="p-4 sm:p-6 lg:p-8">
			<div className="max-w-4xl mx-auto space-y-6">
				{/* Title */}
				<h1
					className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center"
					style={{ fontFamily: "var(--font-display)" }}
				>
					<span className="text-brand-green">ABOUT</span> <span className="text-orange-500">UNLUIGI</span>
				</h1>

				{/* About Content */}
				<Card className="p-6 sm:p-8 bg-card border-border space-y-6">
					<section className="space-y-3">
						<h2 className="text-xl font-semibold text-brand-green">What is UNLUIGI?</h2>
						<p className="text-muted-foreground leading-relaxed">
							UNLUIGI is a probability calculator and simulator for tabletop wargaming. It helps you understand the
							statistical outcomes of combat and magic phases, so you can make more informed tactical decisions.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-semibold text-brand-green">Features</h2>
						<ul className="text-muted-foreground space-y-2">
							<li className="flex items-start gap-2">
								<span className="text-brand-green mt-1">•</span>
								<span>Monte Carlo simulation with 10,000 iterations for accurate probability distributions</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-brand-green mt-1">•</span>
								<span>Support for complex dice expressions (e.g., "2d6+3", "d3")</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-brand-green mt-1">•</span>
								<span>Reroll mechanics for hits, wounds, and saves (including enemy rerolls)</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-brand-green mt-1">•</span>
								<span>Special abilities like Poison, Lethal Strike, and Battle Fury</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-brand-green mt-1">•</span>
								<span>Multiple wound mechanics with target wound cap support</span>
							</li>
						</ul>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-semibold text-brand-green">How It Works</h2>
						<p className="text-muted-foreground leading-relaxed">
							The simulator runs thousands of combat iterations using your input parameters, tracking the actual
							distribution of outcomes. This gives you not just an average, but a complete picture of what results you
							can expect - from best case to worst case scenarios.
						</p>
					</section>
				</Card>

				{/* Footer */}
				<div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
					<span>Made with</span>
					<Heart className="w-4 h-4 text-red-500 fill-red-500" />
					<span>for the wargaming community</span>
				</div>
			</div>
		</div>
	);
}
