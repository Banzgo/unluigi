import type { ParsedUnit } from "../types";

export function extractPlayerName(header: string, fallback: string): string {
	if (!header) return fallback;
	const dashIdx = header.indexOf(" - ");
	return dashIdx !== -1 ? header.slice(0, dashIdx).trim() : header.trim();
}

export function extractArmyName(header: string): string {
	if (!header) return "";
	const dashIdx = header.indexOf(" - ");
	return dashIdx !== -1 ? header.slice(dashIdx + 3).trim() : "";
}

function parseDescription(desc: string): { countName: string; options: string } {
	const commaIdx = desc.indexOf(",");
	if (commaIdx === -1) return { countName: desc.trim(), options: "" };
	return {
		countName: desc.slice(0, commaIdx).trim(),
		options: desc.slice(commaIdx + 1).trim(),
	};
}

export interface ParsedList {
	header: string;
	units: ParsedUnit[];
	declaredTotal: number | null;
}

export function parseArmyList(raw: string): ParsedList {
	const rawLines = raw
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean);

	// Merge wrapped continuation lines (no leading point value) into
	// the previous logical line, so a unit's option list can span
	// multiple source lines.
	const lines: string[] = [];
	for (const line of rawLines) {
		const startsNewLine = /^\d+\s*-\s*/.test(line) || /^\d+$/.test(line);
		if (startsNewLine || lines.length === 0) {
			lines.push(line);
		} else {
			lines[lines.length - 1] = `${lines.at(-1)} ${line}`;
		}
	}

	let header = "";
	const units: ParsedUnit[] = [];
	let unitIndex = 0;
	let declaredTotal: number | null = null;

	for (const line of lines) {
		// Solo number → total line, capture and skip
		if (/^\d+$/.test(line)) {
			declaredTotal = Number.parseInt(line, 10);
			continue;
		}

		// Unit line: starts with digits then " - "
		const unitMatch = new RegExp(/^(\d+)\s*-\s*(.+)$/).exec(line);
		if (unitMatch) {
			const points = Number.parseInt(unitMatch[1], 10);
			const { countName, options } = parseDescription(unitMatch[2]);
			units.push({
				id: `unit-${unitIndex++}`,
				points,
				countName,
				options,
				status: "alive",
			});
			continue;
		}

		// First non-matching line = header
		if (!header) {
			header = line;
		}
	}

	return { header, units, declaredTotal };
}
