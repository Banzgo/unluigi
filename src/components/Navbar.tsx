import { Link, useRouterState } from "@tanstack/react-router";
import { Axe, Menu, ScrollText, Sparkles, Swords, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type NavSize = "desktop" | "mobile";

const SIZE_CLASSES: Record<NavSize, { link: string; icon: string }> = {
	desktop: { link: "gap-2 px-4 py-2 text-sm", icon: "w-4 h-4" },
	mobile: { link: "gap-3 px-4 py-3 text-base", icon: "w-5 h-5" },
};

function linkClassName(size: NavSize, active: boolean): string {
	return cn(
		`flex items-center rounded-lg font-medium transition-all duration-200 ${SIZE_CLASSES[size].link}`,
		active ? "bg-brand-green/20 text-brand-green" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
	);
}

interface ModeLink {
	label: string;
	mobileLabel: string;
	search?: { mode: "versus" };
	isActive: (path: string, mode: string | undefined) => boolean;
}

// The "/" route's two modes (plain combat vs versus) aren't in navLinks below
// because they share a path and are distinguished by a search param instead.
const MODE_LINKS: ModeLink[] = [
	{ label: "Combat", mobileLabel: "Combat Simulator", isActive: (path, mode) => path === "/" && !mode },
	{
		label: "Versus",
		mobileLabel: "Versus Mode",
		search: { mode: "versus" },
		isActive: (path, mode) => path === "/" && mode === "versus",
	},
];

function ModeNavLink({ link, active, size }: { link: ModeLink; active: boolean; size: NavSize }) {
	return (
		<Link to="/" search={link.search} className={linkClassName(size, active)}>
			<Swords className={SIZE_CLASSES[size].icon} />
			{size === "desktop" ? link.label : link.mobileLabel}
		</Link>
	);
}

const navLinks = [
	{ to: "/magic", label: "Magic", icon: Sparkles },
	{ to: "/pohjola", label: "Pohjola", icon: Axe },
	{ to: "/matchresult", label: "Match Result", icon: ScrollText },
	//{ to: "/about", label: "About", icon: Info },
] as const;

function AppNavLink({ link, active, size }: { link: (typeof navLinks)[number]; active: boolean; size: NavSize }) {
	const Icon = link.icon;
	return (
		<Link to={link.to} className={linkClassName(size, active)}>
			<Icon className={SIZE_CLASSES[size].icon} />
			{link.label}
		</Link>
	);
}

function NavLinks({ currentPath, mode, size }: { currentPath: string; mode: string | undefined; size: NavSize }) {
	return (
		<>
			{MODE_LINKS.map((link) => (
				<ModeNavLink key={link.label} link={link} active={link.isActive(currentPath, mode)} size={size} />
			))}
			{navLinks.map((link) => (
				<AppNavLink key={link.to} link={link} active={currentPath === link.to} size={size} />
			))}
		</>
	);
}

export function Navbar() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;
	const searchParams = routerState.location.search;

	// Close mobile menu on route change
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally trigger on route change
	useEffect(() => {
		setMobileMenuOpen(false);
	}, [currentPath, searchParams]);

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
							<NavLinks currentPath={currentPath} mode={searchParams.mode} size="desktop" />
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
							<span className="text-brand-green">UNLUIGI</span>{" "}
							<span className="text-orange-500 group-hover:text-orange-500-dark transition-colors">APP</span>
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
					<NavLinks currentPath={currentPath} mode={searchParams.mode} size="mobile" />
				</div>
			</div>

			{/* Mobile spacer to prevent content from going under fixed navbar */}
			<div className="h-14 md:hidden" />
		</>
	);
}
