import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/react";

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
