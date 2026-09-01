import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { Navbar } from "@/components/Navbar";

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	return (
		<div className="min-h-screen bg-background">
			<Analytics />
			{/* Prevent Google from appending UI labels to the search snippet */}
			<div data-nosnippet>
				<Navbar />
				<Outlet />
			</div>
		</div>
	);
}
