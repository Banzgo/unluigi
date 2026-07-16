import { decodeUrlText, encodeUrlText } from "@/utils/share";

/**
 * Encode a raw army list (newline-separated unit lines) for the `l1` / `l2`
 * query parameters on `/matchresult`.
 *
 * @example
 * ```ts
 * import { encodeArmyListParam } from "@/matchresult/utils/listShare";
 *
 * const l1 = encodeArmyListParam(player1ListText);
 * const l2 = encodeArmyListParam(player2ListText);
 * const url = `/matchresult?l1=${l1}&l2=${l2}`;
 * // or: new URLSearchParams({ l1, l2 })
 * ```
 */
export function encodeArmyListParam(listText: string): string {
	return encodeUrlText(listText);
}

/** Decode an `l1` / `l2` query value back to the raw army list text. */
export function decodeArmyListParam(encoded: string): string | null {
	return decodeUrlText(encoded);
}
