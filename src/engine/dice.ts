/**
 * Basic dice rolling utilities for The Ninth Age simulator
 */

/**
 * Roll a single D6
 * @returns A random number between 1 and 6 (inclusive)
 */
export function rollD6(): number {
	return Math.floor(Math.random() * 6) + 1;
}

/**
 * Roll multiple D6 dice and return the sum
 * @param count Number of dice to roll
 * @returns Sum of all dice rolled
 */
export function rollMultipleD6(count: number): number {
	let sum = 0;
	for (let i = 0; i < count; i++) {
		sum += rollD6();
	}
	return sum;
}

/**
 * Roll a D3 (simulated as (D6+1)/2 rounded down)
 * @returns A random number between 1 and 3 (inclusive)
 */
export function rollD3(): number {
	return Math.ceil(rollD6() / 2);
}

/**
 * Roll casting dice based on bound spell rules
 * - Regular spell: all D6
 * - Bound spell: first die is D6, rest are D3
 * @param count Number of dice to roll
 * @param isBoundSpell Whether this is a bound spell
 * @returns Array of individual die rolls
 */
export function rollCastingDice(count: number, isBoundSpell: boolean): number[] {
	const rolls: number[] = [];
	for (let i = 0; i < count; i++) {
		if (isBoundSpell && i > 0) {
			rolls.push(rollD3());
		} else {
			rolls.push(rollD6());
		}
	}
	return rolls;
}

/**
 * Roll multiple D6 dice and return each individual roll
 * @param count Number of dice to roll
 * @returns Array of individual die rolls
 */
export function rollDispelDice(count: number): number[] {
	const rolls: number[] = [];
	for (let i = 0; i < count; i++) {
		rolls.push(rollD6());
	}
	return rolls;
}

/**
 * Parse dice expression and return the result
 * Supports: "d6", "2d6", "d3", "2d6+3", "d3+1", or plain numbers
 * @param expression The dice expression to parse
 * @returns The result of rolling the expression
 */
export function parseDiceExpression(expression: string | number): number {
	// If it's already a number, return it
	if (typeof expression === "number") {
		return expression;
	}

	// Remove all whitespace
	const expr = expression.replace(/\s+/g, "").toLowerCase();

	// If it's just a plain number string
	if (/^\d+$/.test(expr)) {
		return Number.parseInt(expr, 10);
	}

	// Match pattern: [count]d[sides][+/-modifier]
	// Examples: "d6", "2d6", "d3", "2d6+3", "3d3+1"
	const match = expr.match(/^(\d*)d([36])([+-]\d+)?$/);

	if (!match) {
		throw new Error(`Invalid dice expression: ${expression}`);
	}

	const count = match[1] ? Number.parseInt(match[1], 10) : 1;
	const sides = Number.parseInt(match[2], 10);
	const modifier = match[3] ? Number.parseInt(match[3], 10) : 0;

	if (sides !== 3 && sides !== 6) {
		throw new Error(`Only d3 and d6 are supported, got d${sides}`);
	}

	let result = 0;
	if (sides === 6) {
		result = rollMultipleD6(count);
	} else if (sides === 3) {
		for (let i = 0; i < count; i++) {
			result += rollD3();
		}
	}

	return result + modifier;
}

/**
 * Check if a die roll should be rerolled based on the reroll type
 * @param roll The original roll value (1-6)
 * @param target The target number needed to succeed
 * @param rerollType Type of reroll to apply
 * @returns True if the roll should be rerolled
 * @deprecated Use shouldRerollSplit instead for the new success/failure reroll system
 */
export function shouldReroll(
	roll: number,
	target: number | "auto" | "none",
	rerollType: "none" | "1s" | "successes" | "fails",
): boolean {
	if (rerollType === "none") {
		return false;
	}

	if (target === "auto") {
		// Auto-success: only reroll successes would apply (but doesn't make sense)
		return rerollType === "successes";
	}

	if (target === "none") {
		// Auto-fail: only reroll fails would apply
		return rerollType === "fails";
	}

	const isSuccess = roll >= target;

	switch (rerollType) {
		case "1s":
			return roll === 1;
		case "successes":
			return isSuccess;
		case "fails":
			return !isSuccess;
		default:
			return false;
	}
}

/**
 * Check if a die roll should be rerolled based on split success/failure reroll types.
 * A die can only be rerolled once - this function determines if ANY reroll applies.
 * @param roll The original roll value (1-6)
 * @param target The target number needed to succeed
 * @param failureReroll Type of failure reroll: 'none' | '1s' | 'all'
 * @param successReroll Type of success reroll: 'none' | '6s' | 'all'
 * @returns True if the roll should be rerolled
 */
export function shouldRerollSplit(
	roll: number,
	target: number | "auto" | "none",
	failureReroll: "none" | "1s" | "all",
	successReroll: "none" | "6s" | "all",
): boolean {
	// If both are none, no reroll
	if (failureReroll === "none" && successReroll === "none") {
		return false;
	}

	// Determine if this roll is a success or failure
	let rollIsSuccess: boolean;
	if (target === "auto") {
		rollIsSuccess = true;
	} else if (target === "none") {
		rollIsSuccess = false;
	} else {
		rollIsSuccess = roll >= target;
	}

	// Check failure rerolls (for failed rolls)
	if (!rollIsSuccess) {
		if (failureReroll === "all") {
			return true;
		}
		if (failureReroll === "1s" && roll === 1) {
			return true;
		}
	}

	// Check success rerolls (for successful rolls)
	if (rollIsSuccess) {
		if (successReroll === "all") {
			return true;
		}
		if (successReroll === "6s" && roll === 6) {
			return true;
		}
	}

	return false;
}

/**
 * Check if a roll succeeds based on the target
 * @param roll The die roll value (1-6)
 * @param target The target number or special value
 * @returns True if the roll succeeds
 */
export function isSuccess(roll: number, target: number | "auto" | "none"): boolean {
	if (target === "auto") {
		return true;
	}
	if (target === "none") {
		return false;
	}
	return roll >= target;
}
