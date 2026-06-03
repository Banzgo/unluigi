import { encodeSharePayload, validateSharePayload } from "../../utils/share";
import type { PohjolaInputState } from "../components/PohjolaInput";

export interface PohjolaSharePayloadV1 {
	v: 1;
	inputs: Partial<PohjolaInputState>;
}

export function encodePohjolaShareState(payload: PohjolaSharePayloadV1): string {
	return encodeSharePayload(payload);
}

export function decodePohjolaShareState(encoded: string): PohjolaSharePayloadV1 | null {
	return validateSharePayload<PohjolaSharePayloadV1>(encoded);
}
