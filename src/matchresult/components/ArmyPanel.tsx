import { Pencil } from "lucide-react";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { ParsedUnit, UnitStatus } from "../types";
import { extractArmyName, extractPlayerName, parseArmyList } from "../utils/parseList";
import { UnitRow } from "./UnitRow";

interface ArmyPanelProps {
	playerLabel: string;
	units: ParsedUnit[];
	header: string;
	declaredTotal: number | null;
	onListParsed: (header: string, units: ParsedUnit[], declaredTotal: number | null) => void;
	onStatusChange: (id: string, status: UnitStatus) => void;
}

export function ArmyPanel({
	playerLabel,
	units,
	header,
	declaredTotal,
	onListParsed,
	onStatusChange,
}: Readonly<ArmyPanelProps>) {
	const [rawText, setRawText] = useState("");
	const [editing, setEditing] = useState(true);
	const [error, setError] = useState("");

	const handleParse = () => {
		const result = parseArmyList(rawText);
		if (result.units.length === 0) {
			setError("No units found. Check format: each unit line starts with points like '295 - Unit Name'");
			return;
		}
		setError("");
		onListParsed(result.header, result.units, result.declaredTotal);
		setEditing(false);
	};

	const totalParsedPts = units.reduce((s, u) => s + u.points, 0);
	const displayName = extractPlayerName(header, playerLabel);
	const armyName = extractArmyName(header);

	const panelContent = (
		<>
			{editing && (
				<div className="space-y-2">
					<textarea
						value={rawText}
						onChange={(e) => setRawText(e.target.value)}
						placeholder="Paste army list here..."
						className="w-full h-48 p-3 text-sm font-mono bg-secondary/30 border border-border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-ring"
					/>
					{error && <p className="text-xs text-red-400">{error}</p>}
					<Button onClick={handleParse} size="sm" className="w-full">
						Parse List
					</Button>
				</div>
			)}

			{!editing && units.length > 0 && (
				<div>
					{armyName && <p className="text-sm font-semibold mb-2 text-foreground/80">{armyName}</p>}
					{units.map((unit) => (
						<UnitRow key={unit.id} unit={unit} onStatusChange={onStatusChange} />
					))}
					<p className="text-xs text-muted-foreground/50 text-right mt-2">
						{declaredTotal ?? totalParsedPts} pts total
					</p>
				</div>
			)}
		</>
	);

	const editButton = !editing && units.length > 0 && (
		<button
			type="button"
			onClick={() => setEditing(true)}
			className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
		>
			<Pencil className="w-3 h-3" />
			Edit list
		</button>
	);

	return (
		<>
			{/* Mobile: full panel inside accordion */}
			<div className="md:hidden">
				<Accordion type="single" collapsible defaultValue="panel">
					<AccordionItem value="panel" className="border border-border rounded-lg overflow-hidden">
						<AccordionTrigger className="px-3 py-2 bg-secondary/40 hover:bg-secondary/60 hover:no-underline transition-colors">
							<div className="flex items-center gap-3">
								<h2 className="text-lg font-bold uppercase tracking-wide">{displayName}</h2>
								{editButton}
							</div>
						</AccordionTrigger>
						<AccordionContent className="px-3 pb-3 pt-2">{panelContent}</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>

			{/* Desktop: always visible */}
			<div className="hidden md:flex md:flex-col md:gap-3">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-bold text-muted-foreground uppercase tracking-wide">{displayName}</h2>
					{editButton}
				</div>
				{panelContent}
			</div>
		</>
	);
}
