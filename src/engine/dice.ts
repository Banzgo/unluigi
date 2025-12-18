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
 */
export function shouldReroll(
  roll: number,
  target: number | "auto" | "none",
  rerollType: "none" | "1s" | "successes" | "fails"
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
 * Check if a roll succeeds based on the target
 * @param roll The die roll value (1-6)
 * @param target The target number or special value
 * @returns True if the roll succeeds
 */
export function isSuccess(
  roll: number,
  target: number | "auto" | "none"
): boolean {
  if (target === "auto") {
    return true;
  }
  if (target === "none") {
    return false;
  }
  return roll >= target;
}
