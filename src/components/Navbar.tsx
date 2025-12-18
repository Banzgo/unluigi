import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Sparkles, Swords, X, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
	{ to: "/", label: "Combat", icon: Swords },
	{ to: "/magic", label: "Magic", icon: Sparkles },
	//{ to: "/about", label: "About", icon: Info },
] as const;

export function Navbar() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;

	// Close mobile menu on route change
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally trigger on route change
	useEffect(() => {
		setMobileMenuOpen(false);
	}, [currentPath]);

	// Close mobile menu on escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setMobileMenuOpen(false);
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, []);

	// Prevent body scroll when mobile menu is open
	useEffect(() => {
		if (mobileMenuOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [mobileMenuOpen]);

	return (
		<>
			{/* Desktop Navbar - Sticky */}
			<nav className="sticky top-0 z-50 hidden md:block bg-card/95 backdrop-blur-sm border-b border-border">
				<div className="max-w-6xl mx-auto px-6">
					<div className="flex items-center justify-between h-16">
						{/* Logo */}
						<Link to="/" className="flex items-center gap-2 group">
							<span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
								<span className="text-brand-green group-hover:text-brand-green-dark transition-colors">UNLUIGI</span>{" "}
								<span className="text-orange-500 group-hover:text-orange-500-dark transition-colors">APP</span>
							</span>
						</Link>

						{/* Desktop Navigation Links */}
						<div className="flex items-center gap-1">
							{navLinks.map((link) => {
								const isActive = currentPath === link.to;
								return (
									<Link
										key={link.to}
										to={link.to}
										className={cn(
											"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
											isActive
												? "bg-brand-green/20 text-brand-green"
												: "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
										)}
									>
										<link.icon className="w-4 h-4" />
										{link.label}
									</Link>
								);
							})}
						</div>
					</div>
				</div>
			</nav>

			{/* Mobile Navbar - Fixed Header */}
			<nav className="fixed top-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-sm border-b border-border">
				<div className="flex items-center justify-between h-14 px-4">
					{/* Logo */}
					<Link to="/" className="flex items-center">
						<span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
							<span className="text-brand-green">UNLUIGI</span>
						</span>
					</Link>

					{/* Hamburger Button */}
					<button
						type="button"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="p-2 rounded-lg text-foreground hover:bg-secondary/50 transition-colors"
						aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
						aria-expanded={mobileMenuOpen}
					>
						{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
					</button>
				</div>
			</nav>

			{/* Mobile Menu Overlay */}
			{mobileMenuOpen && (
				<button
					type="button"
					className="fixed inset-0 z-40 md:hidden bg-background/80 backdrop-blur-sm cursor-default"
					onClick={() => setMobileMenuOpen(false)}
					aria-label="Close menu"
				/>
			)}

			{/* Mobile Menu Panel */}
			<div
				className={cn(
					"fixed top-14 left-0 right-0 z-40 md:hidden bg-card border-b border-border transition-all duration-300 ease-out",
					mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none",
				)}
			>
				<div className="flex flex-col p-4 space-y-2">
					{navLinks.map((link) => {
						const isActive = currentPath === link.to;
						return (
							<Link
								key={link.to}
								to={link.to}
								className={cn(
									"flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200",
									isActive
										? "bg-brand-green/20 text-brand-green"
										: "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
								)}
							>
								<link.icon className="w-5 h-5" />
								{link.label}
							</Link>
						);
					})}
				</div>
			</div>

			{/* Mobile spacer to prevent content from going under fixed navbar */}
			<div className="h-14 md:hidden" />
		</>
	);
}
