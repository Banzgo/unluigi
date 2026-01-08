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
			<Navbar />
			<Outlet />
		</div>
	);
}
