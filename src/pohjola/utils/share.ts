import { decodeSharePayload, encodeSharePayload } from "../../utils/share";
import type { PohjolaInputState } from "../components/PohjolaInput";

export interface PohjolaSharePayloadV1 {
	v: 1;
	inputs: Partial<PohjolaInputState>;
}

export function encodePohjolaShareState(payload: PohjolaSharePayloadV1): string {
	return encodeSharePayload(payload);
}

export function decodePohjolaShareState(encoded: string): PohjolaSharePayloadV1 | null {
	const parsed = decodeSharePayload<PohjolaSharePayloadV1>(encoded);
	if (!parsed || typeof parsed !== "object") return null;
	if (parsed.v !== 1) return null;
	if (!("inputs" in parsed)) return null;
	return parsed;
}
