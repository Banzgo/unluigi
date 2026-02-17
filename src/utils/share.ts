export interface MagicSharePayloadV1<TInputs = unknown> {
	v: 1;
	inputs: TInputs;
	spellType: string;
}

export type MagicSharePayload<TInputs = unknown> = MagicSharePayloadV1<TInputs>;

export interface CombatSharePayloadV1<TInputs = unknown> {
	v: 1;
	inputs: TInputs;
}

export type CombatSharePayload<TInputs = unknown> = CombatSharePayloadV1<TInputs>;

/**
 * Generic base64url-encoded JSON helpers used by both magic and combat sharing.
 */
export function encodeSharePayload<T>(payload: T): string {
	const json = JSON.stringify(payload);
	const utf8 = encodeURIComponent(json);
	const base64 = btoa(utf8);
	return toBase64Url(base64);
}

export function decodeSharePayload<T>(encoded: string): T | null {
	try {
		const base64 = fromBase64Url(encoded);
		const utf8 = atob(base64);
		const json = decodeURIComponent(utf8);
		return JSON.parse(json) as T;
	} catch {
		return null;
	}
}

// Backwards-compatible, domain-specific helpers

export function encodeMagicShareState<TInputs>(payload: MagicSharePayload<TInputs>): string {
	return encodeSharePayload(payload);
}

export function decodeMagicShareState<TInputs = unknown>(encoded: string): MagicSharePayload<TInputs> | null {
	const parsed = decodeSharePayload<MagicSharePayload<TInputs>>(encoded);
	if (!parsed || typeof parsed !== "object") return null;
	if (parsed.v !== 1) return null;
	if (!("inputs" in parsed)) return null;
	return parsed;
}

export function encodeCombatShareState<TInputs>(payload: CombatSharePayload<TInputs>): string {
	return encodeSharePayload(payload);
}

export function decodeCombatShareState<TInputs = unknown>(encoded: string): CombatSharePayload<TInputs> | null {
	const parsed = decodeSharePayload<CombatSharePayload<TInputs>>(encoded);
	if (!parsed || typeof parsed !== "object") return null;
	if (parsed.v !== 1) return null;
	if (!("inputs" in parsed)) return null;
	return parsed;
}

function toBase64Url(base64: string): string {
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(base64url: string): string {
	let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
	const paddingNeeded = base64.length % 4;
	if (paddingNeeded) {
		base64 += "=".repeat(4 - paddingNeeded);
	}
	return base64;
}
